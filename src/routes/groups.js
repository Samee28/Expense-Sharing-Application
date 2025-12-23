import { Router } from "express";
import { z } from "zod";
import { store } from "../store/memory.js";

const createSchema = z.object({ name: z.string().min(1), memberIds: z.array(z.string()).min(1) });
const bulkAddSchema = z.object({ userIds: z.array(z.string()).min(1) });
const addMemberSchema = z.object({ userId: z.string() });

export const groupsRouter = Router();

groupsRouter.get('/', (_req, res) => {
  res.json([...store.groups.values()]);
});

groupsRouter.post('/', (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    for (const id of body.memberIds) {
      if (!store.users.get(id)) throw new Error(`User ${id} not found`);
    }
    // prevent duplicate group names for simplicity
    const exists = [...store.groups.values()].some(g => g.name.toLowerCase() === body.name.toLowerCase());
    if (exists) throw new Error('Group name already exists');
    const id = Math.random().toString(36).slice(2, 10);
    const group = { id, name: body.name, memberIds: [...new Set(body.memberIds)] };
    store.addGroup(group);
    res.status(201).json(group);
  } catch (e) { next(e); }
});

groupsRouter.post('/:groupId/members', (req, res, next) => {
  try {
    const { groupId } = req.params;
    const body = addMemberSchema.parse(req.body);
    const g = store.groups.get(groupId);
    if (!g) return res.status(404).json({ error: 'Group not found' });
    if (!store.users.get(body.userId)) return res.status(404).json({ error: 'User not found' });
    if (!g.memberIds.includes(body.userId)) g.memberIds.push(body.userId);
    res.json(g);
  } catch (e) { next(e); }
});

// bulk add members
groupsRouter.post('/:groupId/members/bulk', (req, res, next) => {
  try {
    const { groupId } = req.params;
    const body = bulkAddSchema.parse(req.body);
    const g = store.groups.get(groupId);
    if (!g) return res.status(404).json({ error: 'Group not found' });
    for (const uid of body.userIds) {
      if (!store.users.get(uid)) return res.status(404).json({ error: `User not found: ${uid}` });
    }
    const set = new Set(g.memberIds);
    body.userIds.forEach(uid => set.add(uid));
    g.memberIds = [...set];
    res.json(g);
  } catch (e) { next(e); }
});
