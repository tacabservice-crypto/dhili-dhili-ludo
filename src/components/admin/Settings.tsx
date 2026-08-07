
import React, { useState } from 'react';
import { Shield, CreditCard, UserPlus, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import ChangePasswordForm from '../ChangePasswordForm';

const Settings = ({ adminSettings, paymentSettings, onSavePaymentSettings, onUpdateRole, onDeleteRole, onCreateRole, onToggleRoleStatus, permissionsList, adminUser }) => {
  const [settingsView, setSettingsView] = useState('admin');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleUsername, setNewRoleUsername] = useState('');
  const [newRolePassword, setNewRolePassword] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState([]);
  const [editablePaymentSettings, setEditablePaymentSettings] = useState(paymentSettings);

  const handlePermissionChange = (permission) => {
    setNewRolePermissions(prev =>
      prev.includes(permission) ? prev.filter(p => p !== permission) : [...prev, permission]
    );
  };

  const handleCreateRole = () => {
    onCreateRole({
      name: newRoleName,
      username: newRoleUsername,
      password: newRolePassword,
      permissions: newRolePermissions
    });
    setNewRoleName('');
    setNewRoleUsername('');
    setNewRolePassword('');
    setNewRolePermissions([]);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex border-b mb-6">
        <button onClick={() => setSettingsView('admin')} className={`py-2 px-4 ${settingsView === 'admin' ? 'border-b-2 border-purple-600 font-semibold' : ''}`}>
          <Shield className="inline mr-2" size={18} />Admin
        </button>
        <button onClick={() => setSettingsView('payment')} className={`py-2 px-4 ${settingsView === 'payment' ? 'border-b-2 border-purple-600 font-semibold' : ''}`}>
          <CreditCard className="inline mr-2" size={18} />Payment
        </button>
        <button onClick={() => setSettingsView('roles')} className={`py-2 px-4 ${settingsView === 'roles' ? 'border-b-2 border-purple-600 font-semibold' : ''}`}>
          <UserPlus className="inline mr-2" size={18} />Roles
        </button>
      </div>

      {settingsView === 'admin' && (
        <div>
          <h3 className="text-xl font-bold mb-4">Admin Settings</h3>
          <ChangePasswordForm userId={adminUser.id} onSuccess={() => {}} onError={() => {}} />
        </div>
      )}

      {settingsView === 'payment' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Payment Settings</h3>
            <button onClick={() => onSavePaymentSettings(editablePaymentSettings)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Save Settings
            </button>
          </div>
          <div className="space-y-4">
            {Object.entries(editablePaymentSettings.providers).map(([provider, config]: [string, any]) => (
                <div key={provider} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-lg font-bold uppercase">{provider}</p>
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={!!config.enabled}
                                onChange={(e) => {
                                    const updatedSettings = { ...editablePaymentSettings };
                                    updatedSettings.providers[provider].enabled = e.target.checked;
                                    setEditablePaymentSettings(updatedSettings);
                                }}
                            />
                            Enabled
                        </label>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {Object.keys(config).filter(k => k !== 'enabled').map(key => (
                            <input
                                key={key}
                                value={config[key] || ''}
                                onChange={(e) => {
                                    const updatedSettings = { ...editablePaymentSettings };
                                    updatedSettings.providers[provider][key] = e.target.value;
                                    setEditablePaymentSettings(updatedSettings);
                                }}
                                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                                className="p-2 border rounded"
                            />
                        ))}
                    </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {settingsView === 'roles' && (
        <div>
          <h3 className="text-xl font-bold mb-4">Role Management</h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-bold mb-2">Create New Role</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Role Name" className="p-2 border rounded" />
              <input type="text" value={newRoleUsername} onChange={e => setNewRoleUsername(e.target.value)} placeholder="Username" className="p-2 border rounded" />
              <input type="password" value={newRolePassword} onChange={e => setNewRolePassword(e.target.value)} placeholder="Password" className="p-2 border rounded" />
            </div>
            <div className="mt-4">
              <h5 className="font-semibold mb-2">Permissions</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {permissionsList.map(p => (
                  <label key={p} className="flex items-center"><input type="checkbox" checked={newRolePermissions.includes(p)} onChange={() => handlePermissionChange(p)} className="mr-2" />{p}</label>
                ))}
              </div>
            </div>
            <button onClick={handleCreateRole} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">Create Role</button>
          </div>

          <h4 className="font-bold mb-2">Existing Roles</h4>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {adminSettings?.roles?.map(role => (
                    <tr key={role.id}>
                        <td className="px-6 py-4">{role.name}</td>
                        <td className="px-6 py-4">{role.username}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {role.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => onUpdateRole(role.id, {})} className="text-indigo-600 hover:text-indigo-900"><Edit size={18} /></button>
                            <button onClick={() => onToggleRoleStatus(role)} className={role.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}>
                                {role.status === 'active' ? <PowerOff size={18} /> : <Power size={18} />}
                            </button>
                            <button onClick={() => onDeleteRole(role)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Settings;
