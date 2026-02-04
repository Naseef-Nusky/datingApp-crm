import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaLock, FaEnvelope, FaUserShield } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login failed');
    }
  };

  const handleQuickLogin = () => {
    setEmail('admin@vantagedating.com');
    setPassword('Admin123!');
    setError('');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img 
            src="/logonew.png" 
            alt="Vantage Dating Logo" 
            className="h-20 mx-auto mb-4 object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 className="text-3xl font-bold bg-gradient-nex bg-clip-text text-transparent mb-2">Admin CRM</h1>
          <p className="text-gray-600">Vantage Dating Administration Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange focus:border-transparent"
                placeholder="admin@vantagedating.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nex-orange focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-nex text-white py-2 px-4 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-nex-orange focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="text-center">
            <button
              type="button"
              onClick={handleQuickLogin}
              className="inline-flex items-center space-x-2 text-sm text-nex-orange hover:text-nex-pink font-medium transition-colors"
            >
              <FaUserShield />
              <span>Use Super Admin Credentials</span>
            </button>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Default Super Admin:</p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Email:</span> admin@vantagedating.com
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Password:</span> Admin123!
            </p>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Only administrators can access this panel</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
