import { useState, useEffect } from 'react';
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
  FaGem,
  FaChevronDown,
  FaChevronRight,
  FaTruck,
  FaVideo,
  FaPlus,
  FaComments,
  FaCreditCard,
  FaClock,
  FaUserPlus,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import CrmNotifications from './CrmNotifications';

const MOBILE_NAV_MQ = '(max-width: 1023px)';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia(MOBILE_NAV_MQ).matches
  );
  const [usersOpen, setUsersOpen] = useState(true);
  const [wishlistOpen, setWishlistOpen] = useState(true);
  const [presentsOpen, setPresentsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout, canViewUsers, canAccessFullCrm, canViewNewUsersTab, isCrmStreamerStaff } =
    useAuth();
  const fullCrm = canAccessFullCrm?.() !== false;
  const streamerCrm = canViewNewUsersTab?.() === true || isCrmStreamerStaff?.() === true;

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MQ);
    const onResize = () => {
      if (!mq.matches) setSidebarOpen(true);
    };
    onResize();
    mq.addEventListener('change', onResize);
    return () => mq.removeEventListener('change', onResize);
  }, []);

  useEffect(() => {
    if (window.matchMedia(MOBILE_NAV_MQ).matches) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showNavLabels = sidebarOpen;

  const isUsersActive = streamerCrm
    ? false
    : fullCrm &&
      (location.pathname === '/users' ||
        location.pathname === '/streamers' ||
        location.pathname === '/users/create');
  const isNewUsersActive = location.pathname === '/users/new';
  const isWishlistActive =
    location.pathname === '/wishlist-categories' || location.pathname === '/wishlist-products';
  const isPresentsActive =
    location.pathname === '/present-categories' ||
    location.pathname === '/presents' ||
    location.pathname === '/present-orders';
  const isConversationsActive = location.pathname.startsWith('/conversations');

  const topMenuItems = [{ path: '/', icon: FaHome, label: 'Dashboard', permission: () => true }];

  const usersItems = fullCrm
    ? [
        { path: '/users', icon: FaUsers, label: 'Real users' },
        { path: '/streamers', icon: FaVideo, label: 'Streamers' },
        { path: '/users/create', icon: FaPlus, label: 'Create user' },
      ]
    : [];

  const wishlistItems = [
    { path: '/wishlist-categories', icon: FaTags, label: 'Categories' },
    { path: '/wishlist-products', icon: FaGift, label: 'Products' },
  ];

  const presentsItems = [
    { path: '/present-categories', icon: FaTags, label: 'Present Categories' },
    { path: '/presents', icon: FaGift, label: 'Presents Catalog' },
    { path: '/present-orders', icon: FaTruck, label: 'Present Orders' },
  ];

  const bottomMenuItems = [
    { path: '/settings', icon: FaCog, label: 'Settings', permission: () => true },
  ];

  const conversationItem = { path: '/conversations', icon: FaComments, label: 'Conversations', permission: () => true };
  const paymentsItem = { path: '/payments', icon: FaCreditCard, label: 'Subscription & Refill Payments', permission: () => true };
  const streamerEngagementItem = { path: '/streamer-engagement', icon: FaClock, label: 'Streamer engagement', permission: () => true };
  const allPathsForHeader = [
    ...topMenuItems,
    ...usersItems,
    ...wishlistItems,
    ...presentsItems,
    conversationItem,
    paymentsItem,
    streamerEngagementItem,
    ...bottomMenuItems,
    ...(streamerCrm ? [{ path: '/users/new', label: 'New users' }] : []),
  ];
  const headerPath = location.pathname.match(/^\/conversations\/[^/]+$/)
    ? { path: '/conversations', label: 'View conversation' }
    : null;
  const currentHeaderLabel =
    headerPath?.label ||
    allPathsForHeader.find((item) => item.path === location.pathname)?.label ||
    'Dashboard';

  const closeMobileNav = () => {
    if (window.matchMedia(MOBILE_NAV_MQ).matches) setSidebarOpen(false);
  };

  const navLinkClass = (isActive) =>
    `flex items-center space-x-3 p-3 rounded-lg transition-colors min-h-[44px] ${
      isActive ? 'bg-gradient-nex text-white' : 'text-gray-300 hover:bg-gray-700'
    }`;

  return (
    <div className="flex h-[100dvh] min-h-screen bg-admin-light overflow-hidden">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-black text-white transition-all duration-300 ease-in-out w-64 shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'}`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-700 min-h-[60px]">
          {showNavLabels && (
            <img
              src="/logonew.png"
              alt="Logo"
              className="h-10 w-auto object-contain max-w-[140px]"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          {!showNavLabels && (
            <img
              src="/logonew.png"
              alt="Logo"
              className="h-10 w-auto object-contain mx-auto lg:mx-auto"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={sidebarOpen ? 'Collapse menu' : 'Expand menu'}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <nav className="flex-1 p-3 sm:p-4 overflow-y-auto overscroll-contain">
          <ul className="space-y-1">
            {fullCrm &&
              topMenuItems
                .filter((item) => item.permission())
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link to={item.path} onClick={closeMobileNav} className={navLinkClass(isActive)}>
                        <Icon className="text-xl flex-shrink-0" />
                        {showNavLabels && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}

            {streamerCrm && (
              <li>
                <Link
                  to="/users/new"
                  onClick={closeMobileNav}
                  className={navLinkClass(isNewUsersActive)}
                >
                  <FaUserPlus className="text-xl flex-shrink-0" />
                  {showNavLabels && <span>New users</span>}
                </Link>
              </li>
            )}

            {fullCrm && canViewUsers && canViewUsers() && usersItems.length > 0 && (
              <li>
                {showNavLabels ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setUsersOpen(!usersOpen)}
                      className={`w-full flex items-center justify-between space-x-3 p-3 rounded-lg transition-colors min-h-[44px] ${
                        isUsersActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="flex items-center space-x-3">
                        <FaUsers className="text-xl flex-shrink-0" />
                        <span>Users</span>
                      </span>
                      {usersOpen ? <FaChevronDown className="text-sm" /> : <FaChevronRight className="text-sm" />}
                    </button>
                    {usersOpen && (
                      <ul className="mt-1 ml-4 pl-2 border-l border-gray-600 space-y-1">
                        {usersItems.map((item) => {
                          const SubIcon = item.icon;
                          const isActive = location.pathname === item.path;
                          return (
                            <li key={item.path}>
                              <Link
                                to={item.path}
                                onClick={closeMobileNav}
                                className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors text-sm min-h-[40px] ${
                                  isActive
                                    ? 'bg-gradient-nex text-white'
                                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
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
                      className="flex items-center justify-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 w-full min-h-[44px]"
                      title="Users"
                    >
                      <FaUsers className="text-xl" />
                    </button>
                    <ul className="absolute left-full top-0 ml-1 hidden group-hover:block bg-gray-800 rounded-lg shadow-lg py-2 min-w-[160px] z-50">
                      {usersItems.map((item) => {
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
            )}

            {fullCrm && (
              <li>
                <Link
                  to="/admin-users"
                  onClick={closeMobileNav}
                  className={navLinkClass(location.pathname === '/admin-users')}
                >
                  <FaUserShield className="text-xl flex-shrink-0" />
                  {showNavLabels && <span>System Users</span>}
                </Link>
              </li>
            )}

            {fullCrm && (
              <li>
                <Link
                  to="/conversations"
                  onClick={closeMobileNav}
                  className={navLinkClass(isConversationsActive)}
                >
                  <FaComments className="text-xl flex-shrink-0" />
                  {showNavLabels && <span>Conversations</span>}
                </Link>
              </li>
            )}

            {fullCrm && (
              <li>
                <Link
                  to="/streamer-engagement"
                  onClick={closeMobileNav}
                  className={navLinkClass(location.pathname === '/streamer-engagement')}
                >
                  <FaClock className="text-xl flex-shrink-0" />
                  {showNavLabels && <span>Streamer engagement</span>}
                </Link>
              </li>
            )}

            {fullCrm && (
              <li>
                <Link
                  to="/virtual-gifts"
                  onClick={closeMobileNav}
                  className={navLinkClass(location.pathname === '/virtual-gifts')}
                >
                  <FaGem className="text-xl flex-shrink-0" />
                  {showNavLabels && <span>Virtual Gifts</span>}
                </Link>
              </li>
            )}

            {fullCrm && (
              <>
                <li>
                  {showNavLabels ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setWishlistOpen(!wishlistOpen)}
                        className={`w-full flex items-center justify-between space-x-3 p-3 rounded-lg transition-colors min-h-[44px] ${
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
                                  onClick={closeMobileNav}
                                  className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors text-sm min-h-[40px] ${
                                    isActive
                                      ? 'bg-gradient-nex text-white'
                                      : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
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
                        className="flex items-center justify-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 w-full min-h-[44px]"
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

                <li>
                  {showNavLabels ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPresentsOpen(!presentsOpen)}
                        className={`w-full flex items-center justify-between space-x-3 p-3 rounded-lg transition-colors min-h-[44px] ${
                          isPresentsActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <span className="flex items-center space-x-3">
                          <FaGift className="text-xl flex-shrink-0" />
                          <span>Presents</span>
                        </span>
                        {presentsOpen ? <FaChevronDown className="text-sm" /> : <FaChevronRight className="text-sm" />}
                      </button>
                      {presentsOpen && (
                        <ul className="mt-1 ml-4 pl-2 border-l border-gray-600 space-y-1">
                          {presentsItems.map((item) => {
                            const SubIcon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                              <li key={item.path}>
                                <Link
                                  to={item.path}
                                  onClick={closeMobileNav}
                                  className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors text-sm min-h-[40px] ${
                                    isActive
                                      ? 'bg-gradient-nex text-white'
                                      : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
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
                        className="flex items-center justify-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 w-full min-h-[44px]"
                        title="Presents"
                      >
                        <FaGift className="text-xl" />
                      </button>
                      <ul className="absolute left-full top-0 ml-1 hidden group-hover:block bg-gray-800 rounded-lg shadow-lg py-2 min-w-[180px] z-50">
                        {presentsItems.map((item) => {
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
              </>
            )}

            {fullCrm &&
              bottomMenuItems
                .filter((item) => item.permission())
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link to={item.path} onClick={closeMobileNav} className={navLinkClass(isActive)}>
                        <Icon className="text-xl flex-shrink-0" />
                        {showNavLabels && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
          </ul>
        </nav>

        <div className="p-3 sm:p-4 border-t border-gray-700">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors min-h-[44px]"
          >
            <FaSignOutAlt />
            {showNavLabels && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        <header className="bg-white shadow-sm border-b border-gray-200 px-3 py-3 sm:px-4 sm:py-4 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                aria-label="Open menu"
                onClick={() => setSidebarOpen(true)}
              >
                <FaBars className="text-lg" />
              </button>
              <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 truncate">
                {currentHeaderLabel}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <CrmNotifications />
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-nex rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {admin?.email?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="text-right hidden sm:block max-w-[160px] md:max-w-none">
                  <p className="text-sm font-semibold text-gray-800 truncate">{admin?.email || 'Admin'}</p>
                  <p className="text-xs text-gray-500 capitalize truncate">
                    {admin?.userType === 'superadmin'
                      ? 'Super Administrator'
                      : admin?.userType === 'admin'
                        ? 'Administrator'
                        : admin?.userType === 'viewer'
                          ? 'Viewer'
                          : admin?.userType === 'crm_streamer'
                            ? 'Streamer (CRM)'
                            : 'Administrator'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
