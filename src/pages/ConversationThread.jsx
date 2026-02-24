import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaUser, FaVideo } from 'react-icons/fa';

function getDisplayName(user) {
  if (!user) return '—';
  const p = user.profile;
  if (p?.firstName || p?.lastName) return [p.firstName, p.lastName].filter(Boolean).join(' ') || user.email;
  return user.email || '—';
}

function typeLabel(user) {
  if (!user?.userType) return '';
  const t = user.userType.toLowerCase();
  if (t === 'streamer' || t === 'talent') return 'Streamer';
  if (t === 'regular') return 'User';
  return t;
}

export default function ConversationThread() {
  const { chatId } = useParams();
  const [data, setData] = useState({ chat: null, messages: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chatId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/admin/conversations/${chatId}/messages`);
        if (!cancelled) {
          setData({ chat: res.data.chat, messages: res.data.messages || [] });
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load conversation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [chatId]);

  if (loading) {
    return (
      <div className="p-6">
        <Link to="/conversations" className="inline-flex items-center gap-2 text-admin-primary hover:underline mb-4">
          <FaArrowLeft /> Back to conversations
        </Link>
        <p className="text-gray-500">Loading conversation...</p>
      </div>
    );
  }

  if (error || !data.chat) {
    return (
      <div className="p-6">
        <Link to="/conversations" className="inline-flex items-center gap-2 text-admin-primary hover:underline mb-4">
          <FaArrowLeft /> Back to conversations
        </Link>
        <p className="text-red-600">{error || 'Conversation not found.'}</p>
      </div>
    );
  }

  const { user1, user2 } = data.chat;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/conversations" className="inline-flex items-center gap-2 text-admin-primary hover:underline mb-4">
        <FaArrowLeft /> Back to conversations
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4">
          <div>
            <span className="text-gray-500 text-sm">Participant 1</span>
            <p className="font-medium text-gray-800">{getDisplayName(user1)}</p>
            <p className="text-sm text-gray-500">{user1?.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded bg-gray-200">
              {user1?.userType === 'streamer' || user1?.userType === 'talent' ? <FaVideo className="text-purple-500" /> : <FaUser />}
              {typeLabel(user1)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Participant 2</span>
            <p className="font-medium text-gray-800">{getDisplayName(user2)}</p>
            <p className="text-sm text-gray-500">{user2?.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded bg-gray-200">
              {user2?.userType === 'streamer' || user2?.userType === 'talent' ? <FaVideo className="text-purple-500" /> : <FaUser />}
              {typeLabel(user2)}
            </span>
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-500 mb-3">Read-only view. Messages in chronological order.</p>
          {data.messages.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">No messages in this conversation.</p>
          ) : (
            <ul className="space-y-3">
              {data.messages.map((m) => {
                const isStreamer = m.senderData?.userType === 'streamer' || m.senderData?.userType === 'talent';
                return (
                  <li
                    key={m.id}
                    className={`flex ${m.sender === user1?.id ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        m.sender === user1?.id
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-admin-primary text-white'
                      }`}
                    >
                      <div className="text-xs opacity-80 mb-0.5">
                        {getDisplayName(m.senderData)}
                        {isStreamer && (
                          <span className="ml-1 inline-flex items-center gap-0.5">
                            <FaVideo className="text-purple-400" /> Streamer
                          </span>
                        )}
                      </div>
                      {m.content && <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>}
                      {m.mediaUrl && (
                        <a
                          href={m.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline mt-1 block"
                        >
                          [Media]
                        </a>
                      )}
                      <div className="text-xs opacity-70 mt-1">
                        {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
