# Expense Sharing Application

**A Splitwise-style expense sharing app** with transparent calculations, real-time balance tracking, and multiple split types. Built with pure Node.js backend (no frameworks) and React + Next.js frontend.

## ✨ Features

### Core Functionality
- **User & Group Management**: Create users and organize them into groups
- **Flexible Expense Splitting**:
  - **Equal Split**: Divide expenses equally among all members
  - **Exact Amount**: Specify exact dollar amounts for each person
  - **Percentage Split**: Allocate by percentages with validation
- **Settlement Tracking**: Record payments between members to settle debts
- **Smart Balance Calculations**: 
  - See who owes whom and how much
  - Automatic debt simplification (minimal payment suggestions)
- **Complete Transaction Ledger**: Every expense and settlement tracked with timestamps
- **Real-time Calculation Preview**: See the split breakdown before adding an expense

### User Experience
- **On-page forms** (no popups) - add expenses and settlements directly
- **Live calculation display** - see exactly how amounts are split
- **Color-coded balances** - red (owes), green (should receive), gray (settled)
- **Visual ledger** - expenses (🧾) and settlements (✓) clearly marked
- **Single-host setup** - API rewrites for seamless frontend/backend integration

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ installed
- npm or yarn package manager

### Backend Setup (API Server)
```powershell
# Install dependencies
npm install

# Start development server with hot reload
npm run dev
```
**Backend runs on:** `http://localhost:3000`

### Frontend Setup (Next.js)
```powershell
# Navigate to client folder
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```
**Frontend runs on:** `http://localhost:3001`

### Usage
1. Open `http://localhost:3001` in your browser
2. Create users (e.g., Alice, Bob, Charlie)
3. Create a group and add members
4. Add expenses with your chosen split type
5. View balances and suggested payments
6. Record settlements when payments are made
7. Use "Reset All Data" button to clear and start fresh

## 💡 How It Works

### The Math Behind the Scenes
1. **Expense Recording**: When someone pays, the amount is split according to the selected method
2. **Ledger Tracking**: Every split creates entries: "Member A owes Payer X dollars"
3. **Balance Calculation**: Sum all ledger entries to compute each person's net balance
   - Positive balance = should receive money
   - Negative balance = should pay money
   - Zero = settled up
4. **Debt Simplification**: Greedy algorithm finds minimal number of payments to settle all debts
5. **Settlement Recording**: When payments happen, they reduce the owed amounts
6. **Precision**: All amounts kept to 2 decimals; final participant absorbs rounding drift

