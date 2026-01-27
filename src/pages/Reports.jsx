import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFlag, FaCheck, FaTimes, FaEye, FaUser } from 'react-icons/fa';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, resolved, all

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/reports?status=${filter}`);
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      await axios.put(`/api/admin/reports/${reportId}/resolve`, {
        action, // 'approve', 'reject', 'warn', 'ban'
      });
      fetchReports();
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Failed to resolve report');
    }
  };

  const getReportTypeColor = (type) => {
    const colors = {
      spam: 'bg-red-100 text-red-800',
      inappropriate: 'bg-orange-100 text-orange-800',
      harassment: 'bg-purple-100 text-purple-800',
      fake: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">User Reports</h2>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
            >
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="all">All Reports</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <FaFlag className="text-red-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getReportTypeColor(
                          report.reportType
                        )}`}
                      >
                        {report.reportType || 'Other'}
                      </span>
                      {report.status === 'pending' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                      {report.status === 'resolved' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{report.reason || 'No reason provided'}</p>
                    <div className="text-sm text-gray-500">
                      <p>
                        Reported by: {report.reporter?.email || 'Unknown'} on{' '}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                      <p>
                        Reported user: {report.reportedUser?.email || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {report.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleResolveReport(report.id, 'warn')}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                  >
                    <FaCheck className="inline mr-2" />
                    Warn User
                  </button>
                  <button
                    onClick={() => handleResolveReport(report.id, 'ban')}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    <FaTimes className="inline mr-2" />
                    Ban User
                  </button>
                  <button
                    onClick={() => handleResolveReport(report.id, 'reject')}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    <FaTimes className="inline mr-2" />
                    Dismiss
                  </button>
                </div>
              )}

              {report.status === 'resolved' && (
                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    Resolved on: {new Date(report.resolvedAt).toLocaleDateString()}
                  </p>
                  {report.adminAction && (
                    <p>Action taken: {report.adminAction}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No reports found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
