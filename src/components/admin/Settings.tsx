import React, { useState } from 'react';
import { Lock, CreditCard, UserCheck, Trash2, Edit, Power, PowerOff } from 'lucide-react';

const Settings = ({ 
    adminSettings, 
    paymentSettings, 
    onSavePaymentSettings, 
    onCreateRole,
    onDeleteRole,
    onUpdateRole,
    onToggleRoleStatus,
    onEditRole,
    permissionsList,
    adminUser,
}) => {
  const [settingsView, setSettingsView] = useState('roles');
  const [editablePaymentSettings, setEditablePaymentSettings] = useState(paymentSettings);

  const handlePaymentSettingsChange = (provider, key, value) => {
    const updated = JSON.parse(JSON.stringify(editablePaymentSettings));
    if(key === 'enabled'){
      updated.providers[provider].enabled = value;
    } else {
      updated.providers[provider].credentials[key] = value;
    }
    setEditablePaymentSettings(updated);
  };
  
  if (!adminSettings || !paymentSettings) {
    return <p>Loading settings...</p>;
  }

  const { roles, usersByRole } = adminSettings;
  

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setSettingsView('roles')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${settingsView === 'roles' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Roles & Permissions
          </button>
          <button onClick={() => setSettingsView('payment')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${settingsView === 'payment' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Payment Settings
          </button>
          <button onClick={() => setSettingsView('admin')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${settingsView === 'admin' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Admin Management
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {settingsView === 'admin' && (
          <div>
            <h3 className="text-xl font-bold mb-4">Admin Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(usersByRole).map(roleName => (
                <div key={roleName} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-lg mb-2">{roleName}</h4>
                  <ul className="space-y-2">
                    {usersByRole[roleName].map(user => (
                      <li key={user.id} className="flex items-center justify-between p-2 bg-white rounded shadow-sm">
                        <span className="font-medium">{user.username}</span>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {settingsView === 'payment' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Payment Providers</h3>
              <button onClick={() => onSavePaymentSettings(editablePaymentSettings)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                Save Settings
              </button>
            </div>
            <div className="space-y-6">
              {Object.entries(editablePaymentSettings.providers).map(([provider, config]: [string, any]) => (
                <div key={provider} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold capitalize">{provider}</h4>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={config.enabled}
                          onChange={e => handlePaymentSettingsChange(provider, 'enabled', e.target.checked)}
                        />
                        <div className={`block w-14 h-8 rounded-full ${config.enabled ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${config.enabled ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                      <div className="ml-3 text-gray-700 font-medium">
                        {config.enabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </label>
                  </div>
                  {config.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(config.credentials).map(key => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700">{key}</label>
                          <input
                            type="text"
                            value={config.credentials[key] || ''}
                            onChange={(e) => handlePaymentSettingsChange(provider, key, e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {settingsView === 'roles' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Roles & Permissions</h3>
              <button onClick={onCreateRole} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md">
                Create New Role
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles?.map(role => (
                    <tr key={role.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map(p => <span key={p} className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs">{p}</span>)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {role.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => onEditRole(role)} className="text-indigo-600 hover:text-indigo-900"><Edit size={18} /></button>
                            <button onClick={() => onToggleRoleStatus(role)} className={role.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}>
                                {role.status === 'active' ? <PowerOff size={18} /> : <Power size={18} />}
                            </button>
                            <button onClick={() => onDeleteRole(role)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
