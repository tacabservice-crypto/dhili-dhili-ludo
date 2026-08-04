import React, { useState, useEffect } from 'react';
import { Activity, CreditCard, Users, Layers, ShieldCheck, RefreshCw, LogOut, Settings, Bell, Search, Menu, X } from 'lucide-react';
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
    const [view, setView] = useState<'stats' | 'users' | 'rooms' | 'transactions' | 'manual-transactions' | 'payment-settings' | 'admin-settings'>('stats');
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

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [roomSearch, setRoomSearch] = useState('');
    const [roomFilter, setRoomFilter] = useState<'all' | 'waiting' | 'playing' | 'completed'>('all');
    const [transactionSearch, setTransactionSearch] = useState('');
    const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'bet' | 'win'>('all');

    // Modal state
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [viewingUserGames, setViewingUserGames] = useState<GameRoom[] | null>(null);
    const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
    const [broadcastMessage, setBroadcastMessage] = useState('');

    const [adminOldPassword, setAdminOldPassword] = useState('');
    const [adminNewPassword, setAdminNewPassword] = useState('');
    const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
    const [adminSettingsMessage, setAdminSettingsMessage] = useState<string | null>(null);
    const [roles, setRoles] = useState<Array<{ id: string; name: string; permissions: string[] }>>([
        { id: 'admin', name: 'Administrator', permissions: ['all'] },
        { id: 'editor', name: 'Editor', permissions: ['manage_users', 'manage_content'] },
    ]);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRolePermissions, setNewRolePermissions] = useState<Record<string, boolean>>({
        manageUsers: true,
        manageRooms: false,
        managePayments: false,
        manageTransactions: false,
        broadcast: true,
    });

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

    const fetchData = async (type: 'stats' | 'users' | 'rooms' | 'transactions' | 'manual-transactions' | 'payment-settings' | 'admin-settings') => {
        if (!adminId) return;
        if (type === 'admin-settings') return;
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

    const visibleUsers = users.filter((user) => {
        const query = userSearch.toLowerCase();
        return (
            user.username.toLowerCase().includes(query) ||
            user.id.toLowerCase().includes(query) ||
            (user.phone || '').toLowerCase().includes(query)
        );
    });

    const visibleRooms = rooms.filter((room) => {
        const matchesQuery = roomSearch ? room.id.toLowerCase().includes(roomSearch.toLowerCase()) : true;
        const matchesStatus = roomFilter === 'all' ? true : room.status === roomFilter;
        return matchesQuery && matchesStatus;
    });

    const visibleTransactions = transactions.filter((tx) => {
        const query = transactionSearch.toLowerCase();
        const matchesQuery =
            tx.userId?.toLowerCase().includes(query) ||
            tx.description?.toLowerCase().includes(query) ||
            tx.type?.toLowerCase().includes(query);
        const matchesType =
            transactionTypeFilter === 'all'
                ? true
                : transactionTypeFilter === 'deposit'
                ? tx.type === 'deposit'
                : transactionTypeFilter === 'withdrawal'
                ? tx.type === 'withdrawal'
                : transactionTypeFilter === 'bet'
                ? tx.type?.includes('bet')
                : transactionTypeFilter === 'win'
                ? tx.type?.includes('win')
                : true;
        return matchesQuery && matchesType;
    });

    const sidebarItems = [
        { key: 'stats', label: 'Stats', icon: Activity },
        { key: 'users', label: 'Users Management', icon: Users },
        { key: 'rooms', label: 'Rooms Management', icon: Layers },
        { key: 'transactions', label: 'Transactions History', icon: CreditCard },
        { key: 'manual-transactions', label: 'Manual Transactions', icon: ShieldCheck },
        { key: 'payment-settings', label: 'Payment Settings', icon: Settings },
        { key: 'admin-settings', label: 'Admin Settings', icon: Bell },
    ];

    const statusClasses = (status: string) => {
        if (status === 'approved') return 'bg-emerald-500/15 text-emerald-300';
        if (status === 'pending') return 'bg-amber-500/15 text-amber-300';
        if (status === 'rejected') return 'bg-rose-500/15 text-rose-300';
        if (status === 'playing') return 'bg-emerald-500/15 text-emerald-300';
        if (status === 'waiting') return 'bg-amber-500/15 text-amber-300';
        if (status === 'completed') return 'bg-slate-500/15 text-slate-300';
        return 'bg-slate-700/20 text-slate-200';
    };

    const renderStatusBadge = (status: string) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(status)}`}>{status}</span>
    );


    const handleSaveUser = async (updatedData: any) => {
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

    const handleSaveAdminSettings = () => {
        setError(null);
        setAdminSettingsMessage(null);

        if (adminNewPassword && adminNewPassword !== adminConfirmPassword) {
            setError('New password and confirmation must match.');
            return;
        }

        // Note: backend integration for admin settings is optional. This UI saves locally and can be extended.
        setAdminSettingsMessage('Admin settings updated successfully.');
        setAdminOldPassword('');
        setAdminNewPassword('');
        setAdminConfirmPassword('');
    };

    const handleAddRole = () => {
        const trimmedName = newRoleName.trim();
        if (!trimmedName) {
            setError('Please enter a role name.');
            return;
        }

        const permissionKeys = Object.entries(newRolePermissions)
            .filter(([_, enabled]) => enabled)
            .map(([permission]) => permission);

        setRoles((prev) => [
            ...prev,
            {
                id: `${trimmedName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                name: trimmedName,
                permissions: permissionKeys,
            },
        ]);

        setNewRoleName('');
        setNewRolePermissions({
            manageUsers: true,
            manageRooms: false,
            managePayments: false,
            manageTransactions: false,
            broadcast: true,
        });
        setAdminSettingsMessage('New role added successfully.');
    };

    const handleRemoveRole = (roleId: string) => {
        setRoles((prev) => prev.filter((role) => role.id !== roleId));
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
                <div className="bg-gray-800 rounded-none shadow-xl p-6 w-full max-w-2xl">
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
                <div className="bg-gray-800 p-8 rounded-none shadow-lg text-center w-full max-w-sm">
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
                if (!stats) return <p className="text-slate-400">Loading stats...</p>;
                return (
                    <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            <div className="rounded-none border border-slate-800 bg-slate-950/70 p-6">
                                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Total Users</p>
                                <p className="mt-4 text-4xl font-semibold text-slate-100">{stats.totalUsers}</p>
                            </div>
                            <div className="rounded-none border border-slate-800 bg-slate-950/70 p-6">
                                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Rooms Played</p>
                                <p className="mt-4 text-4xl font-semibold text-slate-100">{stats.totalRooms}</p>
                            </div>
                            <div className="rounded-none border border-slate-800 bg-slate-950/70 p-6">
                                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">House Revenue</p>
                                <p className="mt-4 text-4xl font-semibold text-slate-100">{formatCurrency(stats.houseRevenue)}</p>
                            </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                            <div className="rounded-none border border-slate-800 bg-slate-950/60 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Revenue & activity</p>
                                        <h3 className="mt-2 text-xl font-semibold text-slate-100">Daily performance</h3>
                                    </div>
                                    <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-200">Live</span>
                                </div>
                                <div className="mt-6 h-[320px] rounded-none bg-slate-900/90 p-6 text-slate-500">
                                    <p className="text-sm text-slate-500">Chart preview placeholder</p>
                                    <div className="mt-5 h-full rounded-none bg-slate-950/80" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-none border border-slate-800 bg-slate-950/60 p-6">
                                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Active Rooms</p>
                                    <p className="mt-4 text-4xl font-semibold text-emerald-300">{stats.activeRooms}</p>
                                </div>
                                <div className="rounded-none border border-slate-800 bg-slate-950/60 p-6">
                                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Waiting Rooms</p>
                                    <p className="mt-4 text-4xl font-semibold text-amber-300">{stats.waitingRooms}</p>
                                </div>
                                <div className="rounded-none border border-slate-800 bg-slate-950/60 p-6">
                                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Online Clients</p>
                                    <p className="mt-4 text-4xl font-semibold text-slate-100">{stats.onlineClients}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-none border border-slate-800 bg-slate-950/70 p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Broadcast announcement</p>
                                    <h3 className="mt-2 text-xl font-semibold text-slate-100">Send a message to all users</h3>
                                </div>
                                <button onClick={handleBroadcast} className="inline-flex items-center rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
                                    Broadcast
                                </button>
                            </div>
                            <textarea
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                placeholder="Type your broadcast message here..."
                                className="mt-6 min-h-[140px] w-full rounded-none border border-slate-800 bg-slate-900 px-4 py-4 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-300">Search users</p>
                                <p className="text-sm text-slate-500">Filter players by name, ID, or phone number.</p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Search username, ID or phone"
                                        className="rounded-3xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <button onClick={() => setUserSearch('')} className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-900">
                                    Clear
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-none border border-slate-800 bg-slate-950/70 p-4">
                            <table className="min-w-full divide-y divide-slate-800">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">User ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Phone</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Balance</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Games Played</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900">
                                    {visibleUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">{user.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 flex items-center gap-2">
                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">{user.avatar}</span>
                                                {user.username}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.phone || '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-300">{formatCurrency(user.balance)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.gamesPlayed ?? user.winCount + user.lossCount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{renderStatusBadge(user.role || 'player')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                <button onClick={() => handleViewUserGames(user)} className="text-slate-300 hover:text-white">History</button>
                                                <button onClick={() => setEditingUser(user)} className="text-indigo-300 hover:text-indigo-100">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'rooms':
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-100">Filter rooms</h3>
                                <p className="text-sm text-slate-400">Search by room ID or filter by game status.</p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <input
                                    type="text"
                                    value={roomSearch}
                                    onChange={(e) => setRoomSearch(e.target.value)}
                                    placeholder="Search room ID"
                                    className="rounded-3xl border border-slate-800 bg-slate-950/80 py-3 px-4 text-sm text-slate-100 outline-none focus:border-indigo-500"
                                />
                                <select
                                    value={roomFilter}
                                    onChange={(e) => setRoomFilter(e.target.value as any)}
                                    className="rounded-3xl border border-slate-800 bg-slate-950/80 py-3 px-4 text-sm text-slate-100 outline-none focus:border-indigo-500"
                                >
                                    <option value="all">All rooms</option>
                                    <option value="waiting">Waiting</option>
                                    <option value="playing">Playing</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-none border border-slate-800 bg-slate-950/70 p-4">
                            <table className="min-w-full divide-y divide-slate-800">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Room ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Players</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Bet</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Created</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900">
                                    {visibleRooms.map((room) => (
                                        <tr key={room.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">{room.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{renderStatusBadge(room.status)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{room.players.length} / {room.capacity || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-300">${room.betAmount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(room.createdAt).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleCancelGame(room.id)} className="rounded-2xl bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20">Cancel</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'transactions':
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-100">Transaction history</h3>
                                <p className="text-sm text-slate-400">Search and filter system transactions for audits and reporting.</p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <input
                                    type="text"
                                    value={transactionSearch}
                                    onChange={(e) => setTransactionSearch(e.target.value)}
                                    placeholder="Search user, type or description"
                                    className="rounded-3xl border border-slate-800 bg-slate-950/80 py-3 px-4 text-sm text-slate-100 outline-none focus:border-indigo-500"
                                />
                                <select
                                    value={transactionTypeFilter}
                                    onChange={(e) => setTransactionTypeFilter(e.target.value as any)}
                                    className="rounded-3xl border border-slate-800 bg-slate-950/80 py-3 px-4 text-sm text-slate-100 outline-none focus:border-indigo-500"
                                >
                                    <option value="all">All types</option>
                                    <option value="deposit">Deposit</option>
                                    <option value="withdrawal">Withdrawal</option>
                                    <option value="bet">Bet</option>
                                    <option value="win">Win</option>
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-none border border-slate-800 bg-slate-950/70 p-4">
                            <table className="min-w-full divide-y divide-slate-800">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900">
                                    {visibleTransactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(tx.timestamp).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">{tx.userId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{tx.type}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${tx.type === 'deposit' || tx.type === 'win_payout' ? 'text-emerald-300' : 'text-rose-300'}`}>{formatCurrency(tx.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{tx.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{tx.status || 'success'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'manual-transactions':
                return (
                    <div className="space-y-6">
                        <div className="rounded-none border border-slate-800 bg-slate-950/70 p-6">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Pending requests</p>
                                    <h3 className="text-xl font-semibold text-slate-100">Manual transaction approvals</h3>
                                </div>
                                <span className="inline-flex rounded-full bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-300">
                                    {pendingManualCount} pending
                                </span>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-none border border-slate-800 bg-slate-950/70 p-4">
                            <table className="min-w-full divide-y divide-slate-800">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Destination</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Sender</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Provider</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900">
                                    {manualTransactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{tx.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{tx.transactionType}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${tx.transactionType === 'deposit' ? 'text-emerald-300' : 'text-rose-300'}`}>{formatCurrency(tx.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{tx.phone}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{tx.senderPhone || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{tx.provider}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{renderStatusBadge(tx.status)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                {tx.status === 'pending' ? (
                                                    <>
                                                        <button onClick={() => handleApproveTransaction(tx.id)} className="rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20">Approve</button>
                                                        <button onClick={() => handleRejectTransaction(tx.id)} className="rounded-2xl bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20">Reject</button>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400">No actions</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
                                case 'payment-settings':
                                    return (
                                        <div className="space-y-4">
                                            <p className="text-sm text-gray-400 mb-4">Configure payment provider API keys to enable direct API-based deposits and withdrawals. When API settings exist for a provider, users will use the API instead of the legacy USSD flow.</p>
                                            {PAYMENT_PROVIDERS.map((provider) => {
                                                const config = paymentSettings[provider.key] || { enabled: false };
                                                return (
                                                    <div key={provider.key} className="bg-gray-900 border border-gray-700 rounded-none p-5">
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
                                            {settingsMessage && <div className="rounded-none bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-200">{settingsMessage}</div>}
                                            <button
                                                onClick={handleSavePaymentSettings}
                                                disabled={settingsSaving}
                                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                Save Payment Settings
                                            </button>
                                        </div>
                                    );
                                case 'admin-settings':
                                    return (
                                        <div className="space-y-6">
                                            <div className="border border-slate-800 bg-slate-950/70 p-6 rounded-none">
                                                <h3 className="text-xl font-semibold text-slate-100">Admin security</h3>
                                                <p className="mt-2 text-sm text-slate-400">Change your password and secure access to the admin console.</p>
                                                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                                    <label className="block text-sm text-slate-200">
                                                        Current Password
                                                        <input
                                                            type="password"
                                                            value={adminOldPassword}
                                                            onChange={(e) => setAdminOldPassword(e.target.value)}
                                                            className="mt-2 w-full rounded-none border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                                        />
                                                    </label>
                                                    <label className="block text-sm text-slate-200">
                                                        New Password
                                                        <input
                                                            type="password"
                                                            value={adminNewPassword}
                                                            onChange={(e) => setAdminNewPassword(e.target.value)}
                                                            className="mt-2 w-full rounded-none border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                                        />
                                                    </label>
                                                    <label className="block text-sm text-slate-200">
                                                        Confirm Password
                                                        <input
                                                            type="password"
                                                            value={adminConfirmPassword}
                                                            onChange={(e) => setAdminConfirmPassword(e.target.value)}
                                                            className="mt-2 w-full rounded-none border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                                        />
                                                    </label>
                                                </div>
                                                <div className="mt-6">
                                                    <button onClick={handleSaveAdminSettings} className="inline-flex items-center gap-2 rounded-none bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500">
                                                        Save Admin Settings
                                                    </button>
                                                    {adminSettingsMessage && <p className="mt-4 text-sm text-emerald-300">{adminSettingsMessage}</p>}
                                                </div>
                                            </div>
                                            <div className="border border-slate-800 bg-slate-950/70 p-6 rounded-none">
                                                <h3 className="text-xl font-semibold text-slate-100">Roles & permissions</h3>
                                                <p className="mt-2 text-sm text-slate-400">Create role templates such as Editor and assign the abilities they need.</p>
                                                <div className="mt-6 space-y-4">
                                                    <div className="space-y-3 border border-slate-800 bg-slate-900 p-4 rounded-none">
                                                        <h4 className="text-lg font-semibold text-slate-100">Create new role</h4>
                                                        <input
                                                            type="text"
                                                            value={newRoleName}
                                                            onChange={(e) => setNewRoleName(e.target.value)}
                                                            placeholder="Role name (e.g. Editor)"
                                                            className="w-full rounded-none border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                                        />
                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                            {[
                                                                { key: 'manageUsers', label: 'Manage Users' },
                                                                { key: 'manageRooms', label: 'Manage Rooms' },
                                                                { key: 'managePayments', label: 'Manage Payments' },
                                                                { key: 'manageTransactions', label: 'Manage Transactions' },
                                                                { key: 'broadcast', label: 'Broadcast Messages' },
                                                            ].map((permission) => (
                                                                <label key={permission.key} className="inline-flex items-center gap-2 text-sm text-slate-200">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={newRolePermissions[permission.key] || false}
                                                                        onChange={(e) => setNewRolePermissions((prev) => ({
                                                                            ...prev,
                                                                            [permission.key]: e.target.checked,
                                                                        }))}
                                                                        className="accent-indigo-500 h-4 w-4"
                                                                    />
                                                                    {permission.label}
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <button onClick={handleAddRole} className="inline-flex items-center gap-2 rounded-none bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
                                                            Add Role
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3 border border-slate-800 bg-slate-900 p-4 rounded-none">
                                                        <h4 className="text-lg font-semibold text-slate-100">Existing roles</h4>
                                                        <div className="space-y-3">
                                                            {roles.map((role) => (
                                                                <div key={role.id} className="flex flex-col gap-3 border border-slate-800 bg-slate-950 p-4 rounded-none">
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <div>
                                                                            <p className="font-semibold text-slate-100">{role.name}</p>
                                                                            <p className="text-sm text-slate-400">{role.permissions.length ? role.permissions.join(', ') : 'No permissions assigned'}</p>
                                                                        </div>
                                                                        {role.id !== 'admin' ? (
                                                                            <button onClick={() => handleRemoveRole(role.id)} className="rounded-none bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400">
                                                                                Remove
                                                                            </button>
                                                                        ) : (
                                                                            <span className="rounded-full bg-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200">System</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                default:
                                    return null;
                            }
    };

    const viewTitles: Record<string, string> = {
        stats: 'Overview',
        users: 'Users',
        rooms: 'Rooms',
        transactions: 'Transactions',
        'manual-transactions': 'Manual Approvals',
        'payment-settings': 'Payment Settings',
        'admin-settings': 'Admin Settings',
    };

    const viewDescriptions: Record<string, string> = {
        stats: 'See overall platform performance and latest activity at a glance.',
        users: 'Browse and manage registered users, including status and history.',
        rooms: 'Review active game rooms and manage room state.',
        transactions: 'Inspect deposit and withdrawal transactions.',
        'manual-transactions': 'Approve or reject manual withdrawal requests from users.',
        'payment-settings': 'Configure provider API details for automated processing.',
        'admin-settings': 'Update admin credentials, manage roles, and control access policies.',
    };

    const activeViewTitle = viewTitles[view] || 'Admin Panel';
    const activeViewDescription = viewDescriptions[view] || '';
    const providerCount = PAYMENT_PROVIDERS.filter((provider) => paymentSettings[provider.key]?.enabled).length;
    const pendingManualCount = manualTransactions.filter((tx) => tx.status === 'pending').length;

    return (
        <>
            <div className="min-h-screen bg-slate-950 text-slate-100">
                <div className="mx-auto flex min-h-screen max-w-[1700px] flex-col px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4 lg:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 text-slate-100 shadow-sm shadow-slate-950/20"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
                            <h1 className="text-xl font-semibold">Dhili Dhili Ludo</h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 rounded-3xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-900/20"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-8">
                        <aside className="hidden xl:block">
                            <div className="rounded-none border border-slate-800/80 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Dhili Dhili Ludo</p>
                                        <h2 className="mt-2 text-3xl font-semibold">Admin Console</h2>
                                    </div>
                                    <div className="rounded-2xl bg-slate-800 p-3 text-slate-300">
                                        <Bell className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="mt-8 space-y-4">
                                    <div className="rounded-none bg-slate-950/70 p-4 ring-1 ring-slate-800/70">
                                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Platform status</p>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-none border border-slate-800 bg-slate-900 p-4">
                                                <p className="text-sm text-slate-400">Users</p>
                                                <p className="mt-2 text-3xl font-semibold text-slate-100">{users.length}</p>
                                            </div>
                                            <div className="rounded-none border border-slate-800 bg-slate-900 p-4">
                                                <p className="text-sm text-slate-400">Pending approvals</p>
                                                <p className="mt-2 text-3xl font-semibold text-amber-400">{pendingManualCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-none bg-slate-950/70 p-4 ring-1 ring-slate-800/70">
                                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Payment providers</p>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-none border border-slate-800 bg-slate-900 p-4">
                                                <p className="text-sm text-slate-400">Configured</p>
                                                <p className="mt-2 text-3xl font-semibold text-slate-100">{providerCount}/{PAYMENT_PROVIDERS.length}</p>
                                            </div>
                                            <div className="rounded-none border border-slate-800 bg-slate-900 p-4">
                                                <p className="text-sm text-slate-400">Current tab</p>
                                                <p className="mt-2 text-3xl font-semibold text-slate-100">{activeViewTitle}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 rounded-none border border-slate-800/80 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Navigation</p>
                                <div className="mt-5 space-y-2">
                                    {sidebarItems.map((item) => {
                                        const Icon = item.icon;
                                        const active = view === item.key;
                                        return (
                                            <button
                                                key={item.key}
                                                onClick={() => {
                                                    setView(item.key as any);
                                                    setMobileMenuOpen(false);
                                                }}
                                                className={`flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left text-sm font-semibold transition ${
                                                    active
                                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                                                        : 'bg-slate-950/80 text-slate-200 hover:bg-slate-900'
                                                }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {item.label}
                                                {item.key === 'manual-transactions' && pendingManualCount > 0 && (
                                                    <span className="ml-auto rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-950">
                                                        {pendingManualCount}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </aside>

                        <main className="space-y-6">
                            <div className="rounded-none border border-slate-800/80 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{activeViewTitle}</p>
                                        <h1 className="mt-2 text-3xl font-semibold text-slate-100">{activeViewTitle}</h1>
                                        <p className="mt-2 max-w-2xl text-sm text-slate-400">{activeViewDescription}</p>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-left">
                                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Users</p>
                                            <p className="mt-3 text-2xl font-semibold text-slate-100">{users.length}</p>
                                        </div>
                                        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-left">
                                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pending Approvals</p>
                                            <p className="mt-3 text-2xl font-semibold text-amber-300">{pendingManualCount}</p>
                                        </div>
                                        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-left">
                                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Providers</p>
                                            <p className="mt-3 text-2xl font-semibold text-slate-100">{providerCount}/{PAYMENT_PROVIDERS.length}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="rounded-none border border-slate-800 bg-slate-950/80 px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Quick action</p>
                                        <p className="mt-1 text-sm text-slate-300">Switch tabs or review pending approvals quickly.</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button onClick={() => fetchData(view)} className="inline-flex items-center gap-2 rounded-3xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-400">
                                            <RefreshCw className="h-4 w-4" />
                                            Refresh
                                        </button>
                                        <button onClick={() => setView('manual-transactions')} className="inline-flex items-center gap-2 rounded-3xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/10 transition hover:bg-amber-400">
                                            <ShieldCheck className="h-4 w-4" />
                                            Manual Approvals
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-none border border-slate-800/80 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
                                {error && <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
                                {renderView()}
                            </div>

                            <div className="rounded-none border border-slate-800/80 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-100">Broadcast Message</h3>
                                        <p className="mt-1 text-sm text-slate-400">Type a message to send immediately to all users.</p>
                                    </div>
                                    <button onClick={handleBroadcast} className="inline-flex items-center rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
                                        Broadcast
                                    </button>
                                </div>
                                <textarea
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    placeholder="Type your broadcast message here..."
                                    className="mt-4 min-h-[140px] w-full rounded-[28px] border border-slate-800 bg-slate-950/80 px-4 py-4 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </main>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 p-4 backdrop-blur-sm xl:hidden">
                        <div className="h-full overflow-y-auto rounded-none border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Menu</p>
                                    <h2 className="mt-1 text-xl font-semibold text-slate-100">Navigate</h2>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-slate-800 bg-slate-950 text-slate-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="mt-6 space-y-3">
                                {sidebarItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = view === item.key;
                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => {
                                                setView(item.key as any);
                                                setMobileMenuOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-3 rounded-3xl px-4 py-4 text-left text-sm font-semibold transition ${
                                                active
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-slate-950/90 text-slate-200 hover:bg-slate-900'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
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
