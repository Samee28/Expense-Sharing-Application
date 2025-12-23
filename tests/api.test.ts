import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/server';
import { store } from '../src/store/memory';

describe('Expense Sharing API', () => {
  beforeEach(() => {
    store.reset();
  });

  it('creates users, group, expense (equal), computes balances and settlement', async () => {
    const u1 = await request(app).post('/users').send({ name: 'Alice' }).expect(201).then(r => r.body);
    const u2 = await request(app).post('/users').send({ name: 'Bob' }).expect(201).then(r => r.body);
    const u3 = await request(app).post('/users').send({ name: 'Cara' }).expect(201).then(r => r.body);

    const g = await request(app).post('/groups').send({ name: 'Trip', memberIds: [u1.id, u2.id, u3.id] }).expect(201).then(r => r.body);

    // Alice paid  ninety 90 equally
    await request(app).post('/expenses').send({
      groupId: g.id,
      payerId: u1.id,
      amount:  ninetyToNum(90),
      description: 'Dinner',
      splitType: 'EQUAL',
      splits: [
        { userId: u1.id, value: 1 },
        { userId: u2.id, value: 1 },
        { userId: u3.id, value: 1 }
      ]
    }).expect(201);

    const bal1 = await request(app).get(`/balances/${g.id}`).expect(200).then(r => r.body);
    expectClose(bal1.totalsByUser[u1.id], 60); // Alice is owed 60
    expectClose(bal1.totalsByUser[u2.id], -30);
    expectClose(bal1.totalsByUser[u3.id], -30);
    // simplified: Bob->Alice 30, Cara->Alice 30
    expect(bal1.simplified).toHaveLength(2);

    // Bob pays Alice 30
    await request(app).post('/settlements').send({ groupId: g.id, fromUserId: u2.id, toUserId: u1.id, amount: 30 }).expect(201);

    const bal2 = await request(app).get(`/balances/${g.id}`).expect(200).then(r => r.body);
    expectClose(bal2.totalsByUser[u1.id], 30);
    expectClose(bal2.totalsByUser[u2.id], 0);
    expectClose(bal2.totalsByUser[u3.id], -30);
  });
});

function expectClose(actual: number, expected: number, tol = 0.01) {
  expect(Math.abs((actual ?? 0) - expected)).toBeLessThanOrEqual(tol);
}

function ninetyToNum(n: number) { return n; }
