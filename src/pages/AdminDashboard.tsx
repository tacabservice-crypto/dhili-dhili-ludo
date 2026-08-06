import React, { useState, useEffect } from 'react';
import { UserProfile, GameRoom, Agent } from '../types/game';
import UserEditModal from '../components/UserEditModal';
import CreateAgentModal from '../components/CreateAgentModal';
import EditAgentModal from '../components/EditAgentModal';
import CreditAgentModal from '../components/CreditAgentModal';
import { formatCurrency } from '../utils/number';

const AdminDashboard: React.FC = () => {
    const [adminId, setAdminId] = useState<string | null>(localStorage.getItem('admin_id'));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [view, setView] = useState<'stats' | 'users' | 'rooms' | 'transactions' | 'manual-transactions' | 'payment-settings' | 'agents'>('stats');
    const [error, setError] = useState<string | null>(null);

    const defaultPaymentSettings = {
        defaultProvider: 'evc',
        providers: {
            evc: { enabled: false, apiKey: '', merchantId: '', username: '', password: '', accountNumber: '', description: '' },
            edahab: { enabled: false, apiKey: '', merchantId: '', username: '', password: '', accountNumber: '', description: '' },
            sahal: { enabled: false, apiKey: '', merchantId: '', username: '', password: '', accountNumber: '', description: '' },
            premier: { enabled: false, apiKey: '', merchantId: '', username: '', password: '', accountNumber: '', description: '' },
        }
    };

    // Data states
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [rooms, setRooms] = useState<GameRoom[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [manualTransactions, setManualTransactions] = useState<any[]>([]);
    const [paymentSettings, setPaymentSettings] = useState<any>(defaultPaymentSettings);
    const [adminSettings, setAdminSettings] = useState<any>(null);
    const [agents, setAgents] = useState<Agent[]>([]);

    // Modal state
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [creditingAgent, setCreditingAgent] = useState<Agent | null>(null);
    const [viewingUserGames, setViewingUserGames] = useState<GameRoom[] | null>(null);
    const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isCreateAgentModalOpen, setCreateAgentModalOpen] = useState(false);

    const handleAuth = async () => {
        setError(null);
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (!response.ok) {
                let errorMessage = 'Login failed. Please check credentials.';
                try {
                    const data = await response.json();
                    errorMessage = data.error || errorMessage;
                } catch (e) {
                    console.error("Failed to parse error response as JSON", e);
                }
                throw new Error(errorMessage);
            }
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('admin_id', data.userId);
                setAdminId(data.userId);
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_id');
        setAdminId(null);
    };

    const fetchData = async (type: 'stats' | 'users' | 'rooms' | 'transactions' | 'manual-transactions' | 'payment-settings' | 'agents' | 'settings') => {
        if (!adminId) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/${type}?userId=${adminId}`);
            if (!response.ok) {
                let errMessage = `Failed to fetch ${type}`;
                try {
                    const err = await response.json();
                    errMessage = err.error || errMessage;
                } catch(e) { /* ignore json parsing error */ }

                if (response.status === 403 || response.status === 401) {
                    handleLogout();
                }
                throw new Error(errMessage);
            }
            const data = await response.json();
            switch (type) {
                case 'stats': setStats(data); break;
                case 'users': setUsers(data); break;
                case 'rooms': setRooms(data); break;
                case 'transactions': setTransactions(data); break;
                case 'manual-transactions': setManualTransactions(data); break;
                case 'payment-settings': setPaymentSettings({ defaultProvider: data.defaultProvider || 'evc', providers: { ...defaultPaymentSettings.providers, ...(data.providers || {}) } }); break;
                case 'agents': setAgents(data); break;
                case 'settings': setAdminSettings(data); break;
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (adminId) {
            fetchData(view);
            if (view === 'users' && !adminSettings) {
                fetchData('settings');
            }
        }
    }, [adminId, view]);

    const handleSaveUser = async (updatedData: Partial<UserProfile>) => {
        if (!editingUser || !adminId) return;
        try {
            const response = await fetch(`/api/admin/users/${editingUser.id}/update?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to update user');
            setEditingUser(null);
            fetchData('users');
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };
    
    const handleDeleteUser = async (userToDelete: UserProfile) => {
        if (!adminId || !window.confirm(`Are you sure you want to delete user ${userToDelete.username}? This action cannot be undone.`)) return;
        try {
            const response = await fetch(`/api/admin/users/${userToDelete.id}/delete?userId=${adminId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete user');
            fetchData('users');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleImpersonate = async (userToImpersonate: UserProfile) => {
        if (!adminId || !window.confirm(`Are you sure you want to log in as ${userToImpersonate.username}?`)) return;
        try {
            const response = await fetch(`/api/admin/impersonate?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userToImpersonate.id }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/';
            } else {
                throw new Error(data.error || 'Impersonation failed');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleCancelGame = async (roomId: string) => {
        if (!adminId || !window.confirm(`Are you sure you want to cancel room ${roomId}?`)) return;
        try {
            const response = await fetch(`/api/admin/rooms/${roomId}/cancel?userId=${adminId}`, { method: 'POST' });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to cancel room');
            fetchData('rooms');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleViewUserGames = async (user: UserProfile) => {
        if (!adminId) return;
        try {
            const response = await fetch(`/api/admin/users/${user.id}/games?userId=${adminId}`);
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch game history');
            setViewingUser(user);
            setViewingUserGames(await response.json());
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleApproveTransaction = async (transactionId: string) => {
        if (!adminId || !window.confirm('Are you sure you want to approve this transaction?')) return;
        try {
            const response = await fetch(`/api/admin/manual-transactions/${transactionId}/approve?userId=${adminId}`, { method: 'POST' });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to approve transaction');
            fetchData('manual-transactions');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRejectTransaction = async (transactionId: string) => {
        if (!adminId || !window.confirm('Are you sure you want to reject this transaction?')) return;
        try {
            const response = await fetch(`/api/admin/manual-transactions/${transactionId}/reject?userId=${adminId}`, { method: 'POST' });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to reject transaction');
            fetchData('manual-transactions');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleBroadcast = async () => {
        if (!adminId || !broadcastMessage) return;
        try {
            const response = await fetch(`/api/admin/broadcast?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: broadcastMessage }),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to broadcast');
            setBroadcastMessage('');
            alert('Broadcast sent successfully!');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleCreateAgent = async (agentData: { username: string, password: string, commissionRate: string }) => {
        if (!adminId) return;
        try {
            const response = await fetch(`/api/admin/agents/create?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agentData),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to create agent');
            const newAgent = await response.json();
            setCreateAgentModalOpen(false);
            fetchData('agents');
            setCreditingAgent(newAgent);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const handleUpdateAgent = async (agentId: string, data: Partial<Agent>) => {
        if (!adminId) return;
        try {
            const response = await fetch(`/api/admin/agents/${agentId}/update?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to update agent');
            setEditingAgent(null);
            fetchData('agents');
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const handleDeleteAgent = async (agentId: string) => {
        if (!adminId || !window.confirm('Are you sure you want to delete this agent? This action is irreversible.')) return;
        try {
            const response = await fetch(`/api/admin/agents/${agentId}/delete?userId=${adminId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete agent');
            fetchData('agents');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleToggleAgentStatus = async (agent: Agent) => {
        if (!adminId) return;
        const newStatus = agent.status === 'Active' ? 'Suspended' : 'Active';
        if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} agent ${agent.username}?`)) return;
        await handleUpdateAgent(agent.id, { status: newStatus });
    };

    const handleCreditAgentFloat = async (agentId: string, amount: number, discount: number) => {
        if (!adminId) return;
        try {
            const response = await fetch(`/api/admin/agents/credit-float?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, amount, discount }),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to credit agent float');
            setCreditingAgent(null);
            fetchData('agents');
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };
    
    if (!adminId) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center w-full max-w-sm">
                    <h1 className="text-2xl font-bold mb-4">Admin Authentication</h1>
                    <p className="text-gray-400 mb-6">Please enter your admin credentials to continue.</p>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="bg-gray-700 text-white w-full px-4 py-2 rounded mb-4" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="bg-gray-700 text-white w-full px-4 py-2 rounded mb-4" />
                    <button onClick={handleAuth} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full">Login</button>
                    {error && <p className="text-red-500 mt-4">{error}</p>}
                </div>
            </div>
        );
    }

    const renderView = () => {
        switch (view) {
            case 'stats':
                return <div>Stats View Loading...</div>; // Placeholder
            case 'users':
                return <div>Users View Loading...</div>; // Placeholder
            case 'agents':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Agents</h2>
                            <button onClick={() => setCreateAgentModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                                Create Agent
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Commission</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Float Balance</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-900 divide-y divide-gray-700">
                                    {agents.map(agent => (
                                        <tr key={agent.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{agent.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${agent.status === 'Active' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
                                                    {agent.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">{(agent.commissionRate * 100).toFixed(2)}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">{formatCurrency(agent.floatBalance || 0)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => setCreditingAgent(agent)} className="text-green-400 hover:text-green-600">Credit</button>
                                                <button onClick={() => setEditingAgent(agent)} className="text-indigo-400 hover:text-indigo-600">Edit</button>
                                                <button onClick={() => handleToggleAgentStatus(agent)} className="text-yellow-400 hover:text-yellow-600">
                                                    {agent.status === 'Active' ? 'Suspend' : 'Activate'}
                                                </button>
                                                <button onClick={() => handleDeleteAgent(agent.id)} className="text-red-400 hover:text-red-600">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                 return <div>Select a view</div>;
        }
    };

    return (
        <>
            <div className="bg-gray-900 text-white min-h-screen p-8">
                 <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        <div>
                            <button onClick={() => fetchData(view)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4">Refresh</button>
                            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                Logout
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-1 flex space-x-1 mb-6">
                        <button onClick={() => setView('stats')} className={`w-full py-2 rounded ${view === 'stats' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Stats</button>
                        <button onClick={() => setView('users')} className={`w-full py-2 rounded ${view === 'users' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Users</button>
                        <button onClick={() => setView('rooms')} className={`w-full py-2 rounded ${view === 'rooms' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Rooms</button>
                        <button onClick={() => setView('transactions')} className={`w-full py-2 rounded ${view === 'transactions' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Transactions</button>
                        <button onClick={() => setView('manual-transactions')} className={`w-full py-2 rounded ${view === 'manual-transactions' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Manual Transactions</button>
                        <button onClick={() => setView('agents')} className={`w-full py-2 rounded ${view === 'agents' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Agents</button>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                        {error && <p className="text-red-500 mb-4">{error}</p>}
                        {renderView()}
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg mt-6">
                        <h2 className="text-xl font-bold mb-4">Broadcast Message</h2>
                        <textarea
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                            placeholder="Enter message to broadcast to all users"
                            className="bg-gray-700 text-white w-full px-3 py-2 rounded mt-1"
                            rows={3}
                        />
                        <button onClick={handleBroadcast} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-2">
                            Broadcast
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {editingUser && (
                <UserEditModal 
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveUser}
                    isAdmin={true}
                    roles={adminSettings?.roles || []}
                />
            )}
            <EditAgentModal
                isOpen={!!editingAgent}
                agent={editingAgent}
                onClose={() => setEditingAgent(null)}
                onSave={handleUpdateAgent}
            />
            <CreditAgentModal
                isOpen={!!creditingAgent}
                agent={creditingAgent}
                onClose={() => setCreditingAgent(null)}
                onSave={handleCreditAgentFloat}
            />
            {renderGameHistoryModal()}
            <CreateAgentModal
                isOpen={isCreateAgentModalOpen}
                onClose={() => setCreateAgentModalOpen(false)}
                onCreateAgent={handleCreateAgent}
            />
        </>
    );
};

export default AdminDashboard;
