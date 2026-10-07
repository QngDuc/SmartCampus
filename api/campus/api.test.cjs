const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApi } = require('./api.cjs');
const { route, validateGraph } = require('./graph.cjs');
const seed = require('./seed.json');

// Dùng thư mục tạm và cổng tự cấp để kiểm thử API mà không sửa dữ liệu đang dùng.
// Bao gồm quyền ghi, CRUD, dữ liệu sai, CORS và đọc lại dữ liệu sau khi khởi động lại.
test('HTTP CRUD, validation, routing and persistence', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'campus-api-'));
  const dataFile = path.join(directory, 'campus.json');
  let server;
  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  async function start() {
    server = createApi({ dataFile, adminToken: 'test-token', origins: ['http://localhost:8081'] });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return `http://127.0.0.1:${server.address().port}/api`;
  }
  let base = await start();
  async function request(method, endpoint, payload, status = 200, authorized = true) {
    const response = await fetch(base + endpoint, { method, headers: { 'Content-Type': 'application/json', ...(authorized ? { Authorization: 'Bearer test-token' } : {}) }, body: payload === undefined ? undefined : JSON.stringify(payload) });
    const data = response.status === 204 ? null : await response.json();
    assert.equal(response.status, status, JSON.stringify(data));
    return data;
  }
  const original = await request('GET', '/map');
  const initialRoute = await request('GET', '/routes?from=10&to=1');
  assert.ok(initialRoute.meters > 0);
  assert.deepEqual(await request('POST', '/routes', { from: '10', to: '1' }), initialRoute);
  await request('GET', '/routes?from=10&to=missing', undefined, 404);
  await request('POST', '/routes', { from: 10, to: 1 }, 400);
  await request('POST', '/nodes', {}, 401, false);
  const node = { ...original.nodes.find(n => n.id === 'gate'), id: 'test-node' };
  await request('POST', '/nodes', node, 201);
  await request('POST', '/nodes', node, 409);
  await request('POST', '/nodes', { ...node, id: 'outside', latitude: 0, longitude: 0 }, 400);
  await request('POST', '/destinations', { id: 'test-place', name: 'Test', nodeId: node.id }, 201);
  await request('DELETE', '/nodes/test-node', undefined, 409);
  await request('PUT', '/destinations/test-place', { id: 'test-place', name: 'Updated', nodeId: node.id });
  await request('PATCH', '/destinations/test-place', { name: 'Renamed' });
  await request('PATCH', '/destinations/test-place', { id: 'changed' }, 400);
  await request('PUT', '/destinations/test-place', { name: 'Missing fields' }, 400);
  await request('PATCH', '/nodes/test-node', { unknown: true }, 400);
  const edge = original.edges.find(e => e.to === 'p1');
  await request('PATCH', `/edges/${edge.id}`, { closed: true });
  await request('GET', '/routes?from=10&to=1', undefined, 422);
  await request('PATCH', `/edges/${edge.id}`, { closed: false });
  await request('GET', '/routes?from=10&to=1');
  const invalidJson = await fetch(base + '/nodes', { method: 'POST', headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(invalidJson.status, 400);
  assert.equal((await fetch(base + '/map', { headers: { Origin: 'https://unknown.example' } })).status, 403);
  const preflight = await fetch(base + '/nodes', { method: 'OPTIONS', headers: { Origin: 'http://localhost:8081' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:8081');
  await Promise.all(['a', 'b'].map(suffix => request('POST', '/nodes', { ...node, id: `concurrent-${suffix}` }, 201)));
  await new Promise(resolve => server.close(resolve));
  base = await start();
  assert.equal((await request('GET', '/destinations/test-place')).name, 'Renamed');
  await request('GET', '/nodes/concurrent-a');
  await request('GET', '/nodes/concurrent-b');
  assert.ok((await request('GET', '/map')).version > original.version);
  await request('DELETE', '/destinations/test-place', undefined, 204);
  await request('DELETE', '/nodes/test-node', undefined, 204);
  await request('GET', '/nodes/test-node', undefined, 404);
});

// Mạng đường nhỏ có tuyến trực tiếp và đường vòng để kiểm chứng lựa chọn của thuật toán.
test('multiple paths, one-way edges, closures and campus boundary', () => {
  const graph = { version: 1, boundary: [{ latitude: -1, longitude: -1 }, { latitude: -1, longitude: 1 }, { latitude: 1, longitude: 1 }, { latitude: 1, longitude: -1 }],
    nodes: [{ id: 'a', latitude: 0, longitude: 0 }, { id: 'b', latitude: 0, longitude: 0.01 }, { id: 'c', latitude: 0.01, longitude: 0.005 }],
    destinations: [{ id: 'start', name: 'Start', nodeId: 'a' }, { id: 'end', name: 'End', nodeId: 'b' }],
    edges: [{ id: 'direct', from: 'a', to: 'b', bidirectional: false, closed: false }, { id: 'detour1', from: 'a', to: 'c', bidirectional: true, closed: false }, { id: 'detour2', from: 'c', to: 'b', bidirectional: true, closed: false }] };
  validateGraph(graph);
  assert.deepEqual(route(graph, 'start', 'end').edgeIds, ['direct']);
  assert.deepEqual(route(graph, 'end', 'start').edgeIds, ['detour2', 'detour1']);
  graph.edges[0].closed = true;
  assert.deepEqual(route(graph, 'start', 'end').edgeIds, ['detour1', 'detour2']);
  graph.edges[1].closed = true;
  assert.throws(() => route(graph, 'start', 'end'), { status: 422 });
  graph.nodes[0].latitude = 2;
  assert.throws(() => validateGraph(graph), { status: 400 });
  // Hai đầu trong đa giác lõm nhưng đoạn nối cắt qua phần ngoài trường.
  const concave = { ...graph, boundary: [[0, 0], [0, 3], [3, 3], [3, 2], [1, 2], [1, 1], [3, 1], [3, 0]].map(([latitude, longitude]) => ({ latitude, longitude })), nodes: [{ id: 'a', latitude: 2, longitude: 0.5 }, { id: 'b', latitude: 2, longitude: 2.5 }], edges: [{ id: 'cut', from: 'a', to: 'b', bidirectional: true, closed: false }] };
  assert.throws(() => validateGraph(concave), { status: 400 });
});

// Kiểm tra mọi cặp địa điểm trong seed; đi từ một điểm tới chính nó phải dài 0 mét.
test('all 196 seeded destination pairs are routable', () => {
  validateGraph(seed);
  for (const from of seed.destinations) for (const to of seed.destinations) {
    const result = route(seed, from.id, to.id);
    assert.ok(result.points.length > 0);
    if (from.id === to.id) assert.equal(result.meters, 0);
  }
});
