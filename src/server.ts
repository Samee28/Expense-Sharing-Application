import express from 'express';
import cors from 'cors';
import { usersRouter } from './routes/users';
import { groupsRouter } from './routes/groups';
import { expensesRouter } from './routes/expenses';
import { settlementsRouter } from './routes/settlements';
import { balancesRouter } from './routes/balances';
import { ledgerRouter } from './routes/ledger';
import { adminRouter } from './routes/admin';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/users', usersRouter);
app.use('/groups', groupsRouter);
app.use('/expenses', expensesRouter);
app.use('/settlements', settlementsRouter);
app.use('/balances', balancesRouter);
app.use('/ledger', ledgerRouter);
app.use('/admin', adminRouter);

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(400).json({ error: err?.message ?? 'Bad Request' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Expense Sharing API running on http://localhost:${PORT}`));

export default app;
