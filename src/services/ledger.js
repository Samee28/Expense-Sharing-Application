import { store } from "../store/memory.js";
import { computeShares, round2 } from "../domain/splitters.js";

const now = () => new Date().toISOString();
const nid = () => Math.random().toString(36).slice(2, 10);

export function createExpense(input) {
  ensureGroupAndMembers(input.groupId, [input.payerId, ...input.splits.map(s => s.userId)]);
  const expense = { id: nid(), createdAt: now(), ...input };
  store.addExpense(expense);

  const shares = computeShares(input);
  for (const share of shares) {
    if (share.userId === expense.payerId) continue; // payer doesn't owe themselves
    const entry = {
      id: nid(),
      groupId: expense.groupId,
      createdAt: now(),
      type: {
        kind: "EXPENSE_SPLIT",
        expenseId: expense.id,
        fromUserId: share.userId,
        toUserId: expense.payerId,
        amount: round2(share.amount)
      },
      metadata: { description: input.description ?? "", total: input.amount, splitType: input.splitType }
    };
    store.addLedger(entry);
  }
  return expense;
}

export function createSettlement(groupId, fromUserId, toUserId, amount, note) {
  if (amount <= 0) throw new Error("Settlement amount must be positive");
  ensureGroupAndMembers(groupId, [fromUserId, toUserId]);
  const settlement = { id: nid(), groupId, fromUserId, toUserId, amount: round2(amount), createdAt: now(), note };
  store.addSettlement(settlement);
  const entry = {
    id: nid(), groupId, createdAt: now(),
    type: { kind: "SETTLEMENT", settlementId: settlement.id, fromUserId, toUserId, amount: settlement.amount },
    metadata: { note }
  };
  store.addLedger(entry);
  return settlement;
}

function ensureGroupAndMembers(groupId, userIds) {
  const g = store.groups.get(groupId);
  if (!g) throw new Error("Group not found");
  for (const uid of userIds) {
    if (!store.users.get(uid)) throw new Error(`User ${uid} not found`);
    if (!g.memberIds.includes(uid)) throw new Error(`User ${uid} not in group`);
  }
}
