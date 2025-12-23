import { store } from "../store/memory.js";
import { round2 } from "../domain/splitters.js";

export function computeBalances(groupId) {
  const totals = {};
  const edges = [];

  const entries = [...store.ledger.values()].filter(e => e.groupId === groupId);
  for (const e of entries) {
    if (e.type.kind === "EXPENSE_SPLIT") {
      addEdge(edges, e.type.fromUserId, e.type.toUserId, e.type.amount);
      addNet(totals, e.type.fromUserId, -e.type.amount);
      addNet(totals, e.type.toUserId, e.type.amount);
    } else if (e.type.kind === "SETTLEMENT") {
      // settlement reduces debt (money flowed from fromUser to toUser)
      addEdge(edges, e.type.fromUserId, e.type.toUserId, -e.type.amount);
      addNet(totals, e.type.fromUserId, e.type.amount);
      addNet(totals, e.type.toUserId, -e.type.amount);
    }
  }

  // Combine edges of same direction and remove near-zero
  const combined = combineEdges(edges);
  const simplified = simplifyDebts(totals);
  return { groupId, totalsByUser: totals, edges: combined, simplified };
}

function addEdge(edges, from, to, amount) {
  edges.push({ fromUserId: from, toUserId: to, amount: round2(amount) });
}

function addNet(totals, userId, delta) {
  totals[userId] = round2((totals[userId] ?? 0) + delta);
}

function combineEdges(edges) {
  const map = new Map();
  for (const e of edges) {
    const key = `${e.fromUserId}->${e.toUserId}`;
    map.set(key, round2((map.get(key) ?? 0) + e.amount));
  }
  const out = [];
  for (const [key, amount] of map.entries()) {
    if (Math.abs(amount) < 0.01) continue;
    const [fromUserId, toUserId] = key.split("->");
    out.push({ fromUserId, toUserId, amount: round2(amount) });
  }
  return out;
}

// Greedy min-cash-flow simplification
export function simplifyDebts(nets) {
  const creditors = [];
  const debtors = [];
  for (const [id, amt] of Object.entries(nets)) {
    if (amt > 0.009) creditors.push({ id, amt: round2(amt) });
    else if (amt < -0.009) debtors.push({ id, amt: round2(-amt) }); // store positive debt
  }
  // Sort largest first for faster convergence
  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);

  const res = [];
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const pay = round2(Math.min(c.amt, d.amt));
    if (pay > 0.009) res.push({ fromUserId: d.id, toUserId: c.id, amount: pay });
    c.amt = round2(c.amt - pay);
    d.amt = round2(d.amt - pay);
    if (c.amt < 0.01) ci++;
    if (d.amt < 0.01) di++;
  }
  return res;
}
