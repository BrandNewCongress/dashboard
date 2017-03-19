const test = require('ava');
const request = require('supertest');

const app = require('../lib/app');

test('GET / returns 200', async t => {
  await request(app)
    .get('/')
    .expect(200);
  t.pass();
});
