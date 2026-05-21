import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSave, FaCog, FaShieldAlt, FaBell, FaTags } from 'react-icons/fa';

const DEFAULT_PACKS = [
  { plan: 'basic', creditsLabel: '150 Credits/Mo', wasPrice: '69', price: '19.99', save: 'SAVE 66%' },
  { plan: 'premium', creditsLabel: '600 Credits/Mo', wasPrice: '179', price: '149', save: 'SAVE 16%' },
  { plan: 'vip', creditsLabel: '1500 Credits/Mo', wasPrice: '369', price: '299', save: 'SAVE 16%' },
];

const DEFAULT_REFILL_PACKS = [
  { id: 'p20', credits: 20, price: 16, saveLabel: 'SAVE 20%', badge: 'BESTSELLER', imageUrl: '' },
  { id: 'p50', credits: 50, price: 39, saveLabel: 'SAVE 17%', badge: '', imageUrl: '' },
  { id: 'p160', credits: 160, price: 99, saveLabel: 'SAVE 16%', badge: '', imageUrl: '' },
  { id: 'p1000', credits: 1000, price: 480, saveLabel: 'SAVE 16%', badge: 'BEST VALUE', imageUrl: '' },
];

function getSavePercent(wasPrice, price) {
  const was = parseFloat(String(wasPrice).replace(/[^0-9.]/g, '')) || 0;
  const p = parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
  if (was <= 0 || p >= was) return 0;
  return Math.round(((was - p) / was) * 100);
}

function creditsDisplayValue(creditsLabel) {
  const str = String(creditsLabel ?? '').trim();
  const num = str.replace(/^(\d+).*$/, '$1');
  return num || '';
}

function creditsLabelForSave(value) {
  const str = String(value ?? '').trim();
  if (/^\d+$/.test(str)) return `${str} Credits/Mo`;
  return str || '';
}

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Vantage Dating',
    maintenanceMode: false,
    allowRegistrations: true,
    maxUploadSize: 10,
    enableNotifications: true,
    maintenanceMessage: '',
    chatMessage: 0,
    emailSendCredits: 0,
    mingleCredits: 0,
    voiceCallPerMinute: 0,
    videoCallPerMinute: 0,
    photoViewCredits: 15,
    videoViewCredits: 15,
    voiceMessageCredits: 10,
    vipCreditsRequired: 160,
    // Subscription modal (Upgrade modal)
    subscriptionModalTitle: 'Subscribe to a Monthly Credit Pack & Date FREELY!',
    subscriptionStep1Title: '1. Choose Monthly Credit Pack Size:',
    subscriptionStep2Title: '2. Get Bonuses:',
    subscriptionPacks: DEFAULT_PACKS,
    // Refill popup packs
    refillPacks: DEFAULT_REFILL_PACKS,
  });
  const [saving, setSaving] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handlePackChange = (packIndex, field, value) => {
    setSettings((prev) => {
      const packs = [...(prev.subscriptionPacks || DEFAULT_PACKS)];
      if (!packs[packIndex]) packs[packIndex] = { plan: ['basic', 'premium', 'vip'][packIndex], creditsLabel: '', wasPrice: '', price: '', save: '' };
      packs[packIndex] = { ...packs[packIndex], [field]: value };
      return { ...prev, subscriptionPacks: packs };
    });
  };

  const handleRefillPackChange = (packIndex, field, value) => {
    setSettings((prev) => {
      const packs = [...(prev.refillPacks || DEFAULT_REFILL_PACKS)];
      if (!packs[packIndex]) {
        packs[packIndex] = {
          id: `p${packIndex + 1}`,
          credits: 0,
          price: 0,
          saveLabel: '',
          badge: '',
          imageUrl: '',
        };
      }
      packs[packIndex] = { ...packs[packIndex], [field]: value };
      return { ...prev, refillPacks: packs };
    });
  };

  const handleRefillPackImageUpload = async (packIndex, file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await axios.post('/api/admin/refill-pack-image', formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      if (data?.url) {
        handleRefillPackChange(packIndex, 'imageUrl', data.url);
      }
    } catch (error) {
      console.error('Error uploading refill pack image:', error);
      const msg =
        error.response?.data?.message ||
        (Array.isArray(error.response?.data?.errors) && error.response.data.errors[0]?.msg) ||
        'Failed to upload image';
      alert(msg);
    }
  };

  const addRefillPack = () => {
    setSettings((prev) => {
      const packs = [...(prev.refillPacks || DEFAULT_REFILL_PACKS)];
      const nextIndex = packs.length;
      const newPack = {
        id: `p${nextIndex + 1}`,
        credits: 0,
        price: 0,
        saveLabel: '',
        badge: '',
        imageUrl: '',
      };
      return { ...prev, refillPacks: [...packs, newPack] };
    });
  };

  const removeRefillPack = (packIndex) => {
    setSettings((prev) => {
      const packs = [...(prev.refillPacks || DEFAULT_REFILL_PACKS)];
      if (packs.length <= 1) return prev;
      packs.splice(packIndex, 1);
      return { ...prev, refillPacks: packs };
    });
  };

  // Load credit + site settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      const headers = getAuthHeaders();
      try {
        const [creditRes, siteRes] = await Promise.all([
          axios.get('/api/admin/credit-settings', { headers }),
          axios.get('/api/admin/site-settings', { headers }),
        ]);
        if (creditRes.data?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...creditRes.data.settings,
          }));
        }
        if (siteRes.data?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...siteRes.data.settings,
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const subscriptionPacks = (settings.subscriptionPacks || DEFAULT_PACKS).map((pack) => {
        const savePercent = getSavePercent(pack.wasPrice, pack.price);
        return {
          ...pack,
          creditsLabel: creditsLabelForSave(pack.creditsLabel),
          save: `SAVE ${savePercent}%`,
        };
      });
      const payload = {
        chatMessage: settings.chatMessage,
        emailSendCredits: settings.emailSendCredits,
        mingleCredits: settings.mingleCredits,
        voiceCallPerMinute: settings.voiceCallPerMinute,
        videoCallPerMinute: settings.videoCallPerMinute,
        photoViewCredits: settings.photoViewCredits,
        videoViewCredits: settings.videoViewCredits,
        voiceMessageCredits: settings.voiceMessageCredits,
        vipCreditsRequired: settings.vipCreditsRequired,
        subscriptionPacks,
        refillPacks: settings.refillPacks || DEFAULT_REFILL_PACKS,
      };
      const headers = getAuthHeaders();
      await Promise.all([
        axios.put('/api/admin/credit-settings', payload, { headers }),
        axios.put(
          '/api/admin/site-settings',
          {
            siteName: settings.siteName,
            maintenanceMode: settings.maintenanceMode,
            allowRegistrations: settings.allowRegistrations,
            maxUploadSize: settings.maxUploadSize,
            enableNotifications: settings.enableNotifications,
            maintenanceMessage: settings.maintenanceMessage || '',
          },
          { headers }
        ),
      ]);

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send Email Cost (credits per email sent)
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.emailSendCredits ?? 0}
                  onChange={(e) =>
                    handleChange('emailSendCredits', parseInt(e.target.value || '0', 10))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Let&apos;s Mingle Cost (credits per mingle)
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.mingleCredits ?? 0}
                  onChange={(e) =>
                    handleChange('mingleCredits', parseInt(e.target.value || '0', 10))
                  }
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VIP credits required (per 30 days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={settings.vipCreditsRequired}
                  onChange={(e) =>
                    handleChange('vipCreditsRequired', Math.max(1, parseInt(e.target.value || '160', 10)))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary max-w-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Credits a Premium user must spend in the last 30 days to qualify for or renew VIP. Applies to new VIP and existing VIP members.
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Chat/voice/video: credits per message or per started minute. Photo/video/voice: credits deducted when a user unlocks an email attachment to view a photo, view a video, or listen to a voice message.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <FaTags className="text-admin-primary" />
              <h3 className="text-lg font-semibold text-gray-800">Subscription Modal (Upgrade)</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4 pl-8">
              Edit credit pack labels and pricing shown in the upgrade modal. Changes appear on the main app after save.
            </p>
            <div className="space-y-4 pl-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credit packs (Pack 1, 2, 3)</label>
                {(settings.subscriptionPacks || DEFAULT_PACKS).map((pack, idx) => (
                  <div key={idx} className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Pack {idx + 1}</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs font-medium text-gray-600">Credits</span>
                        <input
                          type="text"
                          placeholder="e.g. 200"
                          value={creditsDisplayValue(pack.creditsLabel)}
                          onChange={(e) => handlePackChange(idx, 'creditsLabel', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs font-medium text-gray-600">Was price</span>
                        <input
                          type="text"
                          placeholder="e.g. 69"
                          value={pack.wasPrice ?? ''}
                          onChange={(e) => handlePackChange(idx, 'wasPrice', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs font-medium text-gray-600">Price</span>
                        <input
                          type="text"
                          placeholder="e.g. 19.99"
                          value={pack.price ?? ''}
                          onChange={(e) => handlePackChange(idx, 'price', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-100 text-gray-700 font-medium flex items-center">
                        SAVE {getSavePercent(pack.wasPrice, pack.price)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <FaTags className="text-admin-primary" />
              <h3 className="text-lg font-semibold text-gray-800">Refill Popup Packs</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4 pl-8">
              Configure one-time credit refill packs (credits, price, label, and image) shown in the refill popup.
            </p>
            <div className="space-y-4 pl-8">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Refill packs (you can add more than 4)
                </label>
                <button
                  type="button"
                  onClick={addRefillPack}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md bg-admin-primary text-white hover:bg-admin-primary-dark"
                >
                  + Add pack
                </button>
              </div>
              {(settings.refillPacks || DEFAULT_REFILL_PACKS).map((pack, idx) => (
                <div key={pack.id || idx} className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase">Pack {idx + 1}</span>
                    { (settings.refillPacks || DEFAULT_REFILL_PACKS).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRefillPack(idx)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-gray-600">Credits</span>
                      <input
                        type="number"
                        min={1}
                        value={pack.credits ?? 0}
                        onChange={(e) => handleRefillPackChange(idx, 'credits', parseInt(e.target.value || '0', 10))}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-gray-600">Price (USD)</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={pack.price ?? 0}
                        onChange={(e) => handleRefillPackChange(idx, 'price', parseFloat(e.target.value || '0'))}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-gray-600">Save label</span>
                      <input
                        type="text"
                        placeholder="e.g. SAVE 20%"
                        value={pack.saveLabel ?? ''}
                        onChange={(e) => handleRefillPackChange(idx, 'saveLabel', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-gray-600">Badge</span>
                      <select
                        value={pack.badge || ''}
                        onChange={(e) => handleRefillPackChange(idx, 'badge', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                      >
                        <option value="">None</option>
                        <option value="BESTSELLER">BESTSELLER</option>
                        <option value="BEST VALUE">BEST VALUE</option>
                      </select>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-gray-600">Image</span>
                      {pack.imageUrl && (
                        <img
                          src={pack.imageUrl}
                          alt={`Pack ${idx + 1}`}
                          className="h-12 w-12 object-contain mb-1 border border-gray-200 rounded"
                        />
                      )}
                      <label className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 bg-white cursor-pointer hover:bg-gray-50 w-fit">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleRefillPackImageUpload(idx, file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
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
                    Temporarily disable the member app and API for everyone except CRM admins. Members see a maintenance page.
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance message (optional)
                </label>
                <textarea
                  value={settings.maintenanceMessage || ''}
                  onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                  rows={3}
                  placeholder="Shown on the member app during maintenance…"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary text-sm"
                />
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
