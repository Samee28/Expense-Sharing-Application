import { Router } from "express";
import { store } from "../store/memory";

export const adminRouter = Router();

// Clear all in-memory data (users, groups, expenses, settlements, ledger)
adminRouter.post('/reset', (_req, res) => {
  store.reset();
  res.json({ ok: true });
});
