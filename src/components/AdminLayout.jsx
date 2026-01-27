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
  FaTags,
  FaGift,
  FaHeart,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [wishlistOpen, setWishlistOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout, canViewUsers } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isWishlistActive = location.pathname === '/wishlist-categories' || location.pathname === '/wishlist-products';

  // Top-level menu items
  const topMenuItems = [
    { path: '/', icon: FaHome, label: 'Dashboard', permission: () => true },
    { path: '/users', icon: FaUsers, label: 'Users', permission: canViewUsers },
    { path: '/admin-users', icon: FaUserShield, label: 'System Users', permission: () => true },
  ];

  // Wishlist sub-items (Categories, Products)
  const wishlistItems = [
    { path: '/wishlist-categories', icon: FaTags, label: 'Categories' },
    { path: '/wishlist-products', icon: FaGift, label: 'Products' },
  ];

  const bottomMenuItems = [
    { path: '/settings', icon: FaCog, label: 'Settings', permission: () => true },
  ];

  const allPathsForHeader = [...topMenuItems, ...wishlistItems, ...bottomMenuItems];
  const currentHeaderLabel = allPathsForHeader.find((item) => item.path === location.pathname)?.label || 'Dashboard';

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
            <img 
              src="/logo-removebg.png" 
              alt="Logo" 
              className="h-10 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
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

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {topMenuItems.filter((item) => item.permission()).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-gradient-nex text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="text-xl flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}

            {/* Wishlist section with Categories & Products underneath */}
            <li>
              {sidebarOpen ? (
                <>
                  <button
                    type="button"
                    onClick={() => setWishlistOpen(!wishlistOpen)}
                    className={`w-full flex items-center justify-between space-x-3 p-3 rounded-lg transition-colors ${
                      isWishlistActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="flex items-center space-x-3">
                      <FaHeart className="text-xl flex-shrink-0" />
                      <span>Wishlist</span>
                    </span>
                    {wishlistOpen ? <FaChevronDown className="text-sm" /> : <FaChevronRight className="text-sm" />}
                  </button>
                  {wishlistOpen && (
                    <ul className="mt-1 ml-4 pl-2 border-l border-gray-600 space-y-1">
                      {wishlistItems.map((item) => {
                        const SubIcon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <li key={item.path}>
                            <Link
                              to={item.path}
                              className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors text-sm ${
                                isActive ? 'bg-gradient-nex text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                              }`}
                            >
                              <SubIcon className="text-lg flex-shrink-0" />
                              <span>{item.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              ) : (
                <div className="relative group">
                  <button
                    type="button"
                    className="flex items-center justify-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 w-full"
                    title="Wishlist"
                  >
                    <FaHeart className="text-xl" />
                  </button>
                  <ul className="absolute left-full top-0 ml-1 hidden group-hover:block bg-gray-800 rounded-lg shadow-lg py-2 min-w-[160px] z-50">
                    {wishlistItems.map((item) => {
                      const SubIcon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            className={`flex items-center space-x-2 py-2 px-4 hover:bg-gray-700 ${
                              isActive ? 'text-nex-orange' : 'text-gray-300'
                            }`}
                          >
                            <SubIcon className="text-sm" />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>

            {bottomMenuItems.filter((item) => item.permission()).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-gradient-nex text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="text-xl flex-shrink-0" />
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
              {currentHeaderLabel}
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
