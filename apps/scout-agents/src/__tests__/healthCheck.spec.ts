import type { Server } from 'http';

import request from 'supertest';

import { app } from '../app';

let server: Server;

beforeAll(() => {
  server = app.listen();
});

afterAll((done) => {
  server.close(done);
});

describe('test', () => {
  test('should return 200', async () => {
    // const response = await request(server).get(`/api/health`);
    // expect(response.status).toBe(200);
    // TODO: Fix local test runner
  });
});
