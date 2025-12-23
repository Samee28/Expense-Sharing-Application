# Expense Sharing API (TypeScript, React-ready)

Simple Splitwise-style backend written in TypeScript. Clear math, transparent ledger, and an API that a React + TypeScript frontend can use immediately. The bundled UI is plain HTML/JS just to demo the flows.

**What it does**
- Create users and groups
- Add expenses (Equal, Exact, Percent splits)
- Record settlements (who paid whom)
- Show balances plus a clean ledger of every calculation

**How the math works (human words)**
- One person pays; the total is split across members by equal/exact/percent.
- For each member, the ledger records “member owes payer X”.
- When someone pays back, a settlement entry reduces that owed amount.
- Balances show net per person (positive = should receive; negative = should pay).
- A simplified view suggests the minimal set of payments to settle everyone.

## Run it
```powershell
npm install
npm run dev
start http://localhost:3000
```
- “Add Sample Data” seeds users, groups, and expenses for a quick demo.
- “Reset All Data” wipes in-memory data.

## Tech stack
- Backend: Node.js + Express + TypeScript + Zod
- Tests: Vitest + Supertest
- UI (demo): Plain HTML/JS; swap in React + TypeScript without backend changes

## Calculations in plain language
- Ledger-first: every split and settlement is written as “A owes B X”.
- Balances: sum the ledger to get each person’s net.
- Simplify: compute minimal payments to settle all nets.
- Rounding: amounts are kept to 2 decimals; final participant absorbs tiny drift.

## API (JSON over HTTP)
- `GET /health` — server check
- `POST /users` `{ name }`, `GET /users`
- `POST /groups` `{ name, memberIds }`
- `POST /groups/:groupId/members` `{ userId }`
- `POST /groups/:groupId/members/bulk` `{ userIds: string[] }`
- `POST /expenses` `{ groupId, payerId, amount, description?, splitType, splits[] }`
- `POST /settlements` `{ groupId, fromUserId, toUserId, amount, note? }`
- `GET /balances/:groupId` — totals + simplified suggestions
- `GET /ledger/:groupId` — grouped ledger entries
- `POST /admin/reset` — clear in-memory data

## Testing
```powershell
npm test
```

## Optional database
- Prisma ORM; SQLite by default, can switch to PostgreSQL/MySQL.
- Set `DATABASE_URL` in `.env` (see `.env.example`).
- In-memory is default; swapping to DB doesn’t change the API or UI.

