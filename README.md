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

### Frontend Setup
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






