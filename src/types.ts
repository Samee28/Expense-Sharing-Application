export type ID = string;

export type SplitType = "EQUAL" | "EXACT" | "PERCENT";

export interface User {
  id: ID;
  name: string;
}

export interface Group {
  id: ID;
  name: string;
  memberIds: ID[];
}

export interface ExpenseInput {
  groupId: ID;
  payerId: ID; // who paid upfront
  amount: number; // total
  description?: string;
  splitType: SplitType;
  splits: Array<{ userId: ID; value: number }>; // value: count for EQUAL, amount for EXACT, percent for PERCENT
}

export interface Expense extends ExpenseInput {
  id: ID;
  createdAt: string; // ISO
}

export interface Settlement {
  id: ID;
  groupId: ID;
  fromUserId: ID;
  toUserId: ID;
  amount: number;
  createdAt: string; // ISO
  note?: string;
}

export type LedgerEntryType =
  | { kind: "EXPENSE_SPLIT"; expenseId: ID; fromUserId: ID; toUserId: ID; amount: number }
  | { kind: "SETTLEMENT"; settlementId: ID; fromUserId: ID; toUserId: ID; amount: number };

export interface LedgerEntry {
  id: ID;
  groupId: ID;
  type: LedgerEntryType;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface BalanceEdge {
  fromUserId: ID; // owes
  toUserId: ID;   // is owed by
  amount: number;
}

export interface BalanceSummary {
  groupId: ID;
  totalsByUser: Record<ID, number>; // positive: net credit, negative: net debit
  edges: BalanceEdge[]; // detailed who-owes-whom before simplification
  simplified: BalanceEdge[]; // minimized cash flow
}
