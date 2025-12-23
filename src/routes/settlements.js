import { Router } from "express";
import { z } from "zod";
import { createSettlement } from "../services/ledger.js";

const schema = z.object({
  groupId: z.string(),
  fromUserId: z.string(),
  toUserId: z.string(),
  amount: z.number().positive(),
  note: z.string().optional()
});

export const settlementsRouter = Router();

settlementsRouter.post('/', (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    const s = createSettlement(body.groupId, body.fromUserId, body.toUserId, body.amount, body.note);
    res.status(201).json(s);
  } catch (e) { next(e); }
});
