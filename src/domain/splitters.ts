import { ExpenseInput, ID } from "../types";

export function computeShares(input: ExpenseInput): Array<{ userId: ID; amount: number }> {
  const { splitType, splits, amount } = input;
  if (amount <= 0 || !Number.isFinite(amount)) throw new Error("Amount must be a positive number");
  const memberIds = splits.map(s => s.userId);
  if (new Set(memberIds).size !== memberIds.length) throw new Error("Duplicate user in splits");

  if (splitType === "EQUAL") {
    if (splits.length === 0) throw new Error("At least one participant required");
    const equal = round2(amount / splits.length);
    // Adjust last share to fix rounding drift
    const shares = splits.map(s => ({ userId: s.userId, amount: equal }));
    const diff = round2(amount - shares.reduce((a, b) => a + b.amount, 0));
    shares[shares.length - 1].amount = round2(shares[shares.length - 1].amount + diff);
    return shares;
  }

  if (splitType === "EXACT") {
    const total = round2(splits.reduce((acc, s) => acc + s.value, 0));
    if (!nearlyEqual(total, amount)) throw new Error(`Exact splits must sum to ${amount}, got ${total}`);
    return splits.map(s => ({ userId: s.userId, amount: round2(s.value) }));
  }

  if (splitType === "PERCENT") {
    const totalPercent = round2(splits.reduce((acc, s) => acc + s.value, 0));
    if (!nearlyEqual(totalPercent, 100)) throw new Error("Percent splits must sum to 100");
    const shares = splits.map(s => ({ userId: s.userId, amount: round2((s.value / 100) * amount) }));
    const diff = round2(amount - shares.reduce((a, b) => a + b.amount, 0));
    shares[shares.length - 1].amount = round2(shares[shares.length - 1].amount + diff);
    return shares;
  }

  throw new Error("Unsupported split type");
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(round2(a) - round2(b)) < 0.01;
}
