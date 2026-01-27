import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchAdminProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      const allowedRoles = ['admin', 'superadmin', 'viewer'];
      if (response.data && response.data.user && allowedRoles.includes(response.data.user.userType)) {
        setAdmin(response.data.user);
      } else {
        localStorage.removeItem('adminToken');
        delete axios.defaults.headers.common['Authorization'];
        setAdmin(null);
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      localStorage.removeItem('adminToken');
      delete axios.defaults.headers.common['Authorization'];
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const allowedRoles = ['admin', 'superadmin', 'viewer'];
      if (response.data.user && allowedRoles.includes(response.data.user.userType)) {
        localStorage.setItem('adminToken', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setAdmin(response.data.user);
        return { success: true };
      } else {
        return { success: false, message: 'Admin access required' };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    delete axios.defaults.headers.common['Authorization'];
    setAdmin(null);
  };

  // Permission helpers
  const isSuperAdmin = () => admin?.userType === 'superadmin';
  const isAdmin = () => admin?.userType === 'admin';
  const isViewer = () => admin?.userType === 'viewer';
  // Permission checks
  const canCreateAdminUsers = () => isSuperAdmin();
  const canDeleteAdminUsers = () => isSuperAdmin();
  const canViewUsers = () => isSuperAdmin() || isViewer(); // Super admin and viewer can view
  const canCreateUsers = () => isSuperAdmin() || isViewer(); // Super admin and viewer can create
  const canEditUsers = () => isSuperAdmin(); // Only super admin can edit/delete users
  const canManageContent = () => isSuperAdmin() || isAdmin();
  const canManageReports = () => isSuperAdmin() || isAdmin();

  return (
    <AuthContext.Provider value={{ 
      admin, 
      loading, 
      login, 
      logout,
      isSuperAdmin,
      isAdmin,
      isViewer,
      canCreateAdminUsers,
      canDeleteAdminUsers,
      canViewUsers,
      canCreateUsers,
      canEditUsers,
      canManageContent,
      canManageReports,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
