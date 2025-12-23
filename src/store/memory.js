export class InMemoryStore {
  constructor() {
    this.users = new Map();
    this.groups = new Map();
    this.expenses = new Map();
    this.settlements = new Map();
    this.ledger = new Map();
  }

  addUser(u) { this.users.set(u.id, u); }
  addGroup(g) { this.groups.set(g.id, g); }
  addExpense(e) { this.expenses.set(e.id, e); }
  addSettlement(s) { this.settlements.set(s.id, s); }
  addLedger(le) { this.ledger.set(le.id, le); }

  reset() {
    this.users.clear();
    this.groups.clear();
    this.expenses.clear();
    this.settlements.clear();
    this.ledger.clear();
  }
}

export const store = new InMemoryStore();
