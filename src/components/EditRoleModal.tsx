import React, { useState } from 'react';

interface EditRoleModalProps {
    role: {
        id: string;
        name: string;
        username: string;
        permissions: string[];
        status: 'active' | 'suspended';
    };
    permissionsList: string[];
    onClose: () => void;
    onSave: (updatedRole: any) => Promise<void>;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({ role, permissionsList, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: role.name,
        username: role.username,
        permissions: [...role.permissions],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePermissionChange = (permission: string) => {
        setFormData(prev => {
            const newPermissions = prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission];
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleSave = async () => {
        setError(null);
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-white">Edit Role: {role.name}</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Role Name</label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                            className="bg-gray-700 text-white w-full px-3 py-2 rounded mt-1" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Username</label>
                        <input 
                            type="text" 
                            name="username" 
                            value={formData.username} 
                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} 
                            className="bg-gray-700 text-white w-full px-3 py-2 rounded mt-1" 
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Permissions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {permissionsList.map(permission => (
                                <label key={permission} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.permissions.includes(permission)}
                                        onChange={() => handlePermissionChange(permission)}
                                        className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded"
                                    />
                                    <span className="text-white capitalize">{permission.replace('-', ' ')}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end items-center">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded ml-3 disabled:bg-purple-400"
                    >
                        {isSaving ? 'Kaydinaya...' : 'Save Changes'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>
        </div>
    );
};

export default EditRoleModal;
