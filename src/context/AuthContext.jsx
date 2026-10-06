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

  const allowedPanelRoles = ['admin', 'superadmin', 'viewer', 'crm_streamer'];

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
      if (response.data?.user && allowedPanelRoles.includes(response.data.user.userType)) {
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

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/admin-login', { username, password });
      if (response.data.user && allowedPanelRoles.includes(response.data.user.userType)) {
        localStorage.setItem('adminToken', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setAdmin(response.data.user);
        return { success: true, user: response.data.user };
      }
      return { success: false, message: 'Admin access required' };
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

  const isSuperAdmin = () => admin?.userType === 'superadmin';
  const isAdmin = () => admin?.userType === 'admin';
  const isViewer = () => admin?.userType === 'viewer';
  const isCrmStreamerStaff = () => admin?.userType === 'crm_streamer';

  /** Edit / delete / online / activate / verify — Super Admin + Admin only. */
  const canManageUserActions = () => isSuperAdmin() || isAdmin();

  const canCreateAdminUsers = () => isSuperAdmin();
  const canDeleteAdminUsers = () => isSuperAdmin();
  const canViewUsers = () => isSuperAdmin() || isAdmin() || isViewer() || isCrmStreamerStaff();
  /** Create dating profiles — Super Admin, Admin, and Viewer (create + view only). */
  const canCreateUsers = () => isSuperAdmin() || isAdmin() || isViewer();
  const canDeleteUsers = () => canManageUserActions();
  const canEditUsers = () => canManageUserActions();
  const canToggleUserVerification = () => canManageUserActions();
  const canManageContent = () => isSuperAdmin() || isAdmin();
  const canManageReports = () => isSuperAdmin() || isAdmin();
  /** Full CRM nav (dashboard, payments, gifts, etc.) — Super Admin + Admin only. */
  const canAccessFullCrm = () => isSuperAdmin() || isAdmin();
  /** Profile creator (viewer): users list + create only. */
  const isProfileCreator = () => isViewer();
  /** Sidebar "New users" tab — CRM streamer staff only (not admin/viewer/superadmin). */
  const canViewNewUsersTab = () => isCrmStreamerStaff();

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
        isSuperAdmin,
        isAdmin,
        isViewer,
        isCrmStreamerStaff,
        isProfileCreator,
        canManageUserActions,
        canCreateAdminUsers,
        canDeleteAdminUsers,
        canViewUsers,
        canCreateUsers,
        canDeleteUsers,
        canEditUsers,
        canToggleUserVerification,
        canManageContent,
        canManageReports,
        canAccessFullCrm,
        canViewNewUsersTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
