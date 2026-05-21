import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STREAMER_HOME = '/users/new';
const FULL_CRM_HOME = '/';

export default function CrmRouteGuard({ children }) {
  const { admin, loading, canAccessFullCrm, canViewNewUsersTab } = useAuth();
  const location = useLocation();

  if (loading) return null;

  const isStreamerStaff = admin?.userType === 'crm_streamer' && canAccessFullCrm?.() === false;
  const mayViewNewUsers = canViewNewUsersTab?.() === true;

  if (isStreamerStaff) {
    if (location.pathname !== STREAMER_HOME) {
      return <Navigate to={STREAMER_HOME} replace />;
    }
    return children;
  }

  if (location.pathname === STREAMER_HOME && !mayViewNewUsers) {
    return <Navigate to={FULL_CRM_HOME} replace />;
  }

  return children;
}
