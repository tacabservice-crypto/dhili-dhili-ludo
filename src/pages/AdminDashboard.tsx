import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, GameRoom, Agent } from '../types/game';
import UserEditModal from '../components/UserEditModal';
import CreateAgentModal from '../components/CreateAgentModal';
import EditAgentModal from '../components/EditAgentModal';
import CreditAgentModal from '../components/CreditAgentModal';
import { formatCurrency } from '../utils/number';
import AdminLayout from '../components/admin/AdminLayout';
import StatsGrid from '../components/admin/StatsGrid';
import UsersTable from '../components/admin/UsersTable';
import RoomsTable from '../components/admin/RoomsTable';
import TransactionsTable from '../components/admin/TransactionsTable';
import AgentsTable from '../components/admin/AgentsTable';
import Settings from '../components/admin/Settings';
import ManualTransactionsTable from '../components/admin/ManualTransactionsTable';
import EditRoleModal from '../components/EditRoleModal';


const AdminDashboard: React.FC = () => {
    // Define AdminUser interface to match backend
    interface AdminUser {
        id: string;
        username: string;
        permissions: string[];
        role?: string;
    }

    type AdminRole = {
        id: string;
        name: string;
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
    const [error, setError] = useState<string | null>(null);
    
    // Data states
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [rooms, setRooms] = useState<GameRoom[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [manualTransactions, setManualTransactions] = useState<any[]>([]);
    const [paymentSettings, setPaymentSettings] = useState<any>(null);
    const [adminSettings, setAdminSettings] = useState<any>(null);
    const [agents, setAgents] = useState<Agent[]>([]);

    // Modal state
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [creditingAgent, setCreditingAgent] = useState<Agent | null>(null);
    const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
    const [isCreateAgentModalOpen, setCreateAgentModalOpen] = useState(false);
    const [isCreateRoleModalOpen, setCreateRoleModalOpen] = useState(false);


    const permissionsList = ['stats', 'users', 'rooms', 'transactions', 'agents', 'settings'];

    const handleLogout = () => {
        localStorage.removeItem('admin_user');
        setAdminUser(null);
    };

    const fetchData = useCallback(async (type: 'stats' | 'users' | 'rooms' | 'transactions' | 'manual-transactions' | 'payment-settings' | 'agents' | 'settings', showerror = true) => {
        if (!adminUser) return;
        if(showerror) setError(null);
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
                if(showerror) setError(errMessage);
                return;
            }
            const data = await response.json();
            switch (type) {
                case 'stats': setStats(data); break;
                case 'users': setUsers(data); break;
                case 'rooms': setRooms(data); break;
                case 'transactions': setTransactions(data); break;
                case 'manual-transactions': setManualTransactions(data); break;
                case 'payment-settings': setPaymentSettings(data); break;
                case 'agents': setAgents(data); break;
                case 'settings': setAdminSettings(data); break;
            }
        } catch (err: any) {
            if(showerror) setError(err.message);
        }
    }, [adminUser]);

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


    useEffect(() => {
        if (adminUser) {
            fetchData(view);
            if (view === 'settings') {
                fetchData('payment-settings', false);
                fetchData('settings', false);
            }
        }
    }, [adminUser, view, fetchData]);
    
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
            console.error(err);
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
                body: JSON.stringify({ targetUserId: userToImpersonate.id }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                // Should recieve a JWT token
                localStorage.setItem('token', data.token);
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
            await fetchData('agents');
            setEditingAgent(null)
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            throw err;
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
            await fetchData('agents');
            setCreateAgentModalOpen(false);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            throw err;
        }
    };

    const handleCreditAgent = async (agentId: string, amount: number, discount: number) => {
        if (!adminId) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/agents/${agentId}/credit?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, discount }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to credit agent');
            }
            await fetchData('agents');
            setCreditingAgent(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            throw err;
        }
    };

    const handleCreateRole = async (roleData: { name: string, permissions: string[]}) => {
        if (!adminUser) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/roles/create?userId=${adminUser.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roleData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create role');
            }
            await fetchData('settings');
            setCreateRoleModalOpen(false)
        } catch (err: any) {
            setError(err.message);
            throw err
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
            await fetchData('settings');
            setEditingRole(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            throw err;
        }
    };

    const handleToggleRoleStatus = async (role: AdminRole) => {
        const newStatus = role.status === 'active' ? 'suspended' : 'active';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'suspend'} the role "${role.name}"?`)) return;
        await handleUpdateRole(role.id, { status: newStatus });
    };

    const handleSavePaymentSettings = async (updatedSettings: any) => {
        if(!adminId) return;
        try {
            const response = await fetch(`/api/admin/payment-settings?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentSettings: updatedSettings }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save payment settings');
            setPaymentSettings(data.paymentSettings);
            alert('Payment settings saved.');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleApproveTransaction = async (transactionId: string) => {
        if (!adminUser || !window.confirm('Are you sure you want to approve this transaction?')) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/manual-transactions/${transactionId}/approve?userId=${adminUser.id}`, {
                method: 'POST',
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to approve transaction');
            }
            fetchData('manual-transactions'); // Refresh the list
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRejectTransaction = async (transactionId: string) => {
        if (!adminUser || !window.confirm('Are you sure you want to reject this transaction?')) return;
        setError(null);
        try {
            const response = await fetch(`/api/admin/manual-transactions/${transactionId}/reject?userId=${adminUser.id}`, {
                method: 'POST',
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to reject transaction');
            }
            fetchData('manual-transactions'); // Refresh the list
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (!adminUser) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center w-full max-w-sm">
                    <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
                    <p className="text-gray-400 mb-6">Restricted Access</p>
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
    
    const hasPermission = (permission: string) => {
        if (!adminUser) return false;
        // Super admin has all permissions
        if (adminUser.username === 'admin' || adminUser.role === 'Super Admin') return true;
        return adminUser.permissions?.includes(permission);
    };

    const renderView = () => {
        // Find user by role
        const usersByRole = adminSettings?.usersByRole || {};

        switch (view) {
            case 'stats': return <StatsGrid stats={stats} />;
            case 'users': return <UsersTable users={users} onEdit={setEditingUser} onDelete={handleDeleteUser} onImpersonate={handleImpersonate} />;
            case 'rooms': return <RoomsTable rooms={rooms} onCancel={handleCancelGame} />;
            case 'transactions': return <TransactionsTable transactions={transactions} />;
            case 'manual-transactions': return <ManualTransactionsTable transactions={manualTransactions} onApprove={handleApproveTransaction} onReject={handleRejectTransaction} />;
            case 'agents': return <AgentsTable agents={agents} onEdit={setEditingAgent} onCredit={setCreditingAgent} onDelete={handleDeleteAgent} onToggleStatus={handleToggleAgentStatus} onCreate={() => setCreateAgentModalOpen(true)} />;
            case 'settings': return <Settings 
                adminSettings={{...adminSettings, usersByRole}}
                paymentSettings={paymentSettings} 
                onSavePaymentSettings={handleSavePaymentSettings}
                onCreateRole={() => setCreateRoleModalOpen(true)}
                onDeleteRole={handleDeleteRole}
                onUpdateRole={handleUpdateRole}
                onToggleRoleStatus={handleToggleRoleStatus}
                onEditRole={setEditingRole}
                permissionsList={permissionsList}
                adminUser={adminUser}
            />;
            default: return null;
        }
    };

    return (
        <AdminLayout 
            user={adminUser} 
            onLogout={handleLogout} 
            view={view} 
            setView={setView}
            hasPermission={hasPermission}
        >
            <div className="p-6">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                {renderView()}
            </div>
            {editingUser && (
                <UserEditModal 
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveUser}
                    isAdmin={true}
                />
            )}
            <CreateAgentModal
                isOpen={isCreateAgentModalOpen}
                onClose={() => setCreateAgentModalOpen(false)}
                onCreateAgent={handleCreateAgent}
            />
            {editingAgent && (
                <EditAgentModal
                    agent={editingAgent}
                    onClose={() => setEditingAgent(null)}
                    onSave={handleUpdateAgent}
                />
            )}
            {creditingAgent && (
                <CreditAgentModal
                    agent={creditingAgent}
                    onClose={() => setCreditingAgent(null)}
                    onSave={handleCreditAgent}
                />
            )}
            {(isCreateRoleModalOpen || editingRole) && (
                <EditRoleModal
                    isOpen={isCreateRoleModalOpen || !!editingRole}
                    onClose={() => { setCreateRoleModalOpen(false); setEditingRole(null); }}
                    onCreateRole={handleCreateRole}
                    onUpdateRole={handleUpdateRole}
                    role={editingRole}
                    permissionsList={permissionsList}
                />
            )}
        </AdminLayout>
    );
};

export default AdminDashboard;
t.value)}
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
    
    const hasPermission = (permission: string) => {
        if (!adminUser) return false;
        if (adminUser.username === 'admin') return true;
        return adminUser.permissions?.includes(permission);
    };

    const renderView = () => {
        switch (view) {
            case 'stats': return <StatsGrid stats={stats} />;
            case 'users': return <UsersTable users={users} onEdit={setEditingUser} onDelete={handleDeleteUser} onImpersonate={handleImpersonate} onViewGames={handleViewUserGames} />;
            case 'rooms': return <RoomsTable rooms={rooms} onCancel={handleCancelGame} />;
            case 'transactions': return <TransactionsTable transactions={transactions} />;
            case 'manual-transactions': return <ManualTransactionsTable transactions={manualTransactions} onApprove={handleApproveTransaction} onReject={handleRejectTransaction} />;
            case 'agents': return <AgentsTable agents={agents} onEdit={setEditingAgent} onCredit={setCreditingAgent} onDelete={handleDeleteAgent} onToggleStatus={handleToggleAgentStatus} onCreate={() => setCreateAgentModalOpen(true)} />;
            case 'settings': return <Settings 
                adminSettings={adminSettings} 
                paymentSettings={paymentSettings} 
                onSavePaymentSettings={handleSavePaymentSettings}
                onCreateRole={handleCreateRole}
                onDeleteRole={handleDeleteRole}
                onUpdateRole={handleUpdateRole}
                onToggleRoleStatus={handleToggleRoleStatus}
                onEditRole={setEditingRole}
                permissionsList={permissionsList}
                adminUser={adminUser}
            />;
            default: return null;
        }
    };

    return (
        <AdminLayout 
            user={adminUser} 
            onLogout={handleLogout} 
            view={view} 
            setView={setView}
            hasPermission={hasPermission}
        >
            <div className="p-6">
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {renderView()}
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
            <CreateAgentModal
                isOpen={isCreateAgentModalOpen}
                onClose={() => setCreateAgentModalOpen(false)}
                onCreateAgent={handleCreateAgent}
            />
            {editingAgent && (
                <EditAgentModal
                    agent={editingAgent}
                    onClose={() => setEditingAgent(null)}
                    onSave={handleUpdateAgent}
                />
            )}
            {creditingAgent && (
                <CreditAgentModal
                    agent={creditingAgent}
                    onClose={() => setCreditingAgent(null)}
                    onSave={handleCreditAgent}
                />
            )}
        </AdminLayout>
    );
};

export default AdminDashboard;
