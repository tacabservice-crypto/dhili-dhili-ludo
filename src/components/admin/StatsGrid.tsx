import React from 'react';
import { Users, Home, Activity, DollarSign, Wifi, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Eye } from 'lucide-react';
import { formatCurrency } from '../../utils/number';

const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
  <div 
    className={`bg-white p-4 rounded-xl shadow-lg flex items-center ${onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
    onClick={onClick}
  >
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={28} className="text-white" />
    </div>
    <div className="ml-4">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const RoomCard = ({ room }) => (
    <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">#{room.id}</p>
                <span className="text-sm font-bold text-green-600">{formatCurrency(room.betAmount)}</span>
            </div>
            <div className="flex items-center space-x-2">
                {room.players.map(p => (
                    <div key={p.userId} className="flex items-center" title={p.username}>
                        <span className="text-2xl">{p.avatar}</span>
                    </div>
                ))}
            </div>
        </div>
        <button className="mt-3 w-full flex items-center justify-center text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors">
            <Eye size={16} className="mr-2"/>
            Spectate
        </button>
    </div>
);


const StatsGrid = ({ stats, rooms = [], manualTransactions = [], setView }) => {
  if (!stats) return <p className="text-center text-gray-500">Loading stats...</p>;

  const pendingDeposits = manualTransactions.filter(tx => tx.transactionType === 'deposit' && tx.status === 'pending');
  const pendingWithdrawals = manualTransactions.filter(tx => tx.transactionType === 'withdraw' && tx.status === 'pending');
  const activeRooms = rooms.filter(r => r.status === 'playing');

  const mainStats = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { title: 'House Revenue', value: formatCurrency(stats.houseRevenue), icon: DollarSign, color: 'bg-emerald-500' },
    { title: 'Active Games', value: stats.activeRooms, icon: Activity, color: 'bg-cyan-500' },
  ];

  return (
    <div className="space-y-8">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mainStats.map(item => (
                <StatCard key={item.title} {...item} />
            ))}
        </div>

        {/* Pending Actions Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <AlertTriangle size={22} className="mr-3 text-amber-500" />
                Pending Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                    title="Pending Deposits" 
                    value={pendingDeposits.length} 
                    icon={ArrowUpCircle} 
                    color="bg-green-500" 
                    onClick={() => setView('manual-transactions')}
                />
                <StatCard 
                    title="Pending Withdrawals" 
                    value={pendingWithdrawals.length} 
                    icon={ArrowDownCircle} 
                    color="bg-red-500"
                    onClick={() => setView('manual-transactions')}
                />
                 <StatCard 
                    title="Agent Requests" 
                    value={0} // Placeholder for now
                    icon={DollarSign} 
                    color="bg-purple-500"
                    onClick={() => alert('Agent requests coming soon!')}
                />
            </div>
        </div>

        {/* Active Games */}
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Home size={22} className="mr-3 text-indigo-500" />
                Active Games ({activeRooms.length})
            </h3>
            {activeRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeRooms.map(room => (
                        <RoomCard key={room.id} room={room} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-xl shadow-lg">
                    <p className="text-gray-500">No active games at the moment.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default StatsGrid;
