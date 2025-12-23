import { Router } from "express";
import { z } from "zod";
import { store } from "../store/memory.js";

const schema = z.object({ name: z.string().min(1) });

export const usersRouter = Router();

usersRouter.get('/', (_req, res) => {
  res.json([...store.users.values()]);
});

usersRouter.post('/', (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    const id = Math.random().toString(36).slice(2, 10);
    const user = { id, name: body.name };
    store.addUser(user);
    res.status(201).json(user);
  } catch (e) { next(e); }
});
