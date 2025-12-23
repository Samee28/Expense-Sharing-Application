import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const prismaRepo = {
  // Users
  async addUser(user: { id: string; name: string }) {
    await prisma.user.create({ data: { id: user.id, name: user.name } });
  },
  async listUsers() {
    return prisma.user.findMany();
  },
  async getUser(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  // Groups
  async addGroup(group: { id: string; name: string; memberIds: string[] }) {
    await prisma.group.create({ data: { id: group.id, name: group.name } });
    if (group.memberIds.length) {
      await prisma.groupMember.createMany({ data: group.memberIds.map(uid => ({ groupId: group.id, userId: uid })) });
    }
  },
  async listGroups() {
    const groups = await prisma.group.findMany({ include: { members: true } });
    return groups.map(g => ({ id: g.id, name: g.name, memberIds: g.members.map(m => m.userId) }));
  },
  async getGroup(id: string) {
    const g = await prisma.group.findUnique({ where: { id }, include: { members: true } });
    if (!g) return null as any;
    return { id: g.id, name: g.name, memberIds: g.members.map(m => m.userId) };
  },
  async updateGroupMembers(groupId: string, memberIds: string[]) {
    await prisma.groupMember.deleteMany({ where: { groupId } });
    if (memberIds.length) {
      await prisma.groupMember.createMany({ data: memberIds.map(uid => ({ groupId, userId: uid })) });
    }
  },

  // Expenses & settlements & ledger
  async addExpense(expense: any) {
    await prisma.expense.create({ data: {
      id: expense.id,
      groupId: expense.groupId,
      payerId: expense.payerId,
      amount: expense.amount,
      description: expense.description,
      splitType: expense.splitType,
      splits: expense.splits ? JSON.stringify(expense.splits) : null,
      createdAt: new Date(expense.createdAt)
    } });
  },
  async addSettlement(s: any) {
    await prisma.settlement.create({ data: {
      id: s.id, groupId: s.groupId, fromUserId: s.fromUserId, toUserId: s.toUserId,
      amount: s.amount, note: s.note, createdAt: new Date(s.createdAt)
    } });
  },
  async addLedger(le: any) {
    await prisma.ledgerEntry.create({ data: {
      id: le.id, groupId: le.groupId, type: le.type.kind,
      metadata: le.metadata ? JSON.stringify(le.metadata) : null,
      fromUserId: le.type.fromUserId, toUserId: le.type.toUserId, amount: le.type.amount,
      expenseId: (le.type.kind === 'EXPENSE_SPLIT') ? le.type.expenseId : null,
      settlementId: (le.type.kind === 'SETTLEMENT') ? le.type.settlementId : null,
      createdAt: new Date(le.createdAt)
    } });
  },
  async listLedgerByGroup(groupId: string) {
    return prisma.ledgerEntry.findMany({ where: { groupId }, orderBy: { createdAt: 'asc' } });
  },
  async reset() {
    await prisma.ledgerEntry.deleteMany({});
    await prisma.settlement.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.groupMember.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.user.deleteMany({});
  }
};
