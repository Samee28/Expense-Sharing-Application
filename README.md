# Expense Sharing App (JavaScript + React + Next.js)

Splitwise-style expense sharing application. **Clean pure Node.js backend** (no frameworks), React + Next.js frontend with Tailwind CSS. Clear split calculations, transparent ledger, and real-time balance tracking.

**What it does**
- Create users and groups
- Add expenses (Equal, Exact, Percent splits)
- Record settlements (who paid whom)
- Show balances plus a clean ledger of every calculation

**How the math works (human words)**
- One person pays; the total is split across members by equal/exact/percent.
- For each member, the ledger records "member owes payer X".
- When someone pays back, a settlement entry reduces that owed amount.
- Balances show net per person (positive = should receive; negative = should pay).
- A simplified view suggests the minimal set of payments to settle everyone.

## Run it

### Backend (API Server - Pure Node.js, no frameworks)
```powershell
npm install
npm run dev
```
Server runs on `http://localhost:3000`

### Frontend (Next.js)
```powershell
cd client
npm install
npm run dev
```
Frontend runs on `http://localhost:3001`

- Open `http://localhost:3001` in your browser
- Create users, groups, add expenses, view balances
- Use "Reset All Data" to wipe in-memory data

## Tech stack
- **Backend**: Node.js + pure built-in `http` module + JavaScript + Zod validation
  - No Express, no frameworks—just clean Node.js HTTP server with simple routing
- **Frontend**: React + Next.js 16 + JavaScript + Tailwind CSS
- **Tests**: Vitest + Supertest
- **Storage**: In-memory (default), optional Prisma ORM for SQL/NoSQL

## Calculations in plain language
- Ledger-first: every split and settlement is written as "A owes B X".
- Balances: sum the ledger to get each person's net.
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
- In-memory is default; swapping to DB doesn't change the API or UI.

## Project structure
```
/src          - Backend JavaScript (pure Node.js HTTP + routing, services, domain logic)
/src/http     - Simple router utility (no Express)
/client       - Next.js React frontend (Tailwind CSS, App Router)
/tests        - Backend tests (Vitest + Supertest)
/public       - Static HTML demo (legacy, optional)
/prisma       - Database schema and migrations (optional)
```

