import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaUserShield,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const { canCreateAdminUsers, canDeleteAdminUsers, admin } = useAuth();
  
  // Debug logging
  useEffect(() => {
    if (admin) {
      console.log('=== AdminUsers Page Debug ===');
      console.log('Current admin user type:', admin.userType);
      console.log('canCreateAdminUsers result:', canCreateAdminUsers ? canCreateAdminUsers() : 'function not available');
      console.log('============================');
    }
  }, [admin, canCreateAdminUsers]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'admin', // superadmin, admin, viewer - default is 'admin'
  });

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/admins');
      // Filter to show only admin roles (superadmin, admin, viewer)
      const adminRoles = ['superadmin', 'admin', 'viewer'];
      const filteredAdmins = (response.data.admins || []).filter(admin => 
        adminRoles.includes(admin.userType)
      );
      setAdminUsers(filteredAdmins);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/admins', {
        email: formData.username.trim(),
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      });
      setShowCreateModal(false);
      setFormData({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'admin',
      });
      fetchAdminUsers();
      alert('System user created successfully!');
    } catch (error) {
      console.error('Error creating admin:', error);
      alert(error.response?.data?.message || 'Failed to create system user');
    }
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    try {
      // Prevent changing superadmin role
      if (selectedAdmin?.userType === 'superadmin' && formData.role !== 'superadmin') {
        alert('Super Admin role cannot be changed. Only email, password, and name can be updated.');
        return;
      }
      
      // If editing superadmin, keep the role as superadmin
      const payload = {
        email: formData.username.trim(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: selectedAdmin?.userType === 'superadmin' ? 'superadmin' : formData.role,
      };
      if (formData.password) payload.password = formData.password;
      await axios.put(`/api/admin/admins/${selectedAdmin.id}`, payload);
      setShowEditModal(false);
      setSelectedAdmin(null);
      fetchAdminUsers();
      alert('System user updated successfully!');
    } catch (error) {
      console.error('Error updating admin:', error);
      alert(error.response?.data?.message || 'Failed to update system user');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this system user?')) {
      return;
    }
    try {
      await axios.delete(`/api/admin/admins/${adminId}`);
      fetchAdminUsers();
      alert('System user deleted successfully!');
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Failed to delete system user');
    }
  };

  const handleEditClick = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      username: admin.email || '',
      password: '', // Don't pre-fill password
      firstName: admin.profile?.firstName || '',
      lastName: admin.profile?.lastName || '',
      role: admin.userType || 'admin',
    });
    setShowEditModal(true);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      superadmin: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      viewer: 'bg-blue-100 text-blue-800',
    };
    return colors[role] || colors.viewer;
  };

  const filteredAdmins = adminUsers.filter((admin) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (admin.email || '').toLowerCase().includes(searchLower) ||
      (admin.profile?.firstName || '').toLowerCase().includes(searchLower) ||
      (admin.profile?.lastName || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading system users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">System Users</h2>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => {
                const canCreate = canCreateAdminUsers && typeof canCreateAdminUsers === 'function' && canCreateAdminUsers();
                console.log('Create System User button clicked - canCreate:', canCreate);
                console.log('Admin userType:', admin?.userType);
                console.log('canCreateAdminUsers function:', canCreateAdminUsers);
                if (canCreate) {
                  setShowCreateModal(true);
                } else {
                  alert(`You do not have permission to create system users. Current role: ${admin?.userType || 'unknown'}. Only Super Admin can create system users.`);
                }
              }}
              disabled={!canCreateAdminUsers || typeof canCreateAdminUsers !== 'function' || !canCreateAdminUsers()}
              className={`px-6 py-3 rounded-lg font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-2 min-w-[180px] ${
                canCreateAdminUsers && typeof canCreateAdminUsers === 'function' && canCreateAdminUsers()
                  ? 'bg-gradient-nex text-white hover:opacity-90 hover:shadow-lg cursor-pointer'
                  : 'bg-gray-400 text-white cursor-not-allowed opacity-60'
              }`}
              style={{ 
                display: 'flex', 
                visibility: 'visible',
                opacity: canCreateAdminUsers && typeof canCreateAdminUsers === 'function' && canCreateAdminUsers() ? 1 : 0.6
              }}
              title={
                canCreateAdminUsers && typeof canCreateAdminUsers === 'function' && canCreateAdminUsers()
                  ? 'Create new system user'
                  : `Only Super Admin can create system users. Current role: ${admin?.userType || 'unknown'}`
              }
            >
              <FaPlus className="text-lg" />
              <span>Create System User</span>
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search system users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
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
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-admin-primary flex items-center justify-center">
                          <FaUserShield className="text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {admin.profile?.firstName && admin.profile?.lastName
                            ? `${admin.profile.firstName} ${admin.profile.lastName}`
                            : 'System User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {admin.userType || 'admin'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{admin.email || '—'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                        admin.userType || 'admin'
                      )}`}
                    >
                      {admin.userType || 'admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {admin.isActive ? (
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
                    {admin.isVerified ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaTimesCircle className="text-red-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {canCreateAdminUsers() && admin.userType !== 'superadmin' && (
                      <button
                        onClick={() => handleEditClick(admin)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit System User"
                      >
                        <FaEdit />
                      </button>
                    )}
                    {canDeleteAdminUsers() && admin.userType !== 'superadmin' && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete System User"
                      >
                        <FaTrash />
                      </button>
                    )}
                    {admin.userType === 'superadmin' && (
                      <span className="text-gray-400 text-xs">Super Admin cannot be edited</span>
                    )}
                    {!canCreateAdminUsers() && !canDeleteAdminUsers() && admin.userType !== 'superadmin' && (
                      <span className="text-gray-400 text-xs">View Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAdmins.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No system users found.
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Create System User</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. admin@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  autoComplete="username"
                />
                <p className="text-xs text-gray-500 mt-1">Use email format for login (e.g. admin@example.com)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  autoComplete="new-password"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange"
                >
                  <option value="admin">Admin (Full Access)</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Note: Only Super Admin can create system users. Super Admin role cannot be created through this interface.
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-nex text-white rounded-md hover:opacity-90 transition-all"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      username: '',
                      password: '',
                      firstName: '',
                      lastName: '',
                      role: 'admin',
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

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Edit System User</h3>
            <form onSubmit={handleEditAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. admin@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  autoComplete="new-password"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={selectedAdmin?.userType === 'superadmin'}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange ${
                    selectedAdmin?.userType === 'superadmin' ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="admin">Admin (Full Access)</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedAdmin?.userType === 'superadmin' 
                    ? 'Note: Super Admin role cannot be changed. Only username, password, and name can be updated.'
                    : 'Note: Only Super Admin can edit system users. Super Admin role cannot be assigned through this interface.'}
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-nex text-white rounded-md hover:opacity-90 transition-all"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAdmin(null);
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

export default AdminUsers;
