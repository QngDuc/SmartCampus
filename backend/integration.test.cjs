const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const axios = require('axios');
const { createApp } = require('./server');

test('shared backend serves timetable and map with preserved CRUD policy', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'smart-campus-'));
  const server = http.createServer(createApp({ dataFile: path.join(directory, 'campus.json'), adminToken: 'test', origins: ['http://localhost:8081'] }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); fs.rmSync(directory, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base + '/')).status, 200);
  const map = await (await fetch(base + '/api/map')).json();
  assert.ok(map.destinations.length > 0);
  assert.equal((await fetch(base + '/api/routes?from=10&to=1')).status, 200);
  assert.equal((await fetch(base + '/api/map', { headers: { Origin: 'https://unknown.example' } })).status, 403);
  const options = { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' }, body: JSON.stringify({ ...map.nodes[0], id: 'integration-node' }) };
  assert.equal((await fetch(base + '/api/nodes', options)).status, 201);
  assert.equal((await fetch(base + '/api/nodes', { ...options, headers: { 'Content-Type': 'application/json' } })).status, 401);
  assert.equal((await fetch(base + '/api/timetable/invalid')).status, 400);
  const post = axios.post;
  axios.post = async () => ({ data: '<b>23103047</b><b>Student</b><table><tr><th>Session</th><th>CN</th></tr><tr><td>Morning</td><td>HP: Math (1-3) GV: Teacher Phòng: A101</td></tr></table>' });
  try {
    const result = await (await fetch(base + '/api/timetable/23103047')).json();
    assert.equal(result.student.id, '23103047');
    assert.equal(result.schedules[0].subject, 'Math');
    assert.equal(result.schedules[0].room, 'A101');
  } finally { axios.post = post; }
});
