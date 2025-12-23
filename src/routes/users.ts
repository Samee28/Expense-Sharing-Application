import { Router } from "express";
import { z } from "zod";
import { store } from "../store/memory";
import { ID, User } from "../types";

const schema = z.object({ name: z.string().min(1) });

export const usersRouter = Router();

usersRouter.get('/', (_req, res) => {
  res.json([...store.users.values()]);
});

usersRouter.post('/', (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    const id: ID = Math.random().toString(36).slice(2, 10);
    const user: User = { id, name: body.name };
    store.addUser(user);
    res.status(201).json(user);
  } catch (e) { next(e); }
});
