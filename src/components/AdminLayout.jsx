import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserShield,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout, canViewUsers, canCreateAdminUsers } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build menu items based on permissions
  const allMenuItems = [
    { path: '/', icon: FaHome, label: 'Dashboard', permission: () => true },
    { path: '/users', icon: FaUsers, label: 'Users', permission: canViewUsers },
    { path: '/admin-users', icon: FaUserShield, label: 'System Users', permission: () => true },
    { path: '/settings', icon: FaCog, label: 'Settings', permission: () => true },
  ];

  const menuItems = allMenuItems.filter(item => item.permission());

  return (
    <div className="flex h-screen bg-admin-light">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-black text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <img 
                src="/logo-removebg.png" 
                alt="Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h1 className="text-xl font-bold text-white">Admin CRM</h1>
            </div>
          )}
          {!sidebarOpen && (
            <img 
              src="/logo-removebg.png" 
              alt="Logo" 
              className="h-10 w-auto object-contain mx-auto"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gradient-nex text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="text-xl" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <FaSignOutAlt />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              {menuItems.find((item) => item.path === location.pathname)?.label ||
                'Dashboard'}
            </h2>
            <div className="flex items-center space-x-4">
              {/* Profile Section */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-nex rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {admin?.email?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{admin?.email || 'Admin'}</p>
                  <p className="text-xs text-gray-500 capitalize">
                  {admin?.userType === 'superadmin' ? 'Super Administrator' : 
                   admin?.userType === 'admin' ? 'Administrator' :
                   admin?.userType === 'viewer' ? 'Viewer' : 'Administrator'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
