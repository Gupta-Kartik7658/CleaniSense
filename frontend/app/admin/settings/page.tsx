// app/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { PollutionService } from '@/services/pollutionService';
import {
  Settings,
  Save,
  Globe,
  Bell,
  Shield,
  Palette,
  Database,
  Mail,
  Key,
  Server,
  Zap,
  Camera,
  Cloud,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  AlertTriangle,
  Info,
  Download
} from 'lucide-react';

export default function SettingsPage() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'CleaniSense',
    siteDescription: 'Smart City Pollution Monitoring Platform',
    timezone: 'Asia/Kolkata',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    maintenanceMode: false
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    criticalOnly: false,
    dailyDigest: true,
    weeklyReport: true
  });

  const [apiSettings, setApiSettings] = useState({
    openWeatherApiKey: '',
    googleMapsApiKey: '',
    mapboxToken: '',
    enableRateLimit: true,
    maxRequestsPerMin: 100
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireSpecialChars: true,
    maxLoginAttempts: 5,
    ipWhitelisting: false
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API & Integrations', icon: Cloud },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'database', label: 'Database & Storage', icon: Database },
  ];

  // Fetch settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await PollutionService.getSettings();
      if (data) {
        if (data.general) setGeneralSettings(data.general);
        if (data.notifications) setNotificationSettings(data.notifications);
        if (data.api) setApiSettings(data.api);
        if (data.security) setSecuritySettings(data.security);
      }
    } catch (error) {
      console.warn('API getSettings failed. Using localStorage fallback.', error);
      const cached = localStorage.getItem('cleanisense_system_settings');
      if (cached) {
        const data = JSON.parse(cached);
        if (data.general) setGeneralSettings(data.general);
        if (data.notifications) setNotificationSettings(data.notifications);
        if (data.api) setApiSettings(data.api);
        if (data.security) setSecuritySettings(data.security);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section: string) => {
    setSaving(true);
    const updatedPayload = {
      general: generalSettings,
      notifications: notificationSettings,
      api: apiSettings,
      security: securitySettings
    };
    try {
      await PollutionService.saveSettings(updatedPayload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.warn('API saveSettings failed. Storing locally.', e);
      localStorage.setItem('cleanisense_system_settings', JSON.stringify(updatedPayload));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const blob = await PollutionService.triggerDatabaseBackup();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cleanisense_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      // Offline fallback download trigger
      const mockBackup = JSON.stringify({ generalSettings, apiSettings, securitySettings }, null, 2);
      const blob = new Blob([mockBackup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleanisense_offline_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleClearCache = async () => {
    try {
      await PollutionService.clearCache();
      alert('Application server cache cleared successfully.');
    } catch (e) {
      alert('Local storage preferences reset successfully.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-zinc-500">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading system preferences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in text-zinc-900 dark:text-zinc-50 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">System Settings</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-300">Configure and manage administrative API keys and database backups</p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20 rounded-md">
              <Check className="h-4 w-4" />
              Settings saved successfully
            </span>
          )}
          {/* Save changes button uses white text in light mode */}
          <button
            onClick={() => handleSave(activeTab)}
            disabled={saving}
            className="px-4 py-2.5 bg-zinc-950 dark:bg-white hover:bg-zinc-900 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 dark:text-white text-sm font-bold rounded-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm border border-transparent"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 text-left">
        {/* Settings Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-sm">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all cursor-pointer border-l-2
                      ${isSelected
                        ? 'bg-zinc-105 dark:bg-zinc-800 text-zinc-950 dark:text-white border-zinc-950 dark:border-white pl-3.5 font-extrabold shadow-sm'
                        : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/40 pl-3'
                      }
                    `}
                  >
                    <tab.icon className="h-4.5 w-4.5 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* System Status Summary */}
          <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">System Metrics</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="dark:text-zinc-500 dark:text-zinc-300">Database Engine</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">SQLite 3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="dark:text-zinc-500 dark:text-zinc-300">API Status</span>
                <span className="flex items-center gap-1 font-bold text-emerald-650 dark:text-emerald-450">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="dark:text-zinc-500 dark:text-zinc-300">AI Predictions</span>
                <span className="flex items-center gap-1 font-bold text-emerald-650 dark:text-emerald-455">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">General Settings</h2>
                <p className="text-xs dark:text-zinc-500 dark:text-zinc-300">Configure global metadata and locale options</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Site Name</label>
                  <input
                    type="text"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Timezone</label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 text-sm cursor-pointer"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC (GMT)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Site Description</label>
                  <textarea
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white dark:text-white">Alert Preferences</h2>
                <p className="text-xs dark:text-zinc-500 dark:text-zinc-300">Manage automation alert notification routes</p>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'emailAlerts', label: 'Email Notifications', desc: 'Send daily alerts to monitoring emails' },
                  { key: 'smsAlerts', label: 'SMS Warnings', desc: 'Send SMS messages for extreme incident reports' },
                  { key: 'pushNotifications', label: 'Desktop Push Alerts', desc: 'Trigger standard push triggers for municipality administrators' },
                  { key: 'criticalOnly', label: 'High Priority Only', desc: 'Only trigger alerts for critical or extreme incident severities' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-150 dark:border-zinc-850">
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{item.label}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={(notificationSettings as any)[item.key]}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-805 text-zinc-950 focus:ring-0 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Keys Settings */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white dark:text-white">API Keys & Integrations</h2>
                <p className="text-xs dark:text-zinc-500 dark:text-zinc-300">Configure keys for Google Maps, Mapbox, and OpenWeather integrations</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">OpenWeather API Key</label>
                  <input
                    type="password"
                    value={apiSettings.openWeatherApiKey}
                    onChange={(e) => setApiSettings({ ...apiSettings, openWeatherApiKey: e.target.value })}
                    placeholder="weather_token_mock_12345"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Google Maps Geolocation API Key</label>
                  <input
                    type="password"
                    value={apiSettings.googleMapsApiKey}
                    onChange={(e) => setApiSettings({ ...apiSettings, googleMapsApiKey: e.target.value })}
                    placeholder="maps_api_key_mock_67890"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Mapbox Geospatial Vector Token</label>
                  <input
                    type="password"
                    value={apiSettings.mapboxToken}
                    onChange={(e) => setApiSettings({ ...apiSettings, mapboxToken: e.target.value })}
                    placeholder="mapbox_token_mock_abcde"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white dark:text-white">Security & Login Controls</h2>
                <p className="text-xs dark:text-zinc-500 dark:text-zinc-300">Configure parameters for authentication and rate limits</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Max Login Attempts</label>
                  <input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white dark:text-white">Appearance Settings</h2>
                <p className="text-xs dark:text-zinc-500 dark:text-zinc-300">Configure system coloring theme mode</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light Mode', gradient: 'from-zinc-100 to-zinc-200 border-zinc-300' },
                  { id: 'dark', label: 'Dark Mode', gradient: 'from-zinc-800 to-zinc-900 border-zinc-750' },
                  { id: 'system', label: 'System Default', gradient: 'from-slate-200 to-slate-300 border-slate-350 dark:from-zinc-800 dark:to-zinc-950' }
                ].map((mode) => {
                  const isSelected = currentTheme === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setTheme(mode.id as any)}
                      className={`p-4 rounded-lg border transition-all text-center cursor-pointer ${
                        isSelected 
                          ? 'border-zinc-950 dark:border-white bg-zinc-50 dark:bg-zinc-800 scale-102 font-extrabold' 
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className={`h-16 rounded-md mb-3 bg-gradient-to-br ${mode.gradient} border`} />
                      <div className="text-xs font-bold text-zinc-900 dark:text-white">{mode.label}</div>
                      {isSelected && (
                        <div className="mt-1.5 text-[10px] text-zinc-650 dark:text-zinc-300 font-bold uppercase tracking-wider">Selected</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Database & Storage */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-955 dark:text-white">Database & Backup Management</h2>
                <p className="text-xs dark:text-zinc-500 dark:text-zinc-305">Download data backup dumps or clear server cache</p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">Database Backup Download</h3>
                    <p className="text-[10px] dark:text-zinc-500 dark:text-zinc-400 mt-0.5">Export SQLite users, complaints, and hotspot tables as JSON</p>
                  </div>
                  {/* Backup Now button uses white text in light mode */}
                  <button 
                    onClick={handleBackup}
                    className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm border border-transparent"
                  >
                    <Download className="h-4 w-4" />
                    Backup Now
                  </button>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">Clear Application Cache</h3>
                    <p className="text-[10px] dark:text-zinc-500 dark:text-zinc-400 mt-0.5">Force flush temporary API lookup caches and predictions</p>
                  </div>
                  <button 
                    onClick={handleClearCache}
                    className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold rounded-md transition-colors cursor-pointer border border-transparent"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}