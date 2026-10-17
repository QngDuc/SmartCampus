const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authRouter = require('../routes/auth');

const password = 'correct-password';
const jwtSecret = 'test-jwt-secret';
let server;
let loginUrl;
let originalJwtSecret;

before(async () => {
  originalJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = jwtSecret;

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  loginUrl = `http://127.0.0.1:${server.address().port}/api/auth/login`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close(error => (error ? reject(error) : resolve()));
  });
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

async function makeUser(overrides = {}) {
  return {
    _id: { toString: () => 'student-user-id' },
    studentId: '23103047',
    name: 'Test Student',
    email: 'student@example.test',
    passwordHash: await bcrypt.hash(password, 4),
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
    },
    ...overrides,
  };
}

async function postLogin(user, submittedPassword = password) {
  const originalFindOne = User.findOne;
  User.findOne = () => ({ select: async () => user });
  try {
    return await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: user.studentId, password: submittedPassword }),
    });
  } finally {
    User.findOne = originalFindOne;
  }
}

test('successful login saves a UTC Date and preserves the response contract', async () => {
  const user = await makeUser();
  const response = await postLogin(user);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(user.lastLogin instanceof Date);
  assert.ok(user.lastLogin.toISOString().endsWith('Z'));
  assert.equal(user.saveCalls, 1);
  assert.deepEqual(Object.keys(body).sort(), ['token', 'user']);
  assert.equal(body.user.lastLogin, undefined);
  assert.equal(jwt.verify(body.token, jwtSecret).sub, 'student-user-id');
});

test('incorrect password does not save lastLogin', async () => {
  const user = await makeUser();
  const response = await postLogin(user, 'wrong-password');

  assert.equal(response.status, 401);
  assert.equal(user.lastLogin, undefined);
  assert.equal(user.saveCalls, 0);
});

test('inactive account cannot login or update lastLogin', async () => {
  const user = await makeUser({ isActive: false });
  const response = await postLogin(user);

  assert.equal(response.status, 403);
  assert.equal(user.lastLogin, undefined);
  assert.equal(user.saveCalls, 0);
});