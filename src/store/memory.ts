import { Expense, Group, ID, LedgerEntry, Settlement, User } from "../types";

export class InMemoryStore {
  users = new Map<ID, User>();
  groups = new Map<ID, Group>();
  expenses = new Map<ID, Expense>();
  settlements = new Map<ID, Settlement>();
  ledger = new Map<ID, LedgerEntry>();

  addUser(u: User) { this.users.set(u.id, u); }
  addGroup(g: Group) { this.groups.set(g.id, g); }
  addExpense(e: Expense) { this.expenses.set(e.id, e); }
  addSettlement(s: Settlement) { this.settlements.set(s.id, s); }
  addLedger(le: LedgerEntry) { this.ledger.set(le.id, le); }

  reset() {
    this.users.clear();
    this.groups.clear();
    this.expenses.clear();
    this.settlements.clear();
    this.ledger.clear();
  }
}

export const store = new InMemoryStore();
