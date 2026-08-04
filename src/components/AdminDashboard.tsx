import React, { useState, useEffect } from 'react';
import { UserProfile, GameRoom } from '../types/game';
import UserEditModal from './UserEditModal';
import { formatCurrency } from '../utils/number';

interface PaymentProviderConfig {
    enabled: boolean;
    apiKey?: string;
    apiUrl?: string;
    accountNumber?: string;
}

const PAYMENT_PROVIDERS: Array<{ key: string; label: string; description: string }> = [
    { key: 'evc', label: 'EVC Plus', description: 'EVC API configuration' },
    { key: 'edahab', label: 'eDahab', description: 'E-Dahab API configuration' },
    { key: 'sahal', label: 'Sahal', description: 'Sahal API configuration' },
    { key: 'premier', label: 'Premier Bank', description: 'Premier Bank API configuration' },
];

const AdminDashboard: React.FC = () => {
    const [adminId, setAdminId] = useState<string | null>(localStorage.getItem('admin_id'));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [view, setView] = useState<'stats' | 'users' | 'rooms' | 'transactions' | 'manual-transactions' | 'payment-settings'>('stats');
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [rooms, setRooms] = useState<GameRoom[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [manualTransactions, setManualTransactions] = useState<any[]>([]);
    const [paymentSettings, setPaymentSettings] = useState<Record<string, PaymentProviderConfig>>({});
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

    // Modal state
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [viewingUserGames, setViewingUserGames] = useState<GameRoom[] | null>(null);
    const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
    const [broadcastMessage, setBroadcastMessage] = useState('');

    const handleAuth = async () => {
        setError(null);
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (!response.ok) {
                // Try to parse error message, but handle cases where it's not JSON
                let errorMessage = 'Login failed. Please check credentials.';
                try {
                    const data = await response.json();
                    errorMessage = data.error || errorMessage;
                } catch (e) {
                    // Response was not JSON, could be a server error page
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

    const fetchData = async (type: 'stats' | 'users' | 'rooms' | 'transactions' | 'manual-transactions' | 'payment-settings') => {
        if (!adminId) return;
        setError(null);
        try {
            const path = type === 'payment-settings' ? '/api/admin/payment-settings' : `/api/admin/${type}`;
            const response = await fetch(`${path}?userId=${adminId}`);
            if (!response.ok) {
                let errMessage = `Failed to fetch ${type}`;
                try {
                    const err = await response.json();
                    errMessage = err.error || errMessage;
                } catch(e) { /* ignore json parsing error */ }

                if (response.status === 403 || response.status === 401) {
                    handleLogout(); // Log out if session is invalid
                }
                throw new Error(errMessage);
            }
            const data = await response.json();
            switch (type) {
                case 'stats':
                    setStats(data);
                    break;
                case 'users':
                    setUsers(data);
                    break;
                case 'rooms':
                    setRooms(data);
                    break;
                case 'transactions':
                    setTransactions(data);
                    break;
                case 'manual-transactions':
                    setManualTransactions(data);
                    break;
                case 'payment-settings':
                    setPaymentSettings(data);
                    break;
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (adminId) {
            fetchData(view);
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
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update user');
            }
            setEditingUser(null);
            fetchData('users'); // Refresh user list
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const handleSavePaymentSettings = async () => {
        if (!adminId) return;
        setError(null);
        setSettingsSaving(true);
        setSettingsMessage(null);
        try {
            const response = await fetch(`/api/admin/payment-settings?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentProviders: paymentSettings }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to save payment settings');
            }
            const data = await response.json();
            setPaymentSettings(data.paymentProviders || paymentSettings);
            setSettingsMessage('Payment settings saved successfully.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSettingsSaving(false);
        }
    };
    
    const handleDeleteUser = async (userToDelete: UserProfile) => {
        if (!adminId || !window.confirm(`Are you sure you want to delete user ${userToDelete.username}? This action cannot be undone.`)) return;

        try {
            const response = await fetch(`/api/admin/users/${userToDelete.id}/delete?userId=${adminId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete user');
            }
            fetchData('users'); // Refresh user list
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
                // In a real app with JWT, you would get a new token and store it.
                // For this app, we'll just store the user object and refresh the page.
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
            const response = await fetch(`/api/admin/rooms/${roomId}/cancel?userId=${adminId}`, {
                method: 'POST',
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to cancel room');
            }
            fetchData('rooms'); // Refresh rooms list
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleViewUserGames = async (user: UserProfile) => {
        if (!adminId) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/users/${user.id}/games?userId=${adminId}`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `Failed to fetch game history`);
            }
            const data = await response.json();
            setViewingUser(user);
            setViewingUserGames(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleApproveTransaction = async (transactionId: string) => {
        if (!adminId || !window.confirm('Are you sure you want to approve this transaction?')) return;
        try {
            const response = await fetch(`/api/admin/manual-transactions/${transactionId}/approve?userId=${adminId}`, {
                method: 'POST',
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to approve transaction');
            }
            fetchData('manual-transactions');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRejectTransaction = async (transactionId: string) => {
        if (!adminId || !window.confirm('Are you sure you want to reject this transaction?')) return;
        try {
            const response = await fetch(`/api/admin/manual-transactions/${transactionId}/reject?userId=${adminId}`, {
                method: 'POST',
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to reject transaction');
            }
            fetchData('manual-transactions');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const renderGameHistoryModal = () => {
        if (!viewingUserGames || !viewingUser) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
                    <h2 className="text-xl font-bold mb-4 text-white">Game History for {viewingUser.username}</h2>
                    <div className="overflow-y-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Room ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Bet</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-900 divide-y divide-gray-700">
                                {viewingUserGames.map(room => (
                                    <tr key={room.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">{room.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${room.status === 'playing' ? 'bg-green-800 text-green-100' : 'bg-yellow-800 text-yellow-100'}`}>{room.status}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">${room.betAmount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(room.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button onClick={() => setViewingUserGames(null)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleBroadcast = async () => {
        if (!adminId || !broadcastMessage) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/broadcast?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: broadcastMessage }),
            });
            if (!response.ok) {
                let errMessage = 'Failed to broadcast message';
                try {
                  const err = await response.json();
                  errMessage = err.error || errMessage;
                } catch(e) {/*ignore json parse error */}
                throw new Error(errMessage);
            }
            setBroadcastMessage('');
            alert('Broadcast sent successfully!');
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (!adminId) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center w-full max-w-sm">
                    <h1 className="text-2xl font-bold mb-4">Admin Authentication</h1>
                    <p className="text-gray-400 mb-6">Please enter your admin credentials to continue.</p>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="bg-gray-700 text-white w-full px-4 py-2 rounded mb-4"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="bg-gray-700 text-white w-full px-4 py-2 rounded mb-4"
                    />
                    <button onClick={handleAuth} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full">
                        Login
                    </button>
                    {error && <p className="text-red-500 mt-4">{error}</p>}
                </div>
            </div>
        );
    }

    const renderView = () => {
        switch (view) {
            case 'stats':
                if (!stats) return <p>Loading stats...</p>
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-gray-700 p-4 rounded-lg"><p className="text-2xl font-bold">{stats.totalUsers}</p><p className="text-sm text-gray-400">Total Users</p></div>
                        <div className="bg-gray-700 p-4 rounded-lg"><p className="text-2xl font-bold">{stats.totalRooms}</p><p className="text-sm text-gray-400">Total Rooms</p></div>
                        <div className="bg-gray-700 p-4 rounded-lg"><p className="text-2xl font-bold text-green-400">{stats.activeRooms}</p><p className="text-sm text-gray-400">Active Rooms</p></div>
                        <div className="bg-gray-700 p-4 rounded-lg"><p className="text-2xl font-bold text-yellow-400">{stats.waitingRooms}</p><p className="text-sm text-gray-400">Waiting Rooms</p></div>
                        <div className="bg-gray-700 p-4 rounded-lg"><p className="text-2xl font-bold">{formatCurrency(stats.houseRevenue)}</p><p className="text-sm text-gray-400">House Revenue</p></div>
                        <div className="bg-gray-700 p-4 rounded-lg"><p className="text-2xl font-bold">{stats.onlineClients}</p><p className="text-sm text-gray-400">Online Clients</p></div>
                    </div>
                );
            case 'users':
                return (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Balance</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">W/L</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-900 divide-y divide-gray-700">
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white flex items-center"><span className="mr-2 text-xl">{user.avatar}</span> {user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">{formatCurrency(user.balance)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.winCount} / {user.lossCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-400">{user.role || 'Player'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button onClick={() => handleViewUserGames(user)} className="text-gray-400 hover:text-white">History</button>
                                            <button onClick={() => handleImpersonate(user)} className="text-blue-400 hover:text-blue-600">Impersonate</button>
                                            <button onClick={() => setEditingUser(user)} className="text-indigo-400 hover:text-indigo-600">Edit</button>
                                            <button onClick={() => handleDeleteUser(user)} className="text-red-400 hover:text-red-600">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'rooms':
                 return (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Room ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Players</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Bet</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-900 divide-y divide-gray-700">
                                {rooms.map(room => (
                                    <tr key={room.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">{room.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${room.status === 'playing' ? 'bg-green-800 text-green-100' : 'bg-yellow-800 text-yellow-100'}`}>{room.status}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{room.players.length} / {room.capacity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">${room.betAmount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(room.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleCancelGame(room.id)} className="text-red-400 hover:text-red-600">Cancel Game</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'transactions':
                return (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-900 divide-y divide-gray-700">
                                {transactions.map(tx => (
                                    <tr key={tx.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tx.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">{tx.userId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tx.type}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${tx.type.includes('payout') || tx.type.includes('deposit') ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(tx.amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'manual-transactions':
                return (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Destination Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sender Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Provider</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-900 divide-y divide-gray-700">
                                {manualTransactions.map(tx => (
                                    <tr key={tx.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tx.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{tx.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tx.transactionType}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${tx.transactionType === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(tx.amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tx.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tx.senderPhone || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tx.provider}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.status === 'pending' ? 'bg-yellow-800 text-yellow-100' : tx.status === 'approved' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>{tx.status}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {tx.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleApproveTransaction(tx.id)} className="text-green-400 hover:text-green-600">Approve</button>
                                                    <button onClick={() => handleRejectTransaction(tx.id)} className="text-red-400 hover:text-red-600">Reject</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                                case 'payment-settings':
                                    return (
                                        <div className="space-y-4">
                                            <p className="text-sm text-gray-400 mb-4">Configure payment provider API keys to enable direct API-based deposits and withdrawals. When API settings exist for a provider, users will use the API instead of the legacy USSD flow.</p>
                                            {PAYMENT_PROVIDERS.map((provider) => {
                                                const config = paymentSettings[provider.key] || { enabled: false };
                                                return (
                                                    <div key={provider.key} className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                                            <div>
                                                                <h3 className="text-lg font-bold">{provider.label}</h3>
                                                                <p className="text-sm text-gray-500">{provider.description}</p>
                                                            </div>
                                                            <label className="inline-flex items-center gap-2 text-sm font-semibold">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={config.enabled}
                                                                    onChange={(e) => setPaymentSettings(prev => ({
                                                                        ...prev,
                                                                        [provider.key]: {
                                                                            ...config,
                                                                            enabled: e.target.checked
                                                                        }
                                                                    }))}
                                                                    className="accent-blue-500 h-4 w-4"
                                                                />
                                                                Enabled
                                                            </label>
                                                        </div>
                                                        <div className="grid gap-4 sm:grid-cols-2">
                                                            <label className="block text-xs uppercase tracking-wider text-gray-400">
                                                                API URL
                                                                <input
                                                                    type="text"
                                                                    value={config.apiUrl || ''}
                                                                    onChange={(e) => setPaymentSettings(prev => ({
                                                                        ...prev,
                                                                        [provider.key]: {
                                                                            ...config,
                                                                            apiUrl: e.target.value
                                                                        }
                                                                    }))}
                                                                    className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                                />
                                                            </label>
                                                            <label className="block text-xs uppercase tracking-wider text-gray-400">
                                                                API Key
                                                                <input
                                                                    type="text"
                                                                    value={config.apiKey || ''}
                                                                    onChange={(e) => setPaymentSettings(prev => ({
                                                                        ...prev,
                                                                        [provider.key]: {
                                                                            ...config,
                                                                            apiKey: e.target.value
                                                                        }
                                                                    }))}
                                                                    className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                                />
                                                            </label>
                                                            <label className="block text-xs uppercase tracking-wider text-gray-400 sm:col-span-2">
                                                                Account Number / Merchant ID
                                                                <input
                                                                    type="text"
                                                                    value={config.accountNumber || ''}
                                                                    onChange={(e) => setPaymentSettings(prev => ({
                                                                        ...prev,
                                                                        [provider.key]: {
                                                                            ...config,
                                                                            accountNumber: e.target.value
                                                                        }
                                                                    }))}
                                                                    className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {settingsMessage && <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-200">{settingsMessage}</div>}
                                            <button
                                                onClick={handleSavePaymentSettings}
                                                disabled={settingsSaving}
                                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                Save Payment Settings
                                            </button>
                                        </div>
                                    );
                                default:
                                    return null;
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
                        <button onClick={() => setView('payment-settings')} className={`w-full py-2 rounded ${view === 'payment-settings' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Payment Settings</button>
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
            {editingUser && (
                <UserEditModal 
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveUser}
                    isAdmin={true}
                />
            )}
            {renderGameHistoryModal()}
        </>
    );
};

export default AdminDashboard;
