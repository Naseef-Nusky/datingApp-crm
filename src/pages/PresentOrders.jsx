import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSearch, FaSyncAlt, FaTimes } from 'react-icons/fa';

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PresentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [detailsPerson, setDetailsPerson] = useState(null);

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusLabel = (status) => {
    const found = statusOptions.find((opt) => opt.value === status);
    return found ? found.label : 'Pending';
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await axios.get('/api/admin/gift-orders', {
        params,
        headers: getAuthHeaders(),
      });
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching present orders:', err);
      setError(err.response?.data?.message || 'Failed to load present orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!newStatus) return;
    setUpdatingId(orderId);
    try {
      await axios.put(
        `/api/admin/gift-orders/${orderId}/status`,
        { deliveryStatus: newStatus },
        { headers: getAuthHeaders() }
      );
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const senderName =
      `${o.senderData?.profile?.firstName || ''} ${o.senderData?.profile?.lastName || ''}`.toLowerCase();
    const receiverName =
      `${o.receiverData?.profile?.firstName || ''} ${o.receiverData?.profile?.lastName || ''}`.toLowerCase();
    const giftName = (o.giftItemData?.name || '').toLowerCase();
    return (
      senderName.includes(term) ||
      receiverName.includes(term) ||
      giftName.includes(term) ||
      (o.id || '').toLowerCase().includes(term)
    );
  });

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading present orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Present Orders</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange text-sm"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              <FaSyncAlt className="text-xs" />
              Refresh
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by sender, receiver, present name or order id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange"
          />
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Sender
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Receiver
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Present
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No present orders found for this filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const created = order.createdAt ? new Date(order.createdAt) : null;
                  const dateLabel = created
                    ? created.toLocaleString()
                    : '';
                  const senderProfile = order.senderData?.profile;
                  const receiverProfile = order.receiverData?.profile;
                  const senderName = [senderProfile?.firstName, senderProfile?.lastName]
                    .filter(Boolean)
                    .join(' ') || order.senderData?.email || 'Unknown';
                  const receiverName = [receiverProfile?.firstName, receiverProfile?.lastName]
                    .filter(Boolean)
                    .join(' ') || order.receiverData?.email || 'Unknown';

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        <div className="flex flex-col">
                          <span>{dateLabel}</span>
                          <span className="text-[11px] text-gray-400">
                            ID: {order.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <button
                          type="button"
                          onClick={() => setDetailsPerson({
                            role: 'Sender',
                            userData: order.senderData,
                            orderId: order.id,
                            deliveryAddress: null,
                          })}
                          className="font-medium text-left text-nex-orange hover:underline cursor-pointer"
                        >
                          {senderName}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <button
                          type="button"
                          onClick={() => setDetailsPerson({
                            role: 'Receiver',
                            userData: order.receiverData,
                            orderId: order.id,
                            deliveryAddress: order.deliveryAddress,
                          })}
                          className="font-medium text-left text-nex-orange hover:underline cursor-pointer"
                        >
                          {receiverName}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-2">
                          {order.giftItemData?.imageUrl && (
                            <img
                              src={order.giftItemData.imageUrl}
                              alt={order.giftItemData.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">
                              {order.giftItemData?.name || 'Present'}
                            </div>
                            {order.deliveryStatus === 'delivered' && order.deliveredAt && (
                              <div className="text-[11px] text-green-600">
                                Delivered:{' '}
                                {new Date(order.deliveredAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {order.creditsUsed ?? 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${getStatusBadgeClasses(
                              order.deliveryStatus || 'pending'
                            )}`}
                          >
                            {getStatusLabel(order.deliveryStatus || 'pending')}
                          </span>
                          <select
                            value={order.deliveryStatus || 'pending'}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={updatingId === order.id}
                            className="px-2 py-1 border border-gray-300 rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-nex-orange bg-white"
                          >
                            {statusOptions
                              .filter((opt) => opt.value !== 'all')
                              .map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details modal */}
      {detailsPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setDetailsPerson(null)}>
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {detailsPerson.role} details
              </h3>
              <button
                type="button"
                onClick={() => setDetailsPerson(null)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <p className="text-[11px] text-gray-400">Order ID: {detailsPerson.orderId}</p>
              {detailsPerson.userData?.profile && (
                <>
                  <div>
                    <span className="text-gray-500 block">Name</span>
                    <span className="font-medium text-gray-800">
                      {[detailsPerson.userData.profile.firstName, detailsPerson.userData.profile.lastName].filter(Boolean).join(' ')}
                    </span>
                  </div>
                  {detailsPerson.userData.profile.age != null && (
                    <div>
                      <span className="text-gray-500 block">Age</span>
                      <span className="text-gray-800">{detailsPerson.userData.profile.age}</span>
                    </div>
                  )}
                  {detailsPerson.userData.profile.gender && (
                    <div>
                      <span className="text-gray-500 block">Gender</span>
                      <span className="text-gray-800">{detailsPerson.userData.profile.gender}</span>
                    </div>
                  )}
                  {detailsPerson.userData.profile.location && typeof detailsPerson.userData.profile.location === 'object' && Object.keys(detailsPerson.userData.profile.location).length > 0 && (
                    <div>
                      <span className="text-gray-500 block">Location</span>
                      <pre className="text-gray-800 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(detailsPerson.userData.profile.location, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
              <div>
                <span className="text-gray-500 block">Email</span>
                <span className="text-gray-800">{detailsPerson.userData?.email || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">User ID</span>
                <span className="text-gray-800 font-mono text-xs break-all">{detailsPerson.userData?.id || '—'}</span>
              </div>
              {detailsPerson.role === 'Receiver' && detailsPerson.deliveryAddress && (
                <div>
                  <span className="text-gray-500 block">Delivery address</span>
                  {typeof detailsPerson.deliveryAddress === 'object' ? (
                    <pre className="text-gray-800 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(detailsPerson.deliveryAddress, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-gray-800">{String(detailsPerson.deliveryAddress)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentOrders;

