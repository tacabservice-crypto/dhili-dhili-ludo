import React, { useState, useEffect } from 'react';

interface ManageRolesProps {
    adminId: string;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

interface Role {
    id: string;
    name: string;
    permissions: string[];
}

interface User {
    id: string;
    username: string;
    role: string;
}

const ManageRoles: React.FC<ManageRolesProps> = ({ adminId, onError, onSuccess }) => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [users, setUsers] = useState<User[]>([]); // To assign roles to users
    const [newRoleName, setNewRoleName] = useState('');
    const [newRolePermissions, setNewRolePermissions] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRoles();
        fetchUsers();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await fetch(`/api/admin/roles?userId=${adminId}`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to fetch roles.');
            }
            const data = await response.json();
            setRoles(data);
        } catch (err: any) {
            onError(err.message);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`/api/admin/users?userId=${adminId}`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to fetch users.');
            }
            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            onError(err.message);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/admin/roles/create?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newRoleName, permissions: newRolePermissions.split(',').map(p => p.trim()) }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create role.');
            }
            onSuccess('Role created successfully!');
            setNewRoleName('');
            setNewRolePermissions('');
            fetchRoles();
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignRole = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/admin/users/${selectedUserId}/assign-role?userId=${adminId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roleId: selectedRoleId }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to assign role.');
            }
            onSuccess('Role assigned successfully!');
            setSelectedUserId('');
            setSelectedRoleId('');
            fetchUsers(); // Refresh users to show updated roles
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Create New Role */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-2">Create New Role</h3>
                <form onSubmit={handleCreateRole} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Role Name</label>
                        <input
                            type="text"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            className="bg-gray-700 text-white w-full px-3 py-2 rounded mt-1"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Permissions (comma-separated)</label>
                        <input
                            type="text"
                            value={newRolePermissions}
                            onChange={(e) => setNewRolePermissions(e.target.value)}
                            className="bg-gray-700 text-white w-full px-3 py-2 rounded mt-1"
                            placeholder="e.g., read:users, write:users, delete:users"
                            disabled={isSubmitting}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        disabled={isSubmitting}
                    >
                        Create Role
                    </button>
                </form>
            </div>

            {/* Existing Roles */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-2">Existing Roles</h3>
                {roles.length === 0 ? (
                    <p className="text-gray-400">No roles found.</p>
                ) : (
                    <ul className="divide-y divide-gray-700">
                        {roles.map(role => (
                            <li key={role.id} className="py-2">
                                <p className="font-medium text-white">{role.name}</p>
                                <p className="text-sm text-gray-400">Permissions: {role.permissions.join(', ') || 'None'}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Assign Role to User */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-2">Assign Role to User</h3>
                <form onSubmit={handleAssignRole} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Select User</label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="bg-gray-700 text-white w-full px-3 py-2 rounded mt-1"
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">-- Select a User --</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.username} (Current Role: {user.role || 'Player'})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Select Role</label>
                        <select
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="bg-gray-700 text-white w-full px-3 py-2 rounded mt-1"
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">-- Select a Role --</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        disabled={isSubmitting}
                    >
                        Assign Role
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ManageRoles;