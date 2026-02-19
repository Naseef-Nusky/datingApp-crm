import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSave, FaCog, FaShieldAlt, FaBell } from 'react-icons/fa';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Vantage Dating',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    maxUploadSize: 10,
    enableNotifications: true,
    // Credit-related settings (managed via backend)
    chatMessage: 0,
    voiceCallPerMinute: 0,
    videoCallPerMinute: 0,
    photoViewCredits: 15,
    videoViewCredits: 15,
    voiceMessageCredits: 10,
  });
  const [saving, setSaving] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Load credit settings from backend on mount
  useEffect(() => {
    const loadCreditSettings = async () => {
      try {
        const { data } = await axios.get('/api/admin/credit-settings', {
          headers: getAuthHeaders(),
        });
        if (data?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
          }));
        }
      } catch (error) {
        console.error('Error loading credit settings:', error);
      }
    };
    loadCreditSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist credit-related settings to backend
      await axios.put(
        '/api/admin/credit-settings',
        {
          chatMessage: settings.chatMessage,
          voiceCallPerMinute: settings.voiceCallPerMinute,
          videoCallPerMinute: settings.videoCallPerMinute,
          photoViewCredits: settings.photoViewCredits,
          videoViewCredits: settings.videoViewCredits,
          voiceMessageCredits: settings.voiceMessageCredits,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      // Other UI-only settings remain local for now
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      const msg =
        error.response?.data?.message ||
        (Array.isArray(error.response?.data?.errors) && error.response.data.errors[0]?.msg) ||
        'Failed to save settings';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">System Settings</h2>

        <div className="space-y-6">
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <FaCog className="text-admin-primary" />
              <h3 className="text-lg font-semibold text-gray-800">General Settings</h3>
            </div>
            <div className="space-y-4 pl-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Upload Size (MB)
                </label>
                <input
                  type="number"
                  value={settings.maxUploadSize}
                  onChange={(e) => handleChange('maxUploadSize', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <FaCog className="text-admin-primary" />
              <h3 className="text-lg font-semibold text-gray-800">Credit Costs (CRM)</h3>
            </div>
            <div className="space-y-4 pl-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat Message Cost (credits per message)
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.chatMessage}
                  onChange={(e) => handleChange('chatMessage', parseInt(e.target.value || '0', 10))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice Call Cost (credits per started minute)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.voiceCallPerMinute}
                    onChange={(e) =>
                      handleChange('voiceCallPerMinute', parseInt(e.target.value || '0', 10))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Call Cost (credits per started minute)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.videoCallPerMinute}
                    onChange={(e) =>
                      handleChange('videoCallPerMinute', parseInt(e.target.value || '0', 10))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    View photo in email (credits per photo)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.photoViewCredits}
                    onChange={(e) =>
                      handleChange('photoViewCredits', parseInt(e.target.value || '0', 10))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    View video in email (credits per video)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.videoViewCredits}
                    onChange={(e) =>
                      handleChange('videoViewCredits', parseInt(e.target.value || '0', 10))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Listen to voice message in email (credits per voice)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.voiceMessageCredits}
                    onChange={(e) =>
                      handleChange('voiceMessageCredits', parseInt(e.target.value || '0', 10))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Chat/voice/video: credits per message or per started minute. Photo/video/voice: credits deducted when a user unlocks an email attachment to view a photo, view a video, or listen to a voice message.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <FaShieldAlt className="text-admin-primary" />
              <h3 className="text-lg font-semibold text-gray-800">Security Settings</h3>
            </div>
            <div className="space-y-4 pl-8">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maintenance Mode
                  </label>
                  <p className="text-sm text-gray-500">
                    Temporarily disable the site for maintenance
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Allow New Registrations
                  </label>
                  <p className="text-sm text-gray-500">
                    Enable or disable new user registrations
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowRegistrations}
                    onChange={(e) => handleChange('allowRegistrations', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Require Email Verification
                  </label>
                  <p className="text-sm text-gray-500">
                    Users must verify their email before using the platform
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <FaBell className="text-admin-primary" />
              <h3 className="text-lg font-semibold text-gray-800">Notification Settings</h3>
            </div>
            <div className="space-y-4 pl-8">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Enable Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Send email notifications to users
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-nex text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-nex-orange focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
            >
              <FaSave />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
