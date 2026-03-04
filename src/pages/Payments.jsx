import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSyncAlt, FaCreditCard, FaCoins } from 'react-icons/fa';

const filterOptions = [
  { value: 'all', label: 'All (Subscriptions & Refills)' },
  { value: 'subscription', label: 'Subscriptions only' },
  { value: 'refill', label: 'Refills only' },
];

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      const url = `/api/admin/payments${params.toString() ? `?${params.toString()}` : ''}`;
      const { data } = await axios.get(url, { headers: getAuthHeaders() });
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.response?.data?.message || 'Failed to load subscription and refill payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const userName = (p) => {
    if (!p?.user) return '—';
    const first = p.user.firstName || '';
    const last = p.user.lastName || '';
    if (first || last) return `${first} ${last}`.trim();
    return p.user.email || '—';
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading subscription and refill payments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Subscription & Refill Payments</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-admin-primary focus:border-admin-primary"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => fetchPayments()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-admin-primary text-white rounded-md hover:opacity-90 text-sm font-medium"
            >
              <FaSyncAlt /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Credits
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No subscription or refill payments found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{userName(p)}</div>
                      {p.user?.email && (
                        <div className="text-gray-500 text-xs">{p.user.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.type === 'subscription' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <FaCreditCard /> Subscription
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <FaCoins /> Refill
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={p.description}>
                      {p.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                      +{p.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;
