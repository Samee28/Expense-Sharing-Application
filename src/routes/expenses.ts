import { Router } from "express";
import { z } from "zod";
import { createExpense } from "../services/ledger";

const splitItem = z.object({ userId: z.string(), value: z.number() });
const schema = z.object({
  groupId: z.string(),
  payerId: z.string(),
  amount: z.number().positive(),
  description: z.string().optional(),
  splitType: z.enum(["EQUAL", "EXACT", "PERCENT"]),
  splits: z.array(splitItem).min(1)
});

export const expensesRouter = Router();

expensesRouter.post('/', (req, res, next) => {
  try {
    const input = schema.parse(req.body);
    const expense = createExpense(input);
    res.status(201).json(expense);
  } catch (e) { next(e); }
});
