'use client';

import { useState, useEffect } from 'react';

const API_URL = '/api';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [balances, setBalances] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    payerId: '',
    amount: '',
    description: '',
    splitType: 'EQUAL'
  });
  const [customSplits, setCustomSplits] = useState({}); // For EXACT amounts or PERCENT
  const [calculationBreakdown, setCalculationBreakdown] = useState(null);
  
  // Settlement form state
  const [settlementForm, setSettlementForm] = useState({
    fromUserId: '',
    toUserId: '',
    amount: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/users`);
    setUsers(await res.json());
  };

  const fetchGroups = async () => {
    const res = await fetch(`${API_URL}/groups`);
    setGroups(await res.json());
  };

  const fetchBalances = async (groupId) => {
    const res = await fetch(`${API_URL}/balances/${groupId}`);
    setBalances(await res.json());
  };

  const fetchLedger = async (groupId) => {
    const res = await fetch(`${API_URL}/ledger/${groupId}`);
    setLedger(await res.json());
  };

  const createUser = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newUserName })
    });
    setNewUserName('');
    fetchUsers();
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      alert('Select at least one member');
      return;
    }
    await fetch(`${API_URL}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName, memberIds: selectedMembers })
    });
    setNewGroupName('');
    setSelectedMembers([]);
    fetchGroups();
  };

  const calculateExpenseBreakdown = (groupId, payerId, amount, splitType, splits) => {
    if (!amount || amount <= 0) return null;
    const group = groups.find(g => g.id === groupId);
    if (!group) return null;
    
    const breakdown = {};
    let perPerson = 0;
    
    if (splitType === 'EQUAL') {
      perPerson = amount / group.memberIds.length;
      group.memberIds.forEach(memberId => {
        const share = perPerson;
        breakdown[memberId] = {
          userName: users.find(u => u.id === memberId)?.name || memberId,
          paid: memberId === payerId ? amount : 0,
          share: share,
          owes: memberId === payerId ? 0 : share,
          owed: memberId === payerId ? amount - share : 0
        };
      });
    } else if (splitType === 'EXACT') {
      group.memberIds.forEach(memberId => {
        const share = parseFloat(splits[memberId] || 0);
        breakdown[memberId] = {
          userName: users.find(u => u.id === memberId)?.name || memberId,
          paid: memberId === payerId ? amount : 0,
          share: share,
          owes: memberId === payerId ? 0 : share,
          owed: memberId === payerId ? amount - share : 0
        };
      });
    } else if (splitType === 'PERCENT') {
      group.memberIds.forEach(memberId => {
        const percent = parseFloat(splits[memberId] || 0);
        const share = (amount * percent) / 100;
        breakdown[memberId] = {
          userName: users.find(u => u.id === memberId)?.name || memberId,
          paid: memberId === payerId ? amount : 0,
          share: share,
          percent: percent,
          owes: memberId === payerId ? 0 : share,
          owed: memberId === payerId ? amount - share : 0
        };
      });
    }
    
    return breakdown;
  };

  const addExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.payerId || !expenseForm.amount) {
      alert('Select payer and amount');
      return;
    }
    
    const group = groups.find(g => g.id === selectedGroup.id);
    let splits;
    
    if (expenseForm.splitType === 'EQUAL') {
      splits = group.memberIds.map(id => ({ userId: id, value: 1 }));
    } else if (expenseForm.splitType === 'EXACT') {
      splits = group.memberIds.map(id => ({ 
        userId: id, 
        value: parseFloat(customSplits[id] || 0) 
      }));
    } else if (expenseForm.splitType === 'PERCENT') {
      splits = group.memberIds.map(id => ({ 
        userId: id, 
        value: parseFloat(customSplits[id] || 0) 
      }));
    }
    
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          payerId: expenseForm.payerId,
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description,
          splitType: expenseForm.splitType,
          splits: splits
        })
      });
      
      if (!res.ok) throw new Error('Failed to add expense');
      
      setExpenseForm({ payerId: '', amount: '', description: '', splitType: 'EQUAL' });
      setCustomSplits({});
      setCalculationBreakdown(null);
      fetchBalances(selectedGroup.id);
      fetchLedger(selectedGroup.id);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const addSettlement = async (e) => {
    e.preventDefault();
    if (!settlementForm.fromUserId || !settlementForm.toUserId || !settlementForm.amount) {
      alert('Select both users and amount');
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          fromUserId: settlementForm.fromUserId,
          toUserId: settlementForm.toUserId,
          amount: parseFloat(settlementForm.amount),
          note: 'Payment settlement'
        })
      });
      
      if (!res.ok) throw new Error('Failed to record settlement');
      
      setSettlementForm({ fromUserId: '', toUserId: '', amount: '' });
      fetchBalances(selectedGroup.id);
      fetchLedger(selectedGroup.id);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const selectGroup = (group) => {
    setSelectedGroup(group);
    fetchBalances(group.id);
    fetchLedger(group.id);
  };

  const resetData = async () => {
    await fetch(`${API_URL}/admin/reset`, { method: 'POST' });
    setUsers([]);
    setGroups([]);
    setSelectedGroup(null);
    setBalances(null);
    setLedger([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Expense Sharing App</h1>
          <button 
            onClick={resetData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Reset All Data
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Users Section */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Users</h2>
            <form onSubmit={createUser} className="mb-4 flex gap-2">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="User name"
                className="flex-1 px-3 py-2 bg-gray-700 rounded"
                required
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
                Add
              </button>
            </form>
            <ul className="space-y-2">
              {users.map(u => (
                <li key={u.id} className="bg-gray-700 p-3 rounded">
                  {u.name} <span className="text-gray-400 text-sm">({u.id})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Groups Section */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Groups</h2>
            <form onSubmit={createGroup} className="mb-4">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full px-3 py-2 bg-gray-700 rounded mb-2"
                required
              />
              <div className="mb-2">
                <label className="block text-sm text-gray-400 mb-1">Select members:</label>
                <div className="space-y-1">
                  {users.map(u => (
                    <label key={u.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, u.id]);
                          } else {
                            setSelectedMembers(selectedMembers.filter(id => id !== u.id));
                          }
                        }}
                      />
                      <span>{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded">
                Create Group
              </button>
            </form>
            <ul className="space-y-2">
              {groups.map(g => (
                <li 
                  key={g.id} 
                  onClick={() => selectGroup(g)}
                  className="bg-gray-700 p-3 rounded cursor-pointer hover:bg-gray-600"
                >
                  <div className="font-bold">{g.name}</div>
                  <div className="text-sm text-gray-400">{g.memberIds.length} members</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Selected Group Details */}
        {selectedGroup && (
          <div className="mt-6 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">📊 Group: {selectedGroup.name}</h2>
            
            {/* Add Expense Form - On Page */}
            <div className="mb-8 bg-gray-700 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">➕ Add Expense</h3>
              <form onSubmit={addExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Who paid?</label>
                  <select
                    value={expenseForm.payerId}
                    onChange={(e) => {
                      setExpenseForm({ ...expenseForm, payerId: e.target.value });
                      setCalculationBreakdown(null);
                    }}
                    className="w-full px-3 py-2 bg-gray-600 rounded"
                    required
                  >
                    <option value="">-- Select Payer --</option>
                    {selectedGroup.memberIds.map(memberId => {
                      const user = users.find(u => u.id === memberId);
                      return (
                        <option key={memberId} value={memberId}>
                          {user?.name || memberId}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseForm.amount}
                    onChange={(e) => {
                      setExpenseForm({ ...expenseForm, amount: e.target.value });
                      if (expenseForm.payerId && e.target.value) {
                        setCalculationBreakdown(
                          calculateExpenseBreakdown(selectedGroup.id, expenseForm.payerId, parseFloat(e.target.value), 'EQUAL')
                        );
                      } else {
                        setCalculationBreakdown(null);
                      }
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-gray-600 rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Split Type</label>
                  <select
                    value={expenseForm.splitType}
                    onChange={(e) => {
                      setExpenseForm({ ...expenseForm, splitType: e.target.value });
                      setCustomSplits({});
                      setCalculationBreakdown(null);
                    }}
                    className="w-full px-3 py-2 bg-gray-600 rounded"
                  >
                    <option value="EQUAL">Equal Split (divide equally)</option>
                    <option value="EXACT">Exact Amount (specify amounts)</option>
                    <option value="PERCENT">Percentage (specify percentages)</option>
                  </select>
                </div>

                {/* Custom Split Inputs for EXACT or PERCENT */}
                {(expenseForm.splitType === 'EXACT' || expenseForm.splitType === 'PERCENT') && (
                  <div className="bg-gray-600 p-4 rounded">
                    <h4 className="font-semibold mb-3 text-sm">
                      {expenseForm.splitType === 'EXACT' ? 'Specify amount for each person:' : 'Specify percentage for each person:'}
                    </h4>
                    <div className="space-y-2">
                      {selectedGroup.memberIds.map(memberId => {
                        const user = users.find(u => u.id === memberId);
                        return (
                          <div key={memberId} className="flex items-center gap-2">
                            <label className="flex-1 text-sm">{user?.name || memberId}</label>
                            <input
                              type="number"
                              step={expenseForm.splitType === 'EXACT' ? '0.01' : '0.1'}
                              min="0"
                              value={customSplits[memberId] || ''}
                              onChange={(e) => {
                                setCustomSplits({ ...customSplits, [memberId]: e.target.value });
                                if (expenseForm.payerId && expenseForm.amount) {
                                  setCalculationBreakdown(
                                    calculateExpenseBreakdown(
                                      selectedGroup.id, 
                                      expenseForm.payerId, 
                                      parseFloat(expenseForm.amount), 
                                      expenseForm.splitType,
                                      { ...customSplits, [memberId]: e.target.value }
                                    )
                                  );
                                }
                              }}
                              placeholder={expenseForm.splitType === 'EXACT' ? '0.00' : '0'}
                              className="w-24 px-2 py-1 bg-gray-700 rounded text-sm"
                            />
                            <span className="text-xs text-gray-400">
                              {expenseForm.splitType === 'PERCENT' && '%'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {expenseForm.splitType === 'PERCENT' && (
                      <div className="mt-2 text-xs text-gray-400">
                        Total: {Object.values(customSplits).reduce((sum, val) => sum + parseFloat(val || 0), 0).toFixed(1)}% 
                        {Object.values(customSplits).reduce((sum, val) => sum + parseFloat(val || 0), 0) === 100 && 
                          <span className="text-green-400 ml-2">✓</span>
                        }
                      </div>
                    )}
                    {expenseForm.splitType === 'EXACT' && expenseForm.amount && (
                      <div className="mt-2 text-xs text-gray-400">
                        Total: ${Object.values(customSplits).reduce((sum, val) => sum + parseFloat(val || 0), 0).toFixed(2)} / ${expenseForm.amount}
                        {Math.abs(Object.values(customSplits).reduce((sum, val) => sum + parseFloat(val || 0), 0) - parseFloat(expenseForm.amount)) < 0.01 && 
                          <span className="text-green-400 ml-2">✓</span>
                        }
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-2">Description (optional)</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    placeholder="e.g., Dinner at restaurant"
                    className="w-full px-3 py-2 bg-gray-600 rounded"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 font-bold rounded"
                >
                  Add Expense
                </button>
              </form>

              {/* Visible Calculation Breakdown */}
              {calculationBreakdown && (
                <div className="mt-6 bg-gray-600 p-4 rounded border-l-4 border-yellow-400">
                  <h4 className="font-bold mb-3 text-yellow-300">📐 How This Expense is Split:</h4>
                  <div className="space-y-2 text-sm">
                    {expenseForm.splitType === 'EQUAL' && (
                      <>
                        <div className="text-gray-200">
                          <span className="font-semibold">${expenseForm.amount}</span> split equally among{' '}
                          <span className="font-semibold">{selectedGroup.memberIds.length} people</span>
                        </div>
                        <div className="text-gray-300">
                          = ${(parseFloat(expenseForm.amount) / selectedGroup.memberIds.length).toFixed(2)} per person
                        </div>
                      </>
                    )}
                    {expenseForm.splitType === 'EXACT' && (
                      <div className="text-gray-200">
                        <span className="font-semibold">${expenseForm.amount}</span> split by exact amounts
                      </div>
                    )}
                    {expenseForm.splitType === 'PERCENT' && (
                      <div className="text-gray-200">
                        <span className="font-semibold">${expenseForm.amount}</span> split by percentages
                      </div>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    {Object.entries(calculationBreakdown).map(([uid, data]) => (
                      <div key={uid} className="bg-gray-500 p-2 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{data.userName}</span>
                          <div className="text-right text-sm">
                            <div className="text-gray-300">
                              Share: ${data.share.toFixed(2)}
                              {data.percent !== undefined && ` (${data.percent}%)`}
                            </div>
                            {data.owed > 0 && (
                              <span className="text-green-300 font-bold">+${data.owed.toFixed(2)} (owed back)</span>
                            )}
                            {data.owes > 0 && (
                              <span className="text-red-300 font-bold">-${data.owes.toFixed(2)} (owes)</span>
                            )}
                            {data.owed === 0 && data.owes === 0 && (
                              <span className="text-gray-300">Even</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settlement Form */}
            <div className="mb-8 bg-gray-700 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">✅ Record Payment / Settlement</h3>
              <form onSubmit={addSettlement} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Who is paying?</label>
                  <select
                    value={settlementForm.fromUserId}
                    onChange={(e) => setSettlementForm({ ...settlementForm, fromUserId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-600 rounded"
                    required
                  >
                    <option value="">-- Select Payer --</option>
                    {selectedGroup.memberIds.map(memberId => {
                      const user = users.find(u => u.id === memberId);
                      return (
                        <option key={memberId} value={memberId}>
                          {user?.name || memberId}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Who is receiving payment?</label>
                  <select
                    value={settlementForm.toUserId}
                    onChange={(e) => setSettlementForm({ ...settlementForm, toUserId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-600 rounded"
                    required
                  >
                    <option value="">-- Select Receiver --</option>
                    {selectedGroup.memberIds.map(memberId => {
                      const user = users.find(u => u.id === memberId);
                      return (
                        <option key={memberId} value={memberId}>
                          {user?.name || memberId}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settlementForm.amount}
                    onChange={(e) => setSettlementForm({ ...settlementForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-gray-600 rounded"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 font-bold rounded"
                >
                  Record Settlement
                </button>
              </form>
            </div>

            {/* Balances */}
            {balances && (
              <div className="mb-6 bg-gray-700 p-6 rounded">
                <h3 className="text-xl font-bold mb-4">💰 Balances & Settlements</h3>
                
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-gray-300">👥 Who owes / is owed (Net):</h4>
                  <div className="space-y-2">
                    {selectedGroup.memberIds.map(memberId => {
                      const user = users.find(u => u.id === memberId);
                      const amt = balances.totalsByUser[memberId] || 0;
                      let status = '';
                      let color = '';
                      if (amt > 0.01) {
                        status = 'should receive';
                        color = 'text-green-400 bg-green-900';
                      } else if (amt < -0.01) {
                        status = 'owes';
                        color = 'text-red-400 bg-red-900';
                      } else {
                        status = 'settled';
                        color = 'text-gray-400 bg-gray-600';
                      }
                      return (
                        <div key={memberId} className={`p-3 rounded flex justify-between items-center ${color}`}>
                          <span className="font-semibold">{user?.name}</span>
                          <div className="text-right">
                            <div className="text-sm">{status}</div>
                            <div className="font-bold text-lg">${Math.abs(amt).toFixed(2)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-gray-300">💸 Minimum Payments to Settle:</h4>
                  {balances.simplified.length === 0 ? (
                    <p className="text-green-400 font-semibold text-center py-4">✅ Everyone is settled!</p>
                  ) : (
                    <div className="space-y-2">
                      {balances.simplified.map((edge, i) => {
                        const fromUser = users.find(u => u.id === edge.fromUserId);
                        const toUser = users.find(u => u.id === edge.toUserId);
                        return (
                          <div key={i} className="p-3 bg-blue-700 rounded flex justify-between items-center">
                            <span>
                              <span className="font-bold text-white">{fromUser?.name}</span>
                              <span className="text-gray-300"> pays </span>
                              <span className="font-bold text-white">{toUser?.name}</span>
                            </span>
                            <span className="font-bold text-yellow-300">${edge.amount.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ledger */}
            <div>
              <h3 className="text-xl font-bold mb-4">📋 Transaction Ledger</h3>
              {ledger.length === 0 ? (
                <p className="text-gray-400 p-4 text-center">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {ledger.map(entry => {
                    const fromUser = users.find(u => u.id === entry.type.fromUserId);
                    const toUser = users.find(u => u.id === entry.type.toUserId);
                    const isExpense = entry.type.kind === "EXPENSE_SPLIT";
                    
                    return (
                      <div key={entry.id} className={`p-4 rounded ${isExpense ? 'bg-yellow-900' : 'bg-green-800'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-lg">{isExpense ? '🧾 EXPENSE' : '✓ SETTLEMENT'}</span>
                            {entry.metadata?.description && (
                              <span className="text-gray-300 ml-3">• {entry.metadata.description}</span>
                            )}
                            {entry.metadata?.total && (
                              <span className="text-gray-300 ml-3">Total: ${entry.metadata.total.toFixed(2)}</span>
                            )}
                          </div>
                          <span className="text-gray-400 text-xs">{new Date(entry.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-gray-100 text-sm">
                          {isExpense ? (
                            <>
                              <span className="font-semibold">{fromUser?.name}</span> owes 
                              <span className="font-semibold"> {toUser?.name}</span> 
                              <span className="ml-3 font-bold text-yellow-300">${entry.type.amount.toFixed(2)}</span>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold">{fromUser?.name}</span> paid 
                              <span className="font-semibold"> {toUser?.name}</span> 
                              <span className="ml-3 font-bold text-green-300">${entry.type.amount.toFixed(2)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
