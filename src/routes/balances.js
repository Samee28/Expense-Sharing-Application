import { Router } from "express";
import { computeBalances } from "../services/balances.js";

export const balancesRouter = Router();

balancesRouter.get('/:groupId', (req, res, next) => {
  try {
    const { groupId } = req.params;
    const summary = computeBalances(groupId);
    res.json(summary);
  } catch (e) { next(e); }
});
