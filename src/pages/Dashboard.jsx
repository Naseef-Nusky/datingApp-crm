import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaUsers,
  FaUserCheck,
  FaChartLine,
} from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    verifiedUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const usersRes = await axios.get('/api/admin/users/stats');

      setStats({
        totalUsers: usersRes.data.totalUsers || 0,
        activeUsers: usersRes.data.activeUsers || 0,
        newUsersToday: usersRes.data.newUsersToday || 0,
        verifiedUsers: usersRes.data.verifiedUsers || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: FaUsers,
      color: 'bg-blue-500',
      change: `+${stats.newUsersToday} today`,
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: FaUserCheck,
      color: 'bg-green-500',
    },
    {
      title: 'Verified Users',
      value: stats.verifiedUsers,
      icon: FaUserCheck,
      color: 'bg-purple-500',
    },
    {
      title: 'New Users Today',
      value: stats.newUsersToday,
      icon: FaUsers,
      color: 'bg-orange-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {card.value.toLocaleString()}
                  </p>
                  {card.change && (
                    <p className="text-sm text-green-600 mt-1">{card.change}</p>
                  )}
                </div>
                <div className={`${card.color} p-4 rounded-lg`}>
                  <Icon className="text-white text-2xl" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <FaChartLine className="text-blue-500" />
              <div>
                <p className="text-sm font-medium">System Status</p>
                <p className="text-xs text-gray-500">All systems operational</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <FaUsers className="text-green-500" />
              <div>
                <p className="text-sm font-medium">
                  {stats.newUsersToday} new users registered today
                </p>
                <p className="text-xs text-gray-500">Last 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <p className="font-medium text-green-700">View User Analytics</p>
              <p className="text-sm text-green-600">See detailed statistics</p>
            </button>
            <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <p className="font-medium text-blue-700">Manage Users</p>
              <p className="text-sm text-blue-600">View and manage all users</p>
            </button>
            <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <p className="font-medium text-purple-700">Admin Settings</p>
              <p className="text-sm text-purple-600">Configure admin panel</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
