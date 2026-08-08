/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Agent, AgentTransaction, AgentRequest, PlayerAgentRequest, UserProfile } from './types/game';
import toast, { Toaster } from 'react-hot-toast';
import { Briefcase, Users, History, HelpCircle, LogOut, ChevronsRight, ChevronsLeft, ArrowDown, ArrowUp, Send, UserCheck, UserX, Clock, TrendingUp, TrendingDown, Wallet, UserPlus } from 'lucide-react';

// Transaction Detail Modal Component
const TransactionDetailModal: React.FC<{ transaction: AgentTransaction; onClose: () => void }> = ({ transaction, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md relative border border-slate-700 animate-fade-in-up">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <UserX size={20} />
                </button>
                <h3 className="text-2xl font-bold text-purple-400 mb-6">Transaction Details</h3>
                <div className="space-y-4 text-slate-300">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400">Transaction ID:</span>
                        <span className="font-mono text-sm bg-slate-700 px-2 py-1 rounded">{transaction.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400">Type:</span>
                        <span className={`font-bold text-lg ${transaction.type === 'PlayerDeposit' || transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>{transaction.type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400">Amount:</span>
                        <span className="font-mono text-lg">${transaction.amount.toFixed(2)}</span>
                    </div>
                    {transaction.discountAmount && (
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-400">Discount:</span>
                            <span className="font-mono text-lg">${transaction.discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400">Date:</span>
                        <span>{new Date(transaction.timestamp).toLocaleString()}</span>
                    </div>
                    {transaction.description && (
                        <div>
                            <span className="font-semibold text-slate-400">Description:</span>
                            <p className="mt-1 text-slate-400 p-2 bg-slate-700/50 rounded">{transaction.description}</p>
                        </div>
                    )}
                     {transaction.playerId && <p><strong>Player ID:</strong> <span className="font-mono text-sm">{transaction.playerId}</span></p>}
                    {transaction.playerName && <p><strong>Player Name:</strong> {transaction.playerName}</p>}
                    {transaction.agentId && <p><strong>Agent ID:</strong> <span className="font-mono text-sm">{transaction.agentId}</span></p>}
                </div>
            </div>
        </div>
    );
};

// Sidebar Component
const Sidebar: React.FC<{
    agent: Agent | null;
    handleLogout: () => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}> = ({ agent, handleLogout, isSidebarOpen, toggleSidebar, activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Briefcase },
        { id: 'transactions', label: 'Transactions', icon: History },
        { id: 'requests', label: 'Float Requests', icon: Send },
        { id: 'players', label: 'Players', icon: Users },
    ];

    return (
        <div className={`fixed inset-y-0 left-0 bg-slate-900/80 backdrop-blur-lg text-white w-64 p-5 space-y-6 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex flex-col shadow-2xl shadow-black`}>
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-purple-400">Agent Panel</h2>
                <button onClick={toggleSidebar} className="text-gray-400 focus:outline-none md:hidden hover:text-white transition-colors">
                    <ChevronsLeft className="h-6 w-6" />
                </button>
            </div>
            
            <nav className="flex-grow space-y-2">
                {navItems.map(item => (
                    <a
                        key={item.id}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab(item.id);
                        }}
                        className={`flex items-center py-3 px-4 rounded-lg transition duration-200 ${
                            activeTab === item.id
                                ? 'bg-slate-700/50 text-purple-300'
                                : 'hover:bg-slate-700/30 hover:text-white'
                        }`}
                    >
                        <item.icon className="inline-block mr-3" size={20} /> {item.label}
                    </a>
                ))}
            </nav>

            <div className="mt-auto border-t border-slate-700 pt-4 space-y-4">
                <div className="text-center bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-md font-semibold">{agent?.username}</p>
                    {agent?.promoCode && (
                        <p className="text-xs text-purple-400 font-mono bg-slate-700 px-2 py-1 rounded-full mt-2 inline-block">
                            CODE: {agent.promoCode}
                        </p>
                    )}
                </div>
                <button onClick={handleLogout} className="w-full flex items-center justify-center p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-red-300">
                    <LogOut className="h-5 w-5 mr-2" /> Logout
                </button>
            </div>
        </div>
    );
};

// A simple API client
const AgentDashboard = () => {
    const [agent, setAgent] = useState<Agent | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [transactions, setTransactions] = useState<AgentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [requestAmount, setRequestAmount] = useState('');
    const [agentRequests, setAgentRequests] = useState<AgentRequest[]>([]);
    const [playerRequests, setPlayerRequests] =useState<PlayerAgentRequest[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastFetchedRequestIds, setLastFetchedRequestIds] = useState<Set<string>>(new Set());
    const [selectedTransaction, setSelectedTransaction] = useState<AgentTransaction | null>(null); // New state
    const [paymentInstructions, setPaymentInstructions] = useState('');
    const [cashToSend, setCashToSend] = useState(0);
    const [linkedPlayers, setLinkedPlayers] = useState<UserProfile[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const fetchLinkedPlayers = async (agentId: string) => {
        try {
            const response = await fetch(`/api/agent/my-players?agentId=${agentId}`);
            if (!response.ok) throw new Error('Failed to fetch linked players');
            const data = await response.json();
            setLinkedPlayers(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (agent && requestAmount) {
            const amount = parseFloat(requestAmount);
            if (!isNaN(amount) && amount > 0) {
                const cash = amount * (1 - agent.commissionRate);
                setCashToSend(cash);
            } else {
                setCashToSend(0);
            }
        } else {
            setCashToSend(0);
        }
    }, [requestAmount, agent]);

    const fetchPaymentInstructions = async () => {
        try {
            const response = await fetch('/api/agent/payment-instructions');
            if (!response.ok) {
                console.error('Could not fetch payment instructions');
                return;
            }
            const data = await response.json();
            setPaymentInstructions(data.instructions);
        } catch (err) {
            console.error('Error fetching payment instructions:', err);
        }
    };



    const ITEMS_PER_PAGE = 10;
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);

    const fetchAgentRequests = async (agentId: string) => {
        try {
            const response = await fetch(`/api/agent/requests?agentId=${agentId}`);
            if (!response.ok) throw new Error('Failed to fetch agent requests');
            const data = await response.json();
            setAgentRequests(data);
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const fetchPlayerRequests = async (agentId: string) => {
        try {
            const response = await fetch(`/api/agent/player-requests?agentId=${agentId}`);
            if (!response.ok) throw new Error('Failed to fetch player requests');
            const data: PlayerAgentRequest[] = await response.json();
            
            const currentPendingRequestIds = new Set(data.filter(req => req.status === 'pending').map(req => req.id));
            
            if (lastFetchedRequestIds.size > 0) {
                const newRequestIds = [...currentPendingRequestIds].filter(id => !lastFetchedRequestIds.has(id));
                if (newRequestIds.length > 0) {
                    toast.success(`You have ${newRequestIds.length} new player transaction request(s)!`);
                }
            }
    
            setLastFetchedRequestIds(currentPendingRequestIds);
            setPlayerRequests(data);
        } catch (err: any) {
            console.error(err.message);
        }
    };

    const handleApprove = async (requestId: string) => {
        const agentId = localStorage.getItem('agentId');
        if (!agentId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/agent/player-requests/${requestId}/approve?agentId=${agentId}`, {
                method: 'POST',
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to approve request');
            await fetchPlayerRequests(agentId);
            await fetchProfile(agentId); 
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (requestId: string) => {
        const agentId = localStorage.getItem('agentId');
        if (!agentId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/agent/player-requests/${requestId}/reject?agentId=${agentId}`, {
                method: 'POST',
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to reject request');
            await fetchPlayerRequests(agentId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestFloat = async (e: React.FormEvent) => {
        e.preventDefault();
        const agentId = localStorage.getItem('agentId');
        if (!requestAmount || parseFloat(requestAmount) <= 0 || !agentId) {
          setError('Please enter a valid amount to request.');
          return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/agent/request-float?agentId=${agentId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: requestAmount,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Float request failed');
            
            toast.success(`Success! Your request for $${requestAmount} has been submitted.`);
            await fetchAgentRequests(agentId); 
            setRequestAmount('');
        } catch (err: any) {
          setError(err.message);
          toast.error(err.message || "An error occurred.");
        } finally {
          setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/agent/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            localStorage.setItem('agentId', data.agent.id);
            setAgent(data.agent);
            setIsLoggedIn(true);
            await fetchTransactions(data.agent.id);
            await fetchAgentRequests(data.agent.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('agentId');
        setIsLoggedIn(false);
        setAgent(null);
        setTransactions([]);
        setUsername('');
        setPassword('');
    };

    const fetchTransactions = async (agentId: string) => {
        try {
            const response = await fetch(`/api/agent/transactions?agentId=${agentId}`);
            if (!response.ok) throw new Error('Failed to fetch transactions');
            const data = await response.json();
            setTransactions(data);
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const fetchProfile = async (agentId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/agent/profile?agentId=${agentId}`);
            if (!response.ok) {
                handleLogout();
                throw new Error('Session expired or invalid.');
            }
            const data = await response.json();
            setAgent(data);
            setIsLoggedIn(true);
            await fetchTransactions(data.id);
            await fetchAgentRequests(data.id);
            await fetchPaymentInstructions();
            await fetchLinkedPlayers(data.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedAgentId = localStorage.getItem('agentId');
        if (storedAgentId) {
            fetchProfile(storedAgentId);
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const agentId = agent?.id;
        if (isLoggedIn && agentId) {
            fetchPlayerRequests(agentId);

            const intervalId = setInterval(() => {
                fetchPlayerRequests(agentId);
            }, 5000); 

            return () => clearInterval(intervalId);
        }
    }, [isLoggedIn, agent?.id]);

    if (loading && !isLoggedIn) {
        return <div className="h-screen bg-slate-900 text-white flex items-center justify-center"><div>Loading...</div></div>;
    }

    if (!isLoggedIn || !agent) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md p-8 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl shadow-purple-500/10">
                    <h1 className="text-3xl font-bold text-center text-purple-400 mb-6">Agent Login</h1>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-gray-400 mb-2" htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter Username"
                                className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Password"
                                className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                                required
                            />
                        </div>
                        {error && <p className="text-center text-red-400">{error}</p>}
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-bold disabled:bg-slate-500 transition-transform transform hover:scale-105"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 text-white min-h-screen flex">
            <Toaster position="top-center" toastOptions={{
                className: 'bg-slate-700 text-white',
                duration: 4000,
            }} />

            <Sidebar agent={agent} handleLogout={handleLogout} isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="flex-1 flex flex-col">
                 <header className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-4 flex justify-between items-center sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <button onClick={toggleSidebar} className="text-gray-400 focus:outline-none md:hidden">
                            <ChevronsRight className="h-6 w-6" />
                        </button>
                        <h1 className="text-xl font-bold text-white">Agent Dashboard</h1>
                    </div>
                </header>
                
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    {error && <div className="p-4 mb-6 bg-red-800/50 border border-red-500 rounded-xl text-white">{error}</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl shadow-lg shadow-purple-500/20 flex flex-col justify-between">
                            <div>
                                <p className="text-sm text-purple-200 flex items-center gap-2"><Wallet size={16} />Float Balance</p>
                                <p className="text-4xl font-bold tracking-tighter">${agent?.floatBalance.toFixed(2)}</p>
                            </div>
                            <div className="text-xs text-purple-300 mt-2">Your current working capital.</div>
                        </div>
                        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between">
                             <div>
                                <p className="text-sm text-slate-400 flex items-center gap-2"><UserPlus size={16} /> Linked Players</p>
                                <p className="text-4xl font-bold">{linkedPlayers.length}</p>
                            </div>
                            <div className="text-xs text-slate-500 mt-2">Total players under your network.</div>
                        </div>
                        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between">
                             <div>
                                <p className="text-sm text-slate-400 flex items-center gap-2"><TrendingUp size={16} />Total Commission</p>
                                <p className="text-4xl font-bold text-green-400">$0.00</p>
                            </div>
                            <div className="text-xs text-slate-500 mt-2">Lifetime earnings. (Coming Soon)</div>
                        </div>
                         <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between">
                             <div>
                                <p className="text-sm text-slate-400 flex items-center gap-2"><TrendingDown size={16} />Pending Requests</p>
                                <p className="text-4xl font-bold text-yellow-400">{playerRequests.filter(r => r.status === 'pending').length}</p>
                            </div>
                            <div className="text-xs text-slate-500 mt-2">Player requests needing your action.</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 space-y-8">
                            {activeTab === 'dashboard' && (
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg">
                                    <div className="p-4 border-b border-slate-700">
                                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Clock className="text-purple-400" size={20} />
                                            Player Transaction Requests
                                        </h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-700/50 text-xs text-slate-300 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">Player</th>
                                                    <th className="px-4 py-3">Contact</th>
                                                    <th className="px-4 py-3">Type</th>
                                                    <th className="px-4 py-3 text-right">Amount</th>
                                                    <th className="px-4 py-3 text-center">Status</th>
                                                    <th className="px-4 py-3 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {playerRequests.length > 0 ? playerRequests.map(req => (
                                                    <tr key={req.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                                                        <td className="px-4 py-3 font-medium flex items-center gap-3">
                                                            <span className="text-2xl">{req.playerAvatar}</span>
                                                            <div>
                                                                <div>{req.playerUsername}</div>
                                                                <div className="text-xs text-slate-400 font-mono">{new Date(req.createdAt).toLocaleString()}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-mono">
                                                            {req.type === 'deposit' ? req.senderPhone : req.playerPhone}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`font-semibold ${req.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                                                                {req.type.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-right">${req.amount.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-400/30' :
                                                                req.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-400/30' :
                                                                'bg-red-500/10 text-red-400 border border-red-400/30'
                                                            }`}>
                                                                {req.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {req.status === 'pending' && (
                                                                <div className="flex gap-2 justify-center">
                                                                    <button 
                                                                        onClick={() => handleApprove(req.id)} 
                                                                        disabled={loading}
                                                                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg font-bold text-xs disabled:bg-slate-500 flex items-center gap-1 transition-transform transform hover:scale-105">
                                                                        <UserCheck size={14} /> Approve
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleReject(req.id)} 
                                                                        disabled={loading}
                                                                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg font-bold text-xs disabled:bg-slate-500 flex items-center gap-1 transition-transform transform hover:scale-105">
                                                                        <UserX size={14} /> Reject
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={6} className="text-center py-8 text-slate-500">No pending player requests.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'transactions' && (
                                <div className="p-6 bg-slate-800 border border-slate-700 rounded-2xl">
                                    <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
                                    <div className="overflow-auto max-h-96">
                                        <table className="w-full text-sm text-left">
                                            <tbody>
                                                {currentTransactions.map(tx => (
                                                    <tr key={tx.id} 
                                                        className="border-b border-slate-700/50 last:border-b-0 cursor-pointer hover:bg-slate-700/40"
                                                        onClick={() => setSelectedTransaction(tx)}
                                                    >
                                                        <td className="py-3 px-2">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'PlayerDeposit' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                                {tx.type === 'PlayerDeposit' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <p className="font-semibold">{tx.type}</p>
                                                            <p className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleDateString()}</p>
                                                        </td>
                                                        <td className={`py-3 px-2 font-mono text-right text-lg ${tx.type === 'PlayerDeposit' ? 'text-red-400' : 'text-green-400'}`}>
                                                            {tx.type === 'PlayerDeposit' ? '-' : '+'}${tx.amount.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {totalPages > 1 && (
                                        <div className="mt-4 flex justify-center items-center gap-2">
                                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50">&laquo;</button>
                                            <span className="text-sm">Page {currentPage} of {totalPages}</span>
                                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50">&raquo;</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'requests' && (
                                <div className="p-6 bg-slate-800 border border-slate-700 rounded-2xl">
                                    <h2 className="text-xl font-semibold mb-4">My Float Requests</h2>
                                    <div className="overflow-auto max-h-96">
                                        <table className="w-full text-sm text-left">
                                            <tbody>
                                                {agentRequests.map(req => (
                                                    <tr key={req.id} className="border-b border-slate-700/50 last:border-b-0">
                                                         <td className="py-3 px-2">
                                                            <p className="font-semibold font-mono">${req.amount.toFixed(2)}</p>
                                                            <p className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                                                        </td>
                                                        <td className="py-3 px-2 text-right">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                                                req.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                                                                'bg-red-500/10 text-red-400'
                                                            }`}>{req.status}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'players' && (
                                <div className="p-6 bg-slate-800 border border-slate-700 rounded-2xl">
                                <h2 className="text-xl font-semibold mb-4">My Linked Players</h2>
                                <div className="overflow-auto max-h-96">
                                     <table className="w-full text-sm text-left">
                                        <tbody>
                                            {linkedPlayers.map(player => (
                                                <tr key={player.id} className="border-b border-slate-700/50 last:border-b-0">
                                                    <td className="py-3 px-2 flex items-center gap-3">
                                                        <span className="text-2xl">{player.avatar}</span>
                                                        <span className="font-semibold">{player.username}</span>
                                                    </td>
                                                    <td className="py-3 px-2 font-mono text-right text-lg">${player.balance.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            )}
                        </div>

                        <div className="space-y-8">
                             <div className="p-6 bg-slate-800 border border-slate-700 rounded-2xl">
                                <h2 className="text-xl font-semibold mb-4">Request Float</h2>
                                <form onSubmit={handleRequestFloat} className="space-y-4">
                                    <div>
                                        <label className="text-sm text-slate-400 mb-1 block">Amount to Request</label>
                                        <input
                                            type="number"
                                            value={requestAmount}
                                            onChange={(e) => setRequestAmount(e.target.value)}
                                            placeholder="$0.00"
                                            className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-purple-500 transition"
                                            required
                                        />
                                    </div>
                                    <div className="p-3 bg-slate-700/50 rounded-lg space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Commission Rate:</span>
                                            <span className="text-white font-mono">{(agent.commissionRate * 100).toFixed(2)}%</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold">
                                            <span className="text-purple-300">Cash to Send Admin:</span>
                                            <span className="text-purple-300 font-mono">${cashToSend.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-bold disabled:bg-slate-500 flex items-center justify-center gap-2 transition-transform transform hover:scale-105">
                                        <Send size={16} /> {loading ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </form>
                                <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                                    <h3 className="text-lg font-semibold text-purple-400 mb-2">Payment Instructions</h3>
                                    {paymentInstructions ? (
                                        <p className="text-slate-300 whitespace-pre-wrap text-sm">{paymentInstructions}</p>
                                    ) : (
                                        <p className="text-slate-400 italic text-sm">No payment instructions available. Contact an admin.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
          {selectedTransaction && (
                <TransactionDetailModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                />
            )}
        </div>
      );
};


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AgentDashboard />
  </React.StrictMode>
);
