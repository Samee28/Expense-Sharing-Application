import { Router } from "express";
import { store } from "../store/memory";

export const ledgerRouter = Router();

ledgerRouter.get('/:groupId', (req, res) => {
  const { groupId } = req.params;
  const entries = [...store.ledger.values()].filter(e => e.groupId === groupId).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  res.json(entries);
});
