/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Agent, AgentTransaction, UserProfile } from './types/game';

// A simple API client
const apiClient = {
  get: async (url: string, agentId: string) => {
    const res = await fetch(`${url}?agentId=${agentId}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'An error occurred');
    }
    return res.json();
  },
  post: async (url: string, agentId: string, body: object) => {
    const res = await fetch(`${url}?agentId=${agentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'An error occurred');
    }
    return res.json();
  }
};

const AgentDashboard = () => {
  const [agentId, setAgentId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Partial<UserProfile>[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Partial<UserProfile> | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);

  useEffect(() => {
    // Check local storage for a saved agentId
    const savedAgentId = localStorage.getItem('agentId');
    if (savedAgentId) {
      handleLogin(savedAgentId);
    }
  }, []);

  const handleLogin = async (idToLogin: string) => {
    setLoading(true);
    setError(null);
    try {
      // First, fetch the agent's profile to validate the agentId
      const agentData = await apiClient.get('/api/agent/profile', idToLogin);
      
      // If the profile is fetched successfully, then get the transactions
      const txs = await apiClient.get('/api/agent/transactions', idToLogin);

      if (agentData) {
        setAgent(agentData);
        setTransactions(txs);
        setIsLoggedIn(true);
        setAgentId(idToLogin);
        localStorage.setItem('agentId', idToLogin);
      } else {
        throw new Error('Agent data could not be retrieved.');
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoggedIn(false);
      localStorage.removeItem('agentId');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAgentId('');
    setAgent(null);
    localStorage.removeItem('agentId');
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    };
    setLoading(true);
    try {
      const results = await apiClient.get(`/api/agent/player-lookup?query=${searchQuery}`, agentId);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!selectedPlayer || !depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please select a player and enter a valid amount.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.post('/api/agent/deposit', agentId, {
        playerId: selectedPlayer.id,
        amount: depositAmount,
      });
      alert(`Success! Deposited $${depositAmount} to ${selectedPlayer.username}. Your new float balance is $${result.newAgentBalance.toFixed(2)}`);
      // Refresh agent data and transactions
      handleLogin(agentId);
      setSelectedPlayer(null);
      setDepositAmount('');
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm p-6 bg-slate-800 border border-slate-700 rounded-xl">
          <h1 className="text-2xl font-bold text-center text-purple-400">Agent Login</h1>
          <input 
            type="text" 
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Enter Agent ID" 
            className="mt-4 w-full bg-slate-700 p-2 rounded-lg border border-slate-600" 
          />
          <button 
            onClick={() => handleLogin(agentId)}
            disabled={loading}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold disabled:bg-slate-500"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <p className="mt-4 text-center text-red-400">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-purple-400">Agent Dashboard</h1>
          <button onClick={handleLogout} className="text-sm text-red-400 hover:underline">Logout</button>
        </div>
        
        <div className="mt-4 text-lg">
          Welcome, <span className="font-bold">{agent?.userId}</span>!
        </div>
        <div className="mt-2 p-4 bg-green-800/50 border border-green-500 rounded-xl">
          Float Balance: <span className="font-mono text-2xl font-bold">${agent?.floatBalance.toFixed(2)}</span>
        </div>

        {error && <div className="mt-4 p-3 bg-red-800/50 border border-red-500 rounded-xl text-white">{error}</div>}
        
        <div className="mt-8 p-6 bg-slate-800 border border-slate-700 rounded-xl">
          <h2 className="text-2xl font-semibold">Player Deposit</h2>
          
          <div className="mt-4">
            <label className="font-bold">1. Find Player</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Player Username..." 
                className="mt-2 flex-grow bg-slate-700 p-2 rounded-lg border border-slate-600" 
              />
              <button onClick={handleSearch} disabled={loading} className="mt-2 bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-bold disabled:bg-slate-500">Search</button>
            </div>
          </div>
          
          {searchResults.length > 0 && !selectedPlayer && (
            <div className="mt-4 space-y-2">
              {searchResults.map(player => (
                <div key={player.id} onClick={() => setSelectedPlayer(player)} className="flex items-center gap-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer">
                  <span className="text-2xl">{player.avatar}</span>
                  <span>{player.username}</span>
                </div>
              ))}
            </div>
          )}

          {selectedPlayer && (
            <div className="mt-6 border-t border-purple-500/30 pt-6">
              <div className="flex justify-between items-start p-3 bg-slate-700 rounded-lg">
                <div>
                  <label className="font-bold text-purple-300">2. Deposit to Player</label>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-3xl">{selectedPlayer.avatar}</span>
                    <span className="text-xl font-bold">{selectedPlayer.username}</span>
                  </div>
                </div>
                <button onClick={() => { setSelectedPlayer(null); setSearchResults([]); setSearchQuery(''); }} className="text-sm text-amber-400 hover:underline">Change Player</button>
              </div>

              <div className="mt-4">
                <label className="font-bold">3. Enter Amount</label>
                <input 
                  type="number" 
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="$0.00" 
                  className="mt-2 w-full bg-slate-900 font-mono text-lg p-2 rounded-lg border border-slate-600" 
                />
              </div>

              <button 
                onClick={handleDeposit} 
                disabled={loading}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg text-lg font-bold disabled:bg-slate-500"
              >
                {loading ? 'Processing...' : `Confirm Deposit of $${depositAmount || 0}`}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8">
            <h2 className="text-2xl font-semibold">Transaction History</h2>
            <div className="mt-4 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-700 text-xs text-slate-300 uppercase">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr key={tx.id} className="border-b border-slate-700 last:border-b-0">
                                <td className="px-4 py-3 text-slate-400">{new Date(tx.timestamp).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.type === 'PlayerDeposit' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}`}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{tx.description}</td>
                                <td className={`px-4 py-3 font-mono text-right ${tx.type === 'PlayerDeposit' ? 'text-red-400' : 'text-green-400'}`}>
                                    {tx.type === 'PlayerDeposit' ? '-' : '+'}${tx.amount.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AgentDashboard />
  </React.StrictMode>
);
