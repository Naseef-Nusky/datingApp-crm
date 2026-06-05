import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function CrmNotifications() {
  const navigate = useNavigate();
  const { canViewNewUsersTab } = useAuth();
  const newUsersPath = canViewNewUsersTab?.() ? '/users/new' : '/users';
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const { data } = await axios.get('/api/admin/crm-events', {
        params: { limit: 25 },
      });
      setEvents(data.events || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.response?.status === 403
          ? 'Notifications not available for your role'
          : e.message || 'Failed to load notifications');
      setError(msg);
      console.error('CRM notifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const markRead = async (eventId) => {
    try {
      await axios.patch(`/api/admin/crm-events/${eventId}/read`);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post('/api/admin/crm-events/read-all');
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Notifications"
      >
        <FaBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] max-h-[min(24rem,70vh)] overflow-auto bg-white border border-gray-200 rounded-lg shadow-xl z-50">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <span className="font-semibold text-sm text-gray-800">New user alerts</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-admin-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            {loading ? (
              <p className="p-4 text-sm text-gray-500">Loading…</p>
            ) : error ? (
              <p className="p-4 text-sm text-red-600">{error}</p>
            ) : events.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No alerts yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className={!ev.readAt ? 'bg-teal-50/50 border-l-2 border-teal-500' : ''}
                  >
                    <Link
                      to={newUsersPath}
                      onClick={async (e) => {
                        if (!ev.readAt) {
                          e.preventDefault();
                          await markRead(ev.id);
                          setOpen(false);
                          navigate(newUsersPath);
                          return;
                        }
                        setOpen(false);
                      }}
                      className="block px-3 py-2 hover:bg-gray-50"
                    >
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        New user added
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {ev.message || 'Member'}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