### Example Scenario
```
Group: Trip (Alice, Bob, Charlie)

Expense 1: Alice pays $300 for hotel
- Equal split: $100 each
- Bob owes Alice $100
- Charlie owes Alice $100

Expense 2: Bob pays $150 for food
- Equal split: $50 each
- Alice owes Bob $50
- Charlie owes Bob $50

Net Balances:
- Alice: +$150 (should receive)
- Bob: $0 (settled)
- Charlie: -$150 (should pay)

Simplified Payment:
- Charlie pays Alice $150 → Everyone settled ✓
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 22+ with ES modules
- **Server**: Pure built-in `http` module (no Express or frameworks)
- **Routing**: Custom `SimpleRouter` utility with path parameter support
- **Validation**: Zod for schema validation
- **Testing**: Vitest + Supertest
- **Storage**: In-memory (default), optional Prisma ORM for persistent database

### Frontend
- **Framework**: React with Next.js 16 (App Router)
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS with dark theme
- **State**: React hooks (useState, useEffect)
- **API Communication**: Fetch API with rewrites for single-host setup

### Development
- **Hot Reload**: `node --watch` for backend, Next.js fast refresh for frontend
- **Code Quality**: ESLint for linting
- **Version Control**: Git + GitHub

## 📡 API Endpoints

### Health Check
- `GET /health` - Server status check

### Users
- `POST /users` - Create user: `{ name: string }`
- `GET /users` - List all users

### Groups
- `POST /groups` - Create group: `{ name: string, memberIds: string[] }`
- `GET /groups` - List all groups
- `POST /groups/:groupId/members` - Add single member: `{ userId: string }`
- `POST /groups/:groupId/members/bulk` - Add multiple members: `{ userIds: string[] }`

### Expenses
- `POST /expenses` - Add expense
  ```json
  {
    "groupId": "string",
    "payerId": "string",
    "amount": 100.00,
    "description": "Dinner",
    "splitType": "EQUAL" | "EXACT" | "PERCENT",
    "splits": [
      { "userId": "string", "value": 1 }  // value = 1 for EQUAL, amount for EXACT, percentage for PERCENT
    ]
  }
  ```

### Settlements
- `POST /settlements` - Record payment
  ```json
  {
    "groupId": "string",
    "fromUserId": "string",
    "toUserId": "string",
    "amount": 50.00,
    "note": "Settling up"
  }
  ```

### Balances & Ledger
- `GET /balances/:groupId` - Get net balances and simplified payment suggestions
- `GET /ledger/:groupId` - Get complete transaction history

### Admin
- `POST /admin/reset` - Clear all in-memory data (for development/testing)

## 🧪 Testing

Run backend tests:
```powershell
npm test
```

Tests include:
- Split calculation accuracy (equal, exact, percent)
- API endpoint integration
- Balance computation
- Debt simplification algorithm

## 💾 Database (Optional)

The app runs with in-memory storage by default. To enable persistent database:

1. **Configure database URL** in `.env`:
   ```
   DATABASE_URL="file:./dev.db"  # SQLite
   # or
   DATABASE_URL="postgresql://user:pass@localhost:5432/expenses"  # PostgreSQL
   ```

2. **Run migrations**:
   ```powershell
   npx prisma migrate dev
   ```

3. **Generate Prisma client**:
   ```powershell
   npx prisma generate
   ```

**Supported databases**: SQLite, PostgreSQL, MySQL (via Prisma ORM)

## 📁 Project Structure

```
Expense-Sharing-Application/
├── src/                          # Backend source code
│   ├── server.js                 # HTTP server entry point
│   ├── http/
│   │   └── router.js            # Custom routing utility
│   ├── domain/
│   │   └── splitters.js         # Split calculation logic
│   ├── services/
│   │   ├── balances.js          # Balance computation & simplification
│   │   └── ledger.js            # Transaction recording
│   └── store/
│       └── memory.js            # In-memory data store
├── client/                       # Next.js frontend
│   ├── app/
│   │   ├── page.js              # Main dashboard
│   │   ├── layout.js            # Root layout
│   │   └── globals.css          # Tailwind styles
│   └── next.config.js           # Next.js config with API rewrites
├── tests/                        # Backend tests
│   ├── splitters.test.js        # Split calculation tests
│   └── api.test.js              # API integration tests
├── prisma/                       # Database (optional)
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Migration files
├── package.json                  # Backend dependencies
└── README.md                     # This file
```

## 🎯 Key Design Decisions

1. **No Backend Framework**: Pure Node.js for educational clarity and minimal dependencies
2. **Ledger-First Architecture**: Every transaction creates immutable ledger entries
3. **Greedy Debt Simplification**: Minimizes number of payments needed to settle group
4. **Visible Calculations**: UI shows exactly how splits work before committing
5. **Single Host**: API rewrites allow frontend to call `/api/*` seamlessly

## 🐛 Troubleshooting

**Port already in use:**
```powershell
# Kill Node processes
Get-Process -Name node | Stop-Process -Force

# Restart servers
npm run dev
cd client && npm run dev
```

**Frontend can't reach backend:**
- Ensure backend is running on port 3000
- Check `next.config.js` has correct API rewrites
- Verify both servers are running

**Calculation seems wrong:**
- Check the ledger view - it shows every transaction
- Verify split type and custom splits (for EXACT/PERCENT)
- Remember: rounding drift is absorbed by last participant

## 📝 License

MIT License - Feel free to use this project for learning or production.

## 🤝 Contributing

This is an educational project demonstrating:
- Backend development without frameworks
- Expense splitting algorithms
- React state management
- Full-stack JavaScript architecture

Contributions welcome! Areas for enhancement:
- User authentication
- Multi-currency support
- Expense categories and tags
- Export to CSV/PDF
- Mobile responsive improvements
- Settlement reminders/notifications

---

**Built with ❤️ using pure Node.js, React, and clear mathematical principles**

