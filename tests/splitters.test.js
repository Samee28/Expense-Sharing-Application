"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const splitters_1 = require("../src/domain/splitters");
const base = {
    groupId: 'g1',
    payerId: 'u1',
    amount: 100,
    description: 'Test',
    splits: [{ userId: 'u1', value: 1 }, { userId: 'u2', value: 1 }, { userId: 'u3', value: 1 }]
};
describe('splitters', () => {
    it('equal split', () => {
        const shares = (0, splitters_1.computeShares)({ ...base, splitType: 'EQUAL' });
        expect(shares.reduce((a, b) => a + b.amount, 0)).toBe(100);
        expect(shares.find(s => s.userId === 'u2').amount).toBeCloseTo(33.33, 2);
    });
    it('exact split', () => {
        const shares = (0, splitters_1.computeShares)({ ...base, splitType: 'EXACT', splits: [
                { userId: 'u1', value: 10 },
                { userId: 'u2', value: 20 },
                { userId: 'u3', value: 70 },
            ] });
        expect(shares.find(s => s.userId === 'u3').amount).toBe(70);
    });
    it('percent split', () => {
        const shares = (0, splitters_1.computeShares)({ ...base, splitType: 'PERCENT', splits: [
                { userId: 'u1', value: 10 },
                { userId: 'u2', value: 20 },
                { userId: 'u3', value: 70 },
            ] });
        expect(shares.find(s => s.userId === 'u2').amount).toBeCloseTo(20, 2);
    });
});
