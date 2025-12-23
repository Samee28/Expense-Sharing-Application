import http from 'http';
import { SimpleRouter } from './http/router.js';
import { store } from './store/memory.js';
import { z } from 'zod';
import { computeShares, round2 } from './domain/splitters.js';
import { computeBalances } from './services/balances.js';
import { createExpense, createSettlement } from './services/ledger.js';

const router = new SimpleRouter();

// Health check
router.get('/health', async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
});

// Users
router.get('/users', async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify([...store.users.values()]));
});

router.post('/users', async (req, res, { body }) => {
  const userSchema = z.object({ name: z.string().min(1) });
  const data = userSchema.parse(body);
  const id = Math.random().toString(36).slice(2, 10);
  const user = { id, name: data.name };
  store.addUser(user);
  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(user));
});

// Groups
router.get('/groups', async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify([...store.groups.values()]));
});

router.post('/groups', async (req, res, { body }) => {
  const groupSchema = z.object({ name: z.string().min(1), memberIds: z.array(z.string()).min(1) });
  const data = groupSchema.parse(body);

  for (const id of data.memberIds) {
    if (!store.users.get(id)) throw new Error(`User ${id} not found`);
  }

  const exists = [...store.groups.values()].some(g => g.name.toLowerCase() === data.name.toLowerCase());
  if (exists) throw new Error('Group name already exists');

  const id = Math.random().toString(36).slice(2, 10);
  const group = { id, name: data.name, memberIds: [...new Set(data.memberIds)] };
  store.addGroup(group);

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(group));
});

router.post('/groups/:groupId/members', async (req, res, { params, body }) => {
  const schema = z.object({ userId: z.string() });
  const data = schema.parse(body);

  const g = store.groups.get(params.groupId);
  if (!g) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Group not found' }));
    return;
  }

  if (!store.users.get(data.userId)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'User not found' }));
    return;
  }

  if (!g.memberIds.includes(data.userId)) g.memberIds.push(data.userId);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(g));
});

router.post('/groups/:groupId/members/bulk', async (req, res, { params, body }) => {
  const schema = z.object({ userIds: z.array(z.string()).min(1) });
  const data = schema.parse(body);

  const g = store.groups.get(params.groupId);
  if (!g) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Group not found' }));
    return;
  }

  for (const uid of data.userIds) {
    if (!store.users.get(uid)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `User not found: ${uid}` }));
      return;
    }
  }

  const set = new Set(g.memberIds);
  data.userIds.forEach(uid => set.add(uid));
  g.memberIds = [...set];

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(g));
});

// Expenses
router.post('/expenses', async (req, res, { body }) => {
  const splitItem = z.object({ userId: z.string(), value: z.number() });
  const schema = z.object({
    groupId: z.string(),
    payerId: z.string(),
    amount: z.number().positive(),
    description: z.string().optional(),
    splitType: z.enum(['EQUAL', 'EXACT', 'PERCENT']),
    splits: z.array(splitItem).min(1)
  });

  const data = schema.parse(body);
  const expense = createExpense(data);

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(expense));
});

// Settlements
router.post('/settlements', async (req, res, { body }) => {
  const schema = z.object({
    groupId: z.string(),
    fromUserId: z.string(),
    toUserId: z.string(),
    amount: z.number().positive(),
    note: z.string().optional()
  });

  const data = schema.parse(body);
  const settlement = createSettlement(data.groupId, data.fromUserId, data.toUserId, data.amount, data.note);

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(settlement));
});

// Balances
router.get('/balances/:groupId', async (req, res, { params }) => {
  const summary = computeBalances(params.groupId);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(summary));
});

// Ledger
router.get('/ledger/:groupId', async (req, res, { params }) => {
  const entries = [...store.ledger.values()]
    .filter(e => e.groupId === params.groupId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(entries));
});

// Admin reset
router.post('/admin/reset', async (req, res) => {
  store.reset();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
});

// Create and start server
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  await router.handle(req, res);
});

const PORT = process.env.PORT || 3000;

// Only start if run directly (not imported for tests)
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  server.listen(PORT, () => {
    console.log(`Expense Sharing API running on http://localhost:${PORT}`);
  });
}

export default server;
