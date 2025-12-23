import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { store } from '../src/store/memory.js';

describe('api flow', () => {
  beforeEach(() => {
    store.reset();
  });

  it('basic expense flow works', async () => {
    // Create users
    const u1 = (await request(app).post('/users').send({ name: 'Alice' })).body;
    const u2 = (await request(app).post('/users').send({ name: 'Bob' })).body;

    // Create group
    const grp = (await request(app).post('/groups').send({ name: 'Trip', memberIds: [u1.id, u2.id] })).body;

    // Add expense
    const exp = await request(app).post('/expenses').send({
      groupId: grp.id,
      payerId: u1.id,
      amount: 100,
      splitType: 'EQUAL',
      splits: [{ userId: u1.id, value: 1 }, { userId: u2.id, value: 1 }]
    });
    expect(exp.status).toBe(201);

    // Check balances
    const bal = (await request(app).get(`/balances/${grp.id}`)).body;
    expect(bal.totalsByUser[u1.id]).toBeGreaterThan(0);
    expect(bal.totalsByUser[u2.id]).toBeLessThan(0);
  });
});
