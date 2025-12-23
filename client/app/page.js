'use client';

import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [balances, setBalances] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

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

  const addExpense = async (groupId) => {
    const payerId = prompt('Payer user ID:');
    const amount = parseFloat(prompt('Amount:'));
    const description = prompt('Description (optional):');
    const group = groups.find(g => g.id === groupId);
    
    await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        payerId,
        amount,
        description,
        splitType: 'EQUAL',
        splits: group.memberIds.map(id => ({ userId: id, value: 1 }))
      })
    });
    
    fetchBalances(groupId);
    fetchLedger(groupId);
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
          <p className="text-gray-400">JavaScript + React + Next.js Frontend</p>
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
            <h2 className="text-2xl font-bold mb-4">Group: {selectedGroup.name}</h2>
            <button
              onClick={() => addExpense(selectedGroup.id)}
              className="mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
            >
              Add Expense (Equal Split)
            </button>

            {/* Balances */}
            {balances && (
              <div className="mb-6 bg-gray-700 p-4 rounded">
                <h3 className="text-xl font-bold mb-4">💰 Balances & Settlements</h3>
                
                <div className="mb-4">
                  <h4 className="font-semibold mb-2 text-sm text-gray-300">Who owes / is owed (Net):</h4>
                  <ul className="space-y-2 mb-4">
                    {Object.entries(balances.totalsByUser).map(([uid, amt]) => {
                      const user = users.find(u => u.id === uid);
                      let status = '';
                      let color = '';
                      if (amt > 0.01) {
                        status = 'should receive';
                        color = 'text-green-400';
                      } else if (amt < -0.01) {
                        status = 'owes';
                        color = 'text-red-400';
                      } else {
                        status = 'settled';
                        color = 'text-gray-400';
                      }
                      return (
                        <li key={uid} className={`p-2 bg-gray-600 rounded flex justify-between items-center`}>
                          <span>{user?.name || uid}</span>
                          <span className={`font-bold ${color}`}>{status} ${Math.abs(amt).toFixed(2)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm text-gray-300">Minimum Payments to Settle:</h4>
                  {balances.simplified.length === 0 ? (
                    <p className="text-gray-400 text-sm">Everyone is settled! ✓</p>
                  ) : (
                    <ul className="space-y-2">
                      {balances.simplified.map((edge, i) => {
                        const fromUser = users.find(u => u.id === edge.fromUserId);
                        const toUser = users.find(u => u.id === edge.toUserId);
                        return (
                          <li key={i} className="p-2 bg-blue-600 rounded">
                            <span className="font-semibold">{fromUser?.name}</span> pays 
                            <span className="font-semibold"> {toUser?.name}</span>: 
                            <span className="font-bold ml-2">${edge.amount.toFixed(2)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Ledger */}
            <div>
              <h3 className="text-xl font-bold mb-4">📋 Transaction Ledger</h3>
              <div className="space-y-3">
                {ledger.length === 0 ? (
                  <p className="text-gray-400">No transactions yet</p>
                ) : (
                  ledger.map(entry => {
                    const fromUser = users.find(u => u.id === entry.type.fromUserId);
                    const toUser = users.find(u => u.id === entry.type.toUserId);
                    const isExpense = entry.type.kind === "EXPENSE_SPLIT";
                    const isSettlement = entry.type.kind === "SETTLEMENT";
                    
                    return (
                      <div key={entry.id} className={`p-3 rounded text-sm ${isSettlement ? 'bg-green-700' : 'bg-gray-700'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="font-bold">{isExpense ? '🧾 EXPENSE' : '✓ SETTLEMENT'}</span>
                            {entry.metadata?.description && (
                              <span className="text-gray-300 ml-2">• {entry.metadata.description}</span>
                            )}
                            {entry.metadata?.total && (
                              <span className="text-gray-400 ml-2">• ${entry.metadata.total.toFixed(2)}</span>
                            )}
                          </div>
                          <span className="text-gray-400 text-xs">{new Date(entry.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-gray-200">
                          {isExpense ? (
                            <>
                              <span className="font-semibold">{fromUser?.name}</span> owes 
                              <span className="font-semibold"> {toUser?.name}</span>: 
                              <span className="ml-2 font-bold text-yellow-300">${entry.type.amount.toFixed(2)}</span>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold">{fromUser?.name}</span> paid 
                              <span className="font-semibold"> {toUser?.name}</span>: 
                              <span className="ml-2 font-bold text-green-300">${entry.type.amount.toFixed(2)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
