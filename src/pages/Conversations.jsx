import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaComments, FaSearch, FaEye, FaUser, FaVideo } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

function getDisplayName(user) {
  if (!user) return '—';
  const p = user.profile;
  if (p?.firstName || p?.lastName) return [p.firstName, p.lastName].filter(Boolean).join(' ') || user.email;
  return user.email || '—';
}

function getPhotoUrl(user) {
  const p = user?.profile;
  if (!p?.photos?.length) return null;
  const first = typeof p.photos[0] === 'string' ? p.photos[0] : p.photos[0]?.url;
  return first || null;
}

function typeLabel(user) {
  if (!user?.userType) return '';
  const t = user.userType.toLowerCase();
  if (t === 'regular') return 'User';
  if (t === 'streamer' || t === 'talent') return 'Streamer';
  return t;
}

export default function Conversations() {
  const navigate = useNavigate();
  const { canViewUsers } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all'); // all, real, streamers
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [typeFilter]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
      const url = params.toString() ? `/api/admin/conversations?${params.toString()}` : '/api/admin/conversations';
      const res = await axios.get(url);
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const u1 = getDisplayName(c.user1) + ' ' + (c.user1?.email || '');
    const u2 = getDisplayName(c.user2) + ' ' + (c.user2?.email || '');
    return u1.toLowerCase().includes(q) || u2.toLowerCase().includes(q);
  });

  if (canViewUsers && !canViewUsers()) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">You do not have permission to view conversations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 flex-1 min-w-[200px] max-w-md">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-gray-800"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 bg-white text-gray-800"
        >
          <option value="all">All conversations</option>
          <option value="streamers">With streamers</option>
          <option value="real">Users only</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading conversations...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No conversations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Participants</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Types</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Last message</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {[c.user1, c.user2].map((u, idx) => (
                            <div
                              key={`${c.id}-${u?.id || idx}`}
                              className="w-9 h-9 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center overflow-hidden"
                              title={getDisplayName(u)}
                            >
                              {getPhotoUrl(u) ? (
                                <img src={getPhotoUrl(u)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <FaUser className="text-gray-500 text-sm" />
                              )}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{getDisplayName(c.user1)}</div>
                          <div className="text-sm text-gray-500">{c.user1?.email}</div>
                          <div className="font-medium text-gray-800 mt-0.5">{getDisplayName(c.user2)}</div>
                          <div className="text-sm text-gray-500">{c.user2?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-sm">
                        {c.user1?.userType === 'streamer' || c.user1?.userType === 'talent' ? <FaVideo className="text-purple-500" /> : <FaUser />}
                        {typeLabel(c.user1)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-sm ml-1">
                        {c.user2?.userType === 'streamer' || c.user2?.userType === 'talent' ? <FaVideo className="text-purple-500" /> : <FaUser />}
                        {typeLabel(c.user2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm max-w-xs truncate">
                      {c.lastMessage || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/conversations/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-admin-primary text-white hover:opacity-90 text-sm"
                      >
                        <FaEye /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
