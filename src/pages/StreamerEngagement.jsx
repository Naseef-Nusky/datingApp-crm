import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FaSyncAlt, FaClock, FaComments, FaVideo, FaPhone, FaSearch } from 'react-icons/fa';

const typeLabels = {
  chat: 'Chat',
  video: 'Video',
  voice: 'Voice',
};

const defaultFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

const defaultTo = () => new Date().toISOString().slice(0, 10);

const StreamerEngagement = () => {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [summary, setSummary] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedStreamerId, setSelectedStreamerId] = useState(null);
  const [sessionTypeFilter, setSessionTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const streamerName = (row) => {
    if (row.firstName || row.lastName) {
      return `${row.firstName || ''} ${row.lastName || ''}`.trim();
    }
    return row.email || '—';
  };

  const memberName = (m) => {
    if (!m) return '—';
    if (m.firstName || m.lastName) {
      return `${m.firstName || ''} ${m.lastName || ''}`.trim();
    }
    return m.email || '—';
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const matchesStreamerSearch = (row) => {
    if (!normalizedSearch) return true;
    const name = streamerName(row).toLowerCase();
    const email = (row.email || '').toLowerCase();
    return name.includes(normalizedSearch) || email.includes(normalizedSearch);
  };

  const matchesMemberSearch = (m) => {
    if (!normalizedSearch) return true;
    const name = memberName(m).toLowerCase();
    const email = (m?.email || '').toLowerCase();
    return name.includes(normalizedSearch) || email.includes(normalizedSearch);
  };

  const filteredSummary = useMemo(
    () => summary.filter(matchesStreamerSearch),
    [summary, normalizedSearch]
  );

  const totals = useMemo(() => {
    return filteredSummary.reduce(
      (acc, row) => ({
        chatSessions: acc.chatSessions + (row.chatSessionCount || 0),
        videoSessions: acc.videoSessions + (row.videoSessionCount || 0),
        voiceSessions: acc.voiceSessions + (row.voiceSessionCount || 0),
        sessions: acc.sessions + (row.sessionCount || 0),
      }),
      { chatSessions: 0, videoSessions: 0, voiceSessions: 0, sessions: 0 }
    );
  }, [filteredSummary]);

  const filteredSessions = useMemo(
    () => sessions.filter((s) => matchesMemberSearch(s.member)),
    [sessions, normalizedSearch]
  );

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const { data } = await axios.get(
        `/api/admin/streamer-engagement/summary?${params.toString()}`,
        { headers: getAuthHeaders() }
      );
      setSummary(data.summary || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load engagement summary');
      setSummary([]);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const fetchSessions = useCallback(
    async (streamerId) => {
      if (!streamerId) {
        setSessions([]);
        return;
      }
      try {
        setSessionsLoading(true);
        const params = new URLSearchParams({ streamerId });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (sessionTypeFilter) params.set('type', sessionTypeFilter);
        params.set('limit', '100');
        const { data } = await axios.get(
          `/api/admin/streamer-engagement/sessions?${params.toString()}`,
          { headers: getAuthHeaders() }
        );
        setSessions(data.sessions || []);
      } catch (err) {
        console.error(err);
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    },
    [from, to, sessionTypeFilter]
  );

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (selectedStreamerId) {
      fetchSessions(selectedStreamerId);
    }
  }, [selectedStreamerId, fetchSessions]);

  const handleRowClick = (streamerId) => {
    setSelectedStreamerId(streamerId);
  };

  const selectedRow = summary.find((r) => r.streamerId === selectedStreamerId);

  useEffect(() => {
    if (
      selectedStreamerId &&
      !filteredSummary.some((r) => r.streamerId === selectedStreamerId)
    ) {
      setSelectedStreamerId(null);
      setSessions([]);
    }
  }, [filteredSummary, selectedStreamerId]);

  if (loading && summary.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading streamer engagement…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <FaClock className="text-admin-primary" />
              Streamer engagement &amp; hours
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchSummary();
              if (selectedStreamerId) fetchSessions(selectedStreamerId);
            }}
            className="inline-flex items-center gap-2 rounded-md bg-admin-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <FaSyncAlt />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="min-w-[220px] flex-1 sm:max-w-xs">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Search name or email
            </label>
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Streamer or member…"
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-admin-primary focus:ring-1 focus:ring-admin-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="py-3 pr-4 font-semibold">Streamer</th>
                <th className="py-3 pr-4 font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <FaComments className="text-teal-600" /> Chat
                  </span>
                  <div className="text-xs font-normal text-gray-400 mt-0.5">
                    hours · sessions
                  </div>
                </th>
                <th className="py-3 pr-4 font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <FaVideo className="text-purple-600" /> Video
                  </span>
                  <div className="text-xs font-normal text-gray-400 mt-0.5">
                    hours · sessions
                  </div>
                </th>
                <th className="py-3 pr-4 font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <FaPhone className="text-blue-600" /> Voice
                  </span>
                  <div className="text-xs font-normal text-gray-400 mt-0.5">
                    hours · sessions
                  </div>
                </th>
                <th className="py-3 pr-4 font-semibold">Total hours</th>
                <th className="py-3 font-semibold">Total sessions</th>
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No completed engagement in this period.
                  </td>
                </tr>
              ) : filteredSummary.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No streamers match your search.
                  </td>
                </tr>
              ) : (
                filteredSummary.map((row) => (
                  <tr
                    key={row.streamerId}
                    onClick={() => handleRowClick(row.streamerId)}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedStreamerId === row.streamerId
                        ? 'bg-teal-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900">{streamerName(row)}</div>
                      <div className="text-xs text-gray-500">{row.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      <div>
                        {row.chatFormatted}{' '}
                        <span className="text-gray-400">({row.chatHours}h)</span>
                      </div>
                      <div className="text-xs text-teal-700 mt-0.5">
                        {row.chatSessionCount ?? 0} chat session
                        {(row.chatSessionCount ?? 0) === 1 ? '' : 's'}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      <div>
                        {row.videoFormatted}{' '}
                        <span className="text-gray-400">({row.videoHours}h)</span>
                      </div>
                      <div className="text-xs text-purple-700 mt-0.5">
                        {row.videoSessionCount ?? 0} video call
                        {(row.videoSessionCount ?? 0) === 1 ? '' : 's'}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      <div>
                        {row.voiceFormatted}{' '}
                        <span className="text-gray-400">({row.voiceHours}h)</span>
                      </div>
                      <div className="text-xs text-blue-700 mt-0.5">
                        {row.voiceSessionCount ?? 0} voice call
                        {(row.voiceSessionCount ?? 0) === 1 ? '' : 's'}
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-gray-900">
                      {row.totalFormatted}{' '}
                      <span className="text-gray-500 font-normal">({row.totalHours}h)</span>
                    </td>
                    <td className="py-3 text-gray-600 font-medium">{row.sessionCount}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredSummary.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-gray-800">
                  <td className="py-3 pr-4">Totals ({filteredSummary.length} streamers)</td>
                  <td className="py-3 pr-4 text-teal-800">
                    {totals.chatSessions} chat session{totals.chatSessions === 1 ? '' : 's'}
                  </td>
                  <td className="py-3 pr-4 text-purple-800">
                    {totals.videoSessions} video call{totals.videoSessions === 1 ? '' : 's'}
                  </td>
                  <td className="py-3 pr-4 text-blue-800">
                    {totals.voiceSessions} voice call{totals.voiceSessions === 1 ? '' : 's'}
                  </td>
                  <td className="py-3 pr-4" />
                  <td className="py-3">{totals.sessions}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {selectedStreamerId && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Sessions — {selectedRow ? streamerName(selectedRow) : 'Streamer'}
              </h3>
              {selectedRow && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedRow.chatSessionCount ?? 0} chat · {selectedRow.videoSessionCount ?? 0}{' '}
                  video · {selectedRow.voiceSessionCount ?? 0} voice ·{' '}
                  {selectedRow.sessionCount ?? 0} total
                </p>
              )}
            </div>
            <select
              value={sessionTypeFilter}
              onChange={(e) => setSessionTypeFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full sm:w-auto"
            >
              <option value="">All types</option>
              <option value="chat">Chat only</option>
              <option value="video">Video only</option>
              <option value="voice">Voice only</option>
            </select>
          </div>

          {sessionsLoading ? (
            <p className="text-gray-500 py-6 text-center">Loading sessions…</p>
          ) : sessions.length === 0 ? (
            <p className="text-gray-500 py-6 text-center">No sessions in this period.</p>
          ) : filteredSessions.length === 0 ? (
            <p className="text-gray-500 py-6 text-center">No sessions match your search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="py-2 pr-4 font-semibold">Type</th>
                    <th className="py-2 pr-4 font-semibold">Member</th>
                    <th className="py-2 pr-4 font-semibold">Started</th>
                    <th className="py-2 pr-4 font-semibold">Ended</th>
                    <th className="py-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            s.sessionType === 'chat'
                              ? 'bg-teal-100 text-teal-800'
                              : s.sessionType === 'video'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {typeLabels[s.sessionType] || s.sessionType}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-800">{memberName(s.member)}</td>
                      <td className="py-2 pr-4 text-gray-600">
                        {s.startedAt
                          ? new Date(s.startedAt).toLocaleString()
                          : '—'}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {s.endedAt ? new Date(s.endedAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-2 font-medium text-gray-900">
                        {s.durationFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StreamerEngagement;
