import React, { useState, useEffect } from 'react';
import { UserProfile, GameRoom, Agent } from '../types/game';
import UserEditModal from '../components/UserEditModal';
import CreateAgentModal from '../components/CreateAgentModal';
import EditAgentModal from '../components/EditAgentModal';
import CreditAgentModal from '../components/CreditAgentModal';
import EditRoleModal from '../components/EditRoleModal';
import ChangePasswordForm from '../components/ChangePasswordForm'; // Import ChangePasswordForm
import { formatCurrency } from '../utils/number';

const AdminDashboard: React.FC = () => {
        // Define AdminUser interface to match backend
    interface AdminUser {
        id: string;
        username: string;
        permissions: string[];
    }

    type AdminRole = {
        id: string;
        name: string;
        username: string;
        permissions: string[];
        status: 'active' | 'suspended';
    }

    const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
        const storedUser = localStorage.getItem('admin_user');
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    });
    const adminId = adminUser?.id;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [view, setView] = useState<'stats' | 'users' | 'rooms' | 'transactions' | 'manual-transactions' | 'agents' | 'settings'>('stats');
    const [settingsView, setSettingsView] = useState<'admin' | 'payment' | 'roles'>('admin');
    const [error, setError] = useState<string | null>(null);
    const [adminSettingSuccessMessage, setAdminSettingSuccessMessage] = useState<string | null>(null);
    const [adminSettingErrorMessage, setAdminSettingErrorMessage] = useState<string | null>(null);

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


    const [agents, setAgents] = useState<any[]>([]);

    // Modal state
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [creditingAgent, setCreditingAgent] = useState<Agent | null>(null);
    const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
    const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
    const [viewingUserGames, setViewingUserGames] = useState<GameRoom[] | null>(null);
    const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isCreateAgentModalOpen, setCreateAgentModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleUsername, setNewRoleUsername] = useState('');
    const [newRolePassword, setNewRolePassword] = useState('');
    const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);

    const permissionsList = ['stats', 'users', 'rooms', 'transactions', 'manual-transactions', 'agents', 'settings'];


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
            if (data.success && data.user) {
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                setAdminUser(data.user);
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_user');
        setAdminUser(null);
    };

    const fetchData = async (type: 'stats' | 'users' | 'rooms' | 'transactions' | 'manual-transactions' | 'payment-settings' | 'agents' | 'settings') => {
        if (!adminUser) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/${type}?userId=${adminUser.id}`);
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
                    setPaymentSettings({
                        defaultProvider: data.defaultProvider || 'evc',
                        providers: {
                            ...defaultPaymentSettings.providers,
                            ...(data.providers || {}),
                        },
                    });
                    break;
                case 'agents':
                    setAgents(data);
                    break;
                case 'settings':
                    setAdminSettings(data);
                    break;
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (adminUser) {
            fetchData(view);
            if (view === 'settings') {
                fetchData('payment-settings');
                fetchData('settings');
            }
        }
    }, [adminUser, view]);

    const handleSaveUser = async (updatedData: Partial<UserProfile>) => {
        if (!editingUser || !adminUser) return;
        
        try {
            const response = await fetch(`/api/admin/users/${editingUser.id}/update?userId=${adminUser.id}`, {
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
    
    const handleDeleteUser = async (userToDelete: UserProfile) => {
        if (!adminUser || !window.confirm(`Are you sure you want to delete user ${userToDelete.username}? This action cannot be undone.`)) return;

        try {
            const response = await fetch(`/api/admin/users/${userToDelete.id}/delete?userId=${adminUser.id}`, {
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
        if (!adminUser || !window.confirm(`Are you sure you want to log in as ${userToImpersonate.username}?`)) return;

        try {
            const response = await fetch(`/api/admin/impersonate?userId=${adminUser.id}`, {
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
        if (!adminUser || !window.confirm(`Are you sure you want to cancel room ${roomId}?`)) return;

        try {
            const response = await fetch(`/api/admin/rooms/${roomId}/cancel?userId=${adminUser.id}`, {
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
        if (!adminUser) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/users/${user.id}/games?userId=${adminUser.id}`);
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
        if (!adminUser || !window.confirm('Are you sure you want to approve this transaction?')) return;
        try {
            const response = await fetch(`/api/admin/manual-transactions/${transactionId}/approve?userId=${adminUser.id}`, {
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
        if (!adminUser || !window.confirm('Are you sure you want to reject this transaction?')) return;
        try {
            const response = await fetch(`/api/admin/manual-transactions/${transactionId}/reject?userId=${adminUser.id}`, {
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

    const handleCreateRole = async () => {
        if (!adminUser || !newRoleName || !newRoleUsername || !newRolePassword) {
            setError('Please fill in all fields for the new role.');
            return;
        }
        setError(null);
        try {
            const response = await fetch(`/api/admin/roles/create?userId=${adminUser.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newRoleName,
                    username: newRoleUsername,
                    password: newRolePassword,
                    permissions: newRolePermissions,
                }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create role');
            }
            setNewRoleName('');
            setNewRoleUsername('');
            setNewRolePassword('');
            setNewRolePermissions([]);
            fetchData('settings');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteRole = async (role: AdminRole) => {
        if (!adminUser || !window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/roles/${role.id}/delete?userId=${adminUser.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete role');
            }
            fetchData('settings');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleUpdateRole = async (roleId: string, updatedData: Partial<AdminRole>) => {
        if (!adminUser) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/roles/${roleId}/update?userId=${adminUser.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update role');
            }
            fetchData('settings');
            setEditingRole(null);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const handleToggleRoleStatus = async (role: AdminRole) => {
        const newStatus = role.status === 'active' ? 'suspended' : 'active';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'suspend'} the role "${role.name}"?`)) return;
        await handleUpdateRole(role.id, { status: newStatus });
    };

    const handlePermissionChange = (permission: string) => {
        setNewRolePermissions(prev =>
            prev.includes(permission)
                ? prev.filter(p => p !== permission)
                : [...prev, permission]
        );
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

    if (!adminUser) {
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

    const renderSettingsView = () => {
        return (
            <div>
                <div className="bg-gray-800 rounded-lg p-1 flex space-x-1 mb-6">
                    <button onClick={() => setSettingsView('admin')} className={`w-full py-2 rounded ${settingsView === 'admin' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Admin</button>
                    <button onClick={() => setSettingsView('payment')} className={`w-full py-2 rounded ${settingsView === 'payment' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Payment</button>
                    <button onClick={() => setSettingsView('roles')} className={`w-full py-2 rounded ${settingsView === 'roles' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Roles</button>
                </div>

                {settingsView === 'admin' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-4">Admin Settings</h2>
                            <div className="bg-gray-800 p-6 rounded-lg">
                                <ChangePasswordForm 
                                    userId={adminUser.id}
                                    onSuccess={(message) => {
                                        setAdminSettingSuccessMessage(message);
                                        setAdminSettingErrorMessage(null);
                                    }}
                                    onError={(message) => {
                                        setAdminSettingErrorMessage(message);
                                        setAdminSettingSuccessMessage(null);
                                    }}
                                />
                                {adminSettingSuccessMessage && <p className="text-green-500 mt-4">{adminSettingSuccessMessage}</p>}
                                {adminSettingErrorMessage && <p className="text-red-500 mt-4">{adminSettingErrorMessage}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {settingsView === 'payment' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Payment Settings</h2>
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await fetch(`/api/admin/payment-settings?userId=${adminId}`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ paymentSettings }),
                                        });
                                        const data = await response.json();
                                        if (!response.ok) throw new Error(data.error || 'Failed to save payment settings');
                                        setPaymentSettings({
                                            defaultProvider: data.paymentSettings.defaultProvider,
                                            providers: { ...defaultPaymentSettings.providers, ...(data.paymentSettings.providers || {}) },
                                        });
                                        alert('Payment settings saved.');
                                    } catch (err: any) {
                                        setError(err.message);
                                    }
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Save Settings
                            </button>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(paymentSettings.providers).map(([provider, config]: [string, any]) => (
                                <div key={provider} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-lg font-bold uppercase text-white">{provider}</p>
                                            <p className="text-xs text-gray-400">Provider configuration</p>
                                        </div>
                                        <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={!!config.enabled}
                                                onChange={(e) => {
                                                    setPaymentSettings((prev: any) => ({
                                                        ...prev,
                                                        defaultProvider: prev.defaultProvider || provider,
                                                        providers: {
                                                            ...prev.providers,
                                                            [provider]: {
                                                                ...prev.providers[provider],
                                                                enabled: e.target.checked,
                                                            },
                                                        },
                                                    }));
                                                }}
                                            />
                                            Enabled
                                        </label>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <input
                                            value={config.apiKey || ''}
                                            onChange={(e) => setPaymentSettings((prev: any) => ({
                                                ...prev,
                                                providers: {
                                                    ...prev.providers,
                                                    [provider]: { ...prev.providers[provider], apiKey: e.target.value }
                                                }
                                            }))}
                                            placeholder="API Key"
                                            className="bg-gray-800 text-white px-3 py-2 rounded"
                                        />
                                        <input
                                            value={config.merchantId || ''}
                                            onChange={(e) => setPaymentSettings((prev: any) => ({
                                                ...prev,
                                                providers: {
                                                    ...prev.providers,
                                                    [provider]: { ...prev.providers[provider], merchantId: e.target.value }
                                                }
                                            }))}
                                            placeholder="Merchant ID"
                                            className="bg-gray-800 text-white px-3 py-2 rounded"
                                        />
                                        <input
                                            value={config.username || ''}
                                            onChange={(e) => setPaymentSettings((prev: any) => ({
                                                ...prev,
                                                providers: {
                                                    ...prev.providers,
                                                    [provider]: { ...prev.providers[provider], username: e.target.value }
                                                }
                                            }))}
                                            placeholder="Username"
                                            className="bg-gray-800 text-white px-3 py-2 rounded"
                                        />
                                        <input
                                            value={config.password || ''}
                                            onChange={(e) => setPaymentSettings((prev: any) => ({
                                                ...prev,
                                                providers: {
                                                    ...prev.providers,
                                                    [provider]: { ...prev.providers[provider], password: e.target.value }
                                                }
                                            }))}
                                            placeholder="Password"
                                            type="password"
                                            className="bg-gray-800 text-white px-3 py-2 rounded"
                                        />
                                        <input
                                            value={config.accountNumber || ''}
                                            onChange={(e) => setPaymentSettings((prev: any) => ({
                                                ...prev,
                                                providers: {
                                                    ...prev.providers,
                                                    [provider]: { ...prev.providers[provider], accountNumber: e.target.value }
                                                }
                                            }))}
                                            placeholder="Account Number"
                                            className="bg-gray-800 text-white px-3 py-2 rounded md:col-span-2"
                                        />
                                        <textarea
                                            value={config.description || ''}
                                            onChange={(e) => setPaymentSettings((prev: any) => ({
                                                ...prev,
                                                providers: {
                                                    ...prev.providers,
                                                    [provider]: { ...prev.providers[provider], description: e.target.value }
                                                }
                                            }))}
                                            placeholder="Provider notes / API instructions"
                                            rows={3}
                                            className="bg-gray-800 text-white px-3 py-2 rounded md:col-span-2"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {settingsView === 'roles' && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Role Management</h2>
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input
                                    type="text"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="New role name"
                                    className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                                />
                                <input
                                    type="text"
                                    value={newRoleUsername}
                                    onChange={(e) => setNewRoleUsername(e.target.value)}
                                    placeholder="Username"
                                    className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                                />
                                <input
                                    type="password"
                                    value={newRolePassword}
                                    onChange={(e) => setNewRolePassword(e.target.value)}
                                    placeholder="Password"
                                    className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                                />
                            </div>
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-white mb-2">Permissions</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {permissionsList.map(permission => (
                                        <label key={permission} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={newRolePermissions.includes(permission)}
                                                onChange={() => handlePermissionChange(permission)}
                                                className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded"
                                            />
                                            <span className="text-white capitalize">{permission.replace('-', ' ')}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleCreateRole}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Create Role
                            </button>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg mt-6">
                             <h3 className="text-xl font-bold text-white mb-4">Existing Roles</h3>
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-900 divide-y divide-gray-700">
                                    {(adminSettings?.roles as AdminRole[])?.map((role) => (
                                        <tr key={role.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{role.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{role.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.status === 'active' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
                                                    {role.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => setEditingRole(role)} className="text-indigo-400 hover:text-indigo-600">Edit</button>
                                                <button onClick={() => handleToggleRoleStatus(role)} className={role.status === 'active' ? 'text-yellow-400 hover:text-yellow-600' : 'text-green-400 hover:text-green-600'}>
                                                    {role.status === 'active' ? 'Suspend' : 'Activate'}
                                                </button>
                                                <button onClick={() => handleDeleteRole(role)} className="text-red-400 hover:text-red-600">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        );
    };

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
            case 'settings':
                return renderSettingsView();
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Agent ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Commission</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Float Balance</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-900 divide-y divide-gray-700">
                                    {agents.map(agent => (
                                        <tr key={agent.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">{agent.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{agent.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">{(agent.commissionRate * 100).toFixed(2)}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">{formatCurrency(agent.floatBalance)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${agent.status === 'Active' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
                                                    {agent.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => setCreditingAgent(agent)} className="text-green-400 hover:text-green-600">Credit</button>
                                                <button onClick={() => setEditingAgent(agent)} className="text-indigo-400 hover:text-indigo-600">Edit</button>
                                                <button onClick={() => handleToggleAgentStatus(agent)} className={agent.status === 'Active' ? 'text-yellow-400 hover:text-yellow-600' : 'text-green-400 hover:text-green-600'}>
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
                return null;
        }
    };

    const handleCreateAgent = async (agentData: { username: string, password: string, commissionRate: string }) => {
        if (!adminId) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/agents/create?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agentData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create agent');
            }
            const newAgent = await response.json();
            setCreateAgentModalOpen(false);
            fetchData('agents'); // Refresh agent list
            setCreditingAgent(newAgent); // Automatically open credit modal for new agent
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const handleUpdateAgent = async (agentId: string, data: Partial<Agent>) => {
        if (!adminId) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/agents/${agentId}/update?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update agent');
            }
            fetchData('agents');
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const handleDeleteAgent = async (agentId: string) => {
        if (!adminId || !window.confirm('Are you sure you want to delete this agent? This action is irreversible.')) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/agents/${agentId}/delete?userId=${adminId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete agent');
            }
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
        setError(null);
        try {
            const response = await fetch(`/api/admin/agents/credit-float?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, amount, discount }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to credit agent float');
            }
            fetchData('agents');
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const hasPermission = (permission: string) => {
        if (!adminUser) return false;
        // Super admin has all permissions
        if (adminUser.username === 'admin') return true;
        return adminUser.permissions?.includes(permission);
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
                        {hasPermission('stats') && <button onClick={() => setView('stats')} className={`w-full py-2 rounded ${view === 'stats' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Stats</button>}
                        {hasPermission('users') && <button onClick={() => setView('users')} className={`w-full py-2 rounded ${view === 'users' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Users</button>}
                        {hasPermission('rooms') && <button onClick={() => setView('rooms')} className={`w-full py-2 rounded ${view === 'rooms' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Rooms</button>}
                        {hasPermission('transactions') && <button onClick={() => setView('transactions')} className={`w-full py-2 rounded ${view === 'transactions' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Transactions</button>}
                        {hasPermission('manual-transactions') && <button onClick={() => setView('manual-transactions')} className={`w-full py-2 rounded ${view === 'manual-transactions' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Manual Transactions</button>}
                        {hasPermission('agents') && <button onClick={() => setView('agents')} className={`w-full py-2 rounded ${view === 'agents' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Agents</button>}
                        {hasPermission('settings') && <button onClick={() => setView('settings')} className={`w-full py-2 rounded ${view === 'settings' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}>Settings</button>}
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
                    roles={adminSettings?.roles || []}
                />
            )}
            {renderGameHistoryModal()}
            <CreateAgentModal
                isOpen={isCreateAgentModalOpen}
                onClose={() => setCreateAgentModalOpen(false)}
                onCreateAgent={handleCreateAgent}
            />
            {editingRole && (
                <EditRoleModal
                    role={editingRole}
                    permissionsList={permissionsList}
                    onClose={() => setEditingRole(null)}
                    onSave={(updatedData) => handleUpdateRole(editingRole.id, updatedData)}
                />
            )}
            {editingAgent && (
                <EditAgentModal
                    agent={editingAgent}
                    onClose={() => setEditingAgent(null)}
                    onSave={(data) => handleUpdateAgent(editingAgent.id, data)}
                />
            )}
            {creditingAgent && (
                <CreditAgentModal
                    agent={creditingAgent}
                    onClose={() => setCreditingAgent(null)}
                    onCredit={(amount, discount) => {
                        handleCreditAgentFloat(creditingAgent.id, amount, discount);
                        setCreditingAgent(null);
                    }}
                />
            )}
        </>
    );
};

export default AdminDashboard;
