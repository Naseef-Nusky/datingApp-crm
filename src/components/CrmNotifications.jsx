import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';

export default function CrmNotifications() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/admin/crm-events', {
        params: { limit: 25 },
      });
      setEvents(data.events || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (e) {
      console.error('CRM notifications:', e);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

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
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100"
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
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white border border-gray-200 rounded-lg shadow-xl z-50">
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
            {events.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No alerts yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {events.map((ev) => (
                  <li key={ev.id} className={!ev.readAt ? 'bg-teal-50/50' : ''}>
                    <Link
                      to="/users/new"
                      onClick={() => {
                        if (!ev.readAt) markRead(ev.id);
                        setOpen(false);
                      }}
                      className="block px-3 py-2 hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                      {ev.message && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ev.message}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ''}
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
