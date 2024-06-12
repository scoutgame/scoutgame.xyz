import { app } from 'connect-api/src/server';
import request from 'supertest';

beforeAll(async () => {});

describe('GET /api/random-number', () => {
  // Simple heuristic, admin can always see everything
  it('should return a random number and respond 200', async () => {
    const response = (await request(app.callback()).get(`/api/random-number`).expect(200)).body;

    expect(response).toMatchObject({
      number: expect.any(Number)
    });
  });
});
