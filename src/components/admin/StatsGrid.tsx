
import React from 'react';
import { Users, Home, Activity, DollarSign, Wifi } from 'lucide-react';
import { formatCurrency } from '../../utils/number';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div className="ml-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const StatsGrid = ({ stats }) => {
  if (!stats) return <p className="text-center text-gray-500">Loading stats...</p>;

  const statItems = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { title: 'Total Rooms', value: stats.totalRooms, icon: Home, color: 'bg-green-500' },
    { title: 'Active Rooms', value: stats.activeRooms, icon: Activity, color: 'bg-yellow-500' },
    { title: 'Waiting Rooms', value: stats.waitingRooms, icon: Wifi, color: 'bg-indigo-500' },
    { title: 'House Revenue', value: formatCurrency(stats.houseRevenue), icon: DollarSign, color: 'bg-pink-500' },
    { title: 'Online Clients', value: stats.onlineClients, icon: Wifi, color: 'bg-teal-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statItems.map(item => (
        <StatCard key={item.title} {...item} />
      ))}
    </div>
  );
};

export default StatsGrid;
