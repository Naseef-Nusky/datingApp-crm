import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STREAMER_HOME = '/users/new';

export default function CrmRouteGuard({ children }) {
  const { admin, loading, canAccessFullCrm } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (admin?.userType === 'crm_streamer' && canAccessFullCrm?.() === false) {
    if (location.pathname !== STREAMER_HOME) {
      return <Navigate to={STREAMER_HOME} replace />;
    }
  }

  return children;
}
