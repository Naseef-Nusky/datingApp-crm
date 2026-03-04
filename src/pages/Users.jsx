import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaSearch,
  FaUserCheck,
  FaUserTimes,
  FaBan,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaPlus,
  FaCrown,
  FaTrash,
  FaCircle,
  FaEdit,
  FaCreditCard,
  FaCoins,
  FaTimes,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Users = ({ defaultTypeFilter }) => {
  const navigate = useNavigate();
  const { canViewUsers, canEditUsers, canCreateUsers, isAdmin, admin } = useAuth();
  
  // Debug logging
  useEffect(() => {
    if (admin) {
      console.log('=== Users Page Debug ===');
      console.log('Current admin user type:', admin.userType);
      console.log('isAdmin() result:', isAdmin ? isAdmin() : 'function not available');
      console.log('canCreateUsers result:', canCreateUsers ? canCreateUsers() : 'function not available');
      console.log('canViewUsers result:', canViewUsers ? canViewUsers() : 'function not available');
      console.log('canEditUsers result:', canEditUsers ? canEditUsers() : 'function not available');
      console.log('========================');
    }
  }, [admin, canCreateUsers, canViewUsers, canEditUsers, isAdmin]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive, verified, unverified, neverSpent, noSpend7d, noSpend30d
  const [typeFilter, setTypeFilter] = useState(defaultTypeFilter || 'all'); // all, real, streamers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editProfileForm, setEditProfileForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'male',
    bio: '',
    locationCity: '',
    locationCountry: '',
  });
  const [savingEditProfile, setSavingEditProfile] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [paymentsModalUser, setPaymentsModalUser] = useState(null);
  const [userPayments, setUserPayments] = useState([]);
  const [loadingUserPayments, setLoadingUserPayments] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    age: '',
    gender: 'male',
  });

  // If admin role (not superadmin), show access denied message
  if (isAdmin() && admin?.userType !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FaLock className="text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h3>
          <p className="text-gray-600">
            Admin role does not have permission to view or manage users.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Only Super Admin and Viewer roles can access user management.
          </p>
        </div>
      </div>
    );
  }

  // If user doesn't have view permission
  if (!canViewUsers()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FaLock className="text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h3>
          <p className="text-gray-600">
            You do not have permission to view users.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, [filter, typeFilter]);

  useEffect(() => {
    if (defaultTypeFilter && defaultTypeFilter !== typeFilter) setTypeFilter(defaultTypeFilter);
  }, [defaultTypeFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ filter });
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
      const response = await axios.get(`/api/admin/users?${params.toString()}`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await axios.put(`/api/admin/users/${userId}/toggle-active`, {
        isActive: !currentStatus,
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleSetOnline = async (userId, isOnline) => {
    try {
      await axios.put(`/api/admin/profiles/${userId}/online`, { isOnline });
      fetchUsers();
    } catch (error) {
      console.error('Error setting online status:', error);
      alert(error.response?.data?.message || 'Failed to update online status');
    }
  };

  const handleToggleVerified = async (userId, currentStatus) => {
    try {
      await axios.put(`/api/admin/users/${userId}/toggle-verified`, {
        isVerified: !currentStatus,
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling verification:', error);
      alert('Failed to update verification status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user and their profile? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      fetchUsers();
      alert('User permanently deleted.');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const isSubscriptionActive = (user) => {
    const plan = user.subscriptionPlan;
    if (!plan || plan === 'free') return false;
    const expires = user.subscriptionExpires;
    if (!expires) return true;
    return new Date(expires) > new Date();
  };

  const handleViewPayments = async (user) => {
    setPaymentsModalUser(user);
    setShowPaymentsModal(true);
    setUserPayments([]);
    setLoadingUserPayments(true);
    try {
      const { data } = await axios.get(`/api/admin/payments?userId=${user.id}`);
      setUserPayments(data.payments || []);
    } catch (err) {
      console.error('Error fetching user payments:', err);
      setUserPayments([]);
    } finally {
      setLoadingUserPayments(false);
    }
  };

  const handleOpenEditProfile = (user) => {
    if (user.userType !== 'streamer' && user.userType !== 'talent') return;
    setEditUser(user);
    setEditProfileForm({
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      age: user.profile?.age ?? '',
      gender: user.profile?.gender || 'male',
      bio: user.profile?.bio || '',
      locationCity: user.profile?.location?.city || '',
      locationCountry: user.profile?.location?.country || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEditProfile = async (e) => {
    e.preventDefault();
    if (!editUser?.id) return;
    setSavingEditProfile(true);
    try {
      await axios.put(`/api/admin/profiles/${editUser.id}`, {
        firstName: editProfileForm.firstName.trim(),
        lastName: editProfileForm.lastName.trim(),
        age: parseInt(editProfileForm.age, 10) || 18,
        gender: editProfileForm.gender,
        bio: editProfileForm.bio.trim(),
        location: {
          city: editProfileForm.locationCity.trim(),
          country: editProfileForm.locationCountry.trim(),
        },
      });
      setShowEditModal(false);
      setEditUser(null);
      fetchUsers();
      alert('Profile updated.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingEditProfile(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // Ensure age is a number
      const userData = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName?.trim() || '',
        age: parseInt(formData.age),
        gender: formData.gender,
      };
      
      console.log('Creating user with data:', userData);
      
      // Try admin route first, fallback to auth/register if needed
      let response;
      try {
        response = await axios.post('/api/admin/users', userData);
      } catch (adminError) {
        // If admin route doesn't exist, use the public register route
        console.log('Admin route not available, using register route');
        response = await axios.post('/api/auth/register', userData);
      }
      
      setShowCreateModal(false);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        age: '',
        gender: 'male',
      });
      fetchUsers();
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          error.response?.data?.error ||
                          'Failed to create user';
      alert(errorMessage);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.profile?.firstName?.toLowerCase().includes(searchLower) ||
      user.profile?.lastName?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
          {!defaultTypeFilter && (
            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  const canCreate = canCreateUsers && typeof canCreateUsers === 'function' && canCreateUsers();
                  if (canCreate) {
                    navigate('/users/create');
                  } else {
                    alert(`You do not have permission to create users. Current role: ${admin?.userType || 'unknown'}. Only Super Admin and Viewer roles can create users.`);
                  }
                }}
                disabled={!canCreateUsers || typeof canCreateUsers !== 'function' || !canCreateUsers()}
                className={`px-4 py-2 rounded-md transition-all flex items-center space-x-2 ${
                  canCreateUsers && typeof canCreateUsers === 'function' && canCreateUsers()
                    ? 'bg-gradient-nex text-white hover:opacity-90 cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                }`}
                title={
                  canCreateUsers && typeof canCreateUsers === 'function' && canCreateUsers()
                    ? 'Create new user'
                    : admin?.userType === 'admin'
                    ? 'Admin role cannot create users'
                    : `You do not have permission to create users. Current role: ${admin?.userType || 'unknown'}`
                }
              >
                <FaPlus className="mr-1" />
                <span>Create User</span>
              </button>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange"
              >
                <option value="all">All (users + streamers)</option>
                <option value="real">Real users</option>
                <option value="streamers">Streamers</option>
              </select>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="neverSpent">Without spent (never)</option>
                <option value="noSpend7d">No spend (last 7 days)</option>
                <option value="noSpend30d">No spend (last 30 days)</option>
              </select>
            </div>
          )}
        </div>
        <div className="relative mb-6">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VIP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Online
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.profile?.photos?.[0]?.url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.profile.photos[0].url}
                            alt={user.profile.firstName}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 font-semibold">
                              {user.profile?.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.profile?.firstName && user.profile?.lastName
                            ? `${user.profile.firstName} ${user.profile.lastName}`
                            : user.profile?.firstName || 'No Name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.profile?.age ? `${user.profile.age} years` : 'No age'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.userType === 'regular' || !user.userType ? 'Real user' : user.userType === 'talent' || user.userType === 'streamer' ? 'Streamer' : user.userType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.vipActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800" title={user.vipExpiresAt ? `Expires ${new Date(user.vipExpiresAt).toLocaleDateString()}` : 'VIP'}>
                        <FaCrown className="w-3.5 h-3.5" />
                        VIP
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(user.userType === 'regular' || !user.userType) ? (
                      isSubscriptionActive(user) ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800" title={user.subscriptionExpires ? `Expires ${new Date(user.subscriptionExpires).toLocaleDateString()}` : 'Active'}>
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          Not active
                        </span>
                      )
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.totalCreditsSpent ?? 0} cr
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleViewPayments(user)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 text-sm"
                      title="View subscription & refill payments"
                    >
                      <FaCreditCard className="flex-shrink-0" />
                      View payments
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      {user.profile?.isOnline ? (
                        <>
                          <FaCircle className="text-green-500 text-xs" title="Online" />
                          <span className="text-green-700 text-xs">Online</span>
                        </>
                      ) : (
                        <span className="text-gray-500 text-xs">
                          {user.profile?.lastSeen
                            ? `Offline (${new Date(user.profile.lastSeen).toLocaleString()})`
                            : 'Offline'}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastCreditSpentAt
                      ? new Date(user.lastCreditSpentAt).toLocaleDateString()
                      : user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isActive ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isVerified ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaTimesCircle className="text-red-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {canEditUsers() ? (
                      <div className="flex flex-wrap gap-2">
                        {(user.userType === 'streamer' || user.userType === 'talent') && (
                          <button
                            onClick={() => handleOpenEditProfile(user)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                            title="Edit profile data"
                          >
                            <FaEdit className="flex-shrink-0" />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-red-600 hover:text-red-900 hover:bg-red-50"
                          title="Permanently delete user"
                        >
                          <FaTrash className="flex-shrink-0" />
                          <span>Remove</span>
                        </button>
                        <button
                          onClick={() => handleSetOnline(user.id, !user.profile?.isOnline)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded ${user.profile?.isOnline ? 'text-green-600 hover:text-green-900 hover:bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                          title={user.profile?.isOnline ? 'Set offline' : 'Set online'}
                        >
                          <FaCircle className="flex-shrink-0 text-xs" />
                          <span>{user.profile?.isOnline ? 'Offline' : 'Online'}</span>
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded ${user.isActive ? 'text-red-600 hover:text-red-900 hover:bg-red-50' : 'text-green-600 hover:text-green-900 hover:bg-green-50'}`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <FaUserTimes className="flex-shrink-0" /> : <FaUserCheck className="flex-shrink-0" />}
                          <span>{user.isActive ? 'Deactivate' : 'Activate'}</span>
                        </button>
                        <button
                          onClick={() => handleToggleVerified(user.id, user.isVerified)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                          title={user.isVerified ? 'Unverify' : 'Verify'}
                        >
                          <FaCheckCircle className="flex-shrink-0" />
                          <span>{user.isVerified ? 'Unverify' : 'Verify'}</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found matching your search.
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    required
                    min="18"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-nex text-white rounded-md hover:opacity-90 transition-all"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      email: '',
                      password: '',
                      firstName: '',
                      lastName: '',
                      age: '',
                      gender: 'male',
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit streamer profile modal */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit profile — {editUser.email}</h3>
            <form onSubmit={handleSaveEditProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input
                    type="text"
                    required
                    value={editProfileForm.firstName}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input
                    type="text"
                    value={editProfileForm.lastName}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    min="18"
                    value={editProfileForm.age}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={editProfileForm.gender}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={editProfileForm.bio}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="Short bio"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editProfileForm.locationCity}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, locationCity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    placeholder="Display location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={editProfileForm.locationCountry}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, locationCountry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    placeholder="Display location"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingEditProfile}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingEditProfile ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditUser(null); }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User payments modal (subscription & refill) */}
      {showPaymentsModal && paymentsModalUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                Payments — {paymentsModalUser.profile?.firstName && paymentsModalUser.profile?.lastName
                  ? `${paymentsModalUser.profile.firstName} ${paymentsModalUser.profile.lastName}`
                  : paymentsModalUser.email}
              </h3>
              <button
                type="button"
                onClick={() => { setShowPaymentsModal(false); setPaymentsModalUser(null); setUserPayments([]); }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-4">
              {loadingUserPayments ? (
                <div className="text-center py-8 text-gray-500">Loading payments…</div>
              ) : userPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No subscription or refill payments for this user.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Credits</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {p.type === 'subscription' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <FaCreditCard /> Subscription
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <FaCoins /> Refill
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600 max-w-xs truncate" title={p.description}>{p.description || '—'}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">+{p.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
