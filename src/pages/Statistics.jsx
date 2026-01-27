import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaHeart, FaEnvelope, FaEye, FaChartLine } from 'react-icons/fa';

const Statistics = () => {
  const [stats, setStats] = useState({
    userGrowth: [],
    matches: 0,
    messages: 0,
    profileViews: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, all

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/statistics?range=${timeRange}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Matches',
      value: stats.matches,
      icon: FaHeart,
      color: 'bg-pink-500',
    },
    {
      title: 'Total Messages',
      value: stats.messages,
      icon: FaEnvelope,
      color: 'bg-blue-500',
    },
    {
      title: 'Profile Views',
      value: stats.profileViews,
      icon: FaEye,
      color: 'bg-purple-500',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: FaUsers,
      color: 'bg-green-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Analytics & Statistics</h2>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  </div>
                  <div className={`${card.color} p-4 rounded-lg`}>
                    <Icon className="text-white text-2xl" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            User Growth Chart
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FaChartLine className="text-4xl mx-auto mb-2" />
              <p>Chart visualization would go here</p>
              <p className="text-sm">Integration with charting library needed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
