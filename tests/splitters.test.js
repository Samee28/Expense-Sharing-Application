import { describe, it, expect } from 'vitest';
import { computeShares, round2 } from '../src/domain/splitters.js';

describe('splitCalculations', () => {
  it('equal split works', () => {
    const res = computeShares({
      amount: 100,
      splitType: 'EQUAL',
      splits: [{ userId: 'a', value: 1 }, { userId: 'b', value: 1 }, { userId: 'c', value: 1 }],
      groupId: 'g1',
      payerId: 'a'
    });
    expect(res.length).toBe(3);
    const total = res.reduce((acc, s) => acc + s.amount, 0);
    expect(round2(total)).toBe(100);
  });

  it('exact split validates sum', () => {
    expect(() => computeShares({
      amount: 100,
      splitType: 'EXACT',
      splits: [{ userId: 'a', value: 40 }, { userId: 'b', value: 50 }],
      groupId: 'g1',
      payerId: 'a'
    })).toThrow();
  });

  it('percent split validates 100%', () => {
    expect(() => computeShares({
      amount: 100,
      splitType: 'PERCENT',
      splits: [{ userId: 'a', value: 40 }, { userId: 'b', value: 50 }],
      groupId: 'g1',
      payerId: 'a'
    })).toThrow();
  });
});
