import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import AdminUsers from './pages/AdminUsers';
import WishlistCategories from './pages/WishlistCategories';
import WishlistProducts from './pages/WishlistProducts';
import VirtualGifts from './pages/VirtualGifts';
import Presents from './pages/Presents';
import PresentOrders from './pages/PresentOrders';
import PresentCategories from './pages/PresentCategories';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-light">
        <div className="text-xl text-admin-primary">Loading...</div>
      </div>
    );
  }

  return admin ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/admin-users" element={<AdminUsers />} />
                    <Route path="/wishlist-categories" element={<WishlistCategories />} />
                    <Route path="/wishlist-products" element={<WishlistProducts />} />
                    <Route path="/virtual-gifts" element={<VirtualGifts />} />
                    <Route path="/present-categories" element={<PresentCategories />} />
                    <Route path="/presents" element={<Presents />} />
                    <Route path="/present-orders" element={<PresentOrders />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
