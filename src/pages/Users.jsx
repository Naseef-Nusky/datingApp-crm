import { useState, useEffect } from 'react';
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
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Users = () => {
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
  const [filter, setFilter] = useState('all'); // all, active, inactive, verified, unverified
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/users?filter=${filter}`);
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
          <div className="flex gap-2 items-center">
            <button
              onClick={() => {
                const canCreate = canCreateUsers && typeof canCreateUsers === 'function' && canCreateUsers();
                console.log('Create User button clicked - canCreate:', canCreate);
                console.log('Admin userType:', admin?.userType);
                if (canCreate) {
                  setShowCreateModal(true);
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
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
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
                      {user.userType || 'regular'}
                    </span>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {canEditUsers() ? (
                      <>
                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          className={`${
                            user.isActive
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <FaUserTimes /> : <FaUserCheck />}
                        </button>
                        <button
                          onClick={() => handleToggleVerified(user.id, user.isVerified)}
                          className="text-blue-600 hover:text-blue-900"
                          title={user.isVerified ? 'Unverify' : 'Verify'}
                        >
                          <FaCheckCircle />
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">View Only</span>
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
    </div>
  );
};

export default Users;
