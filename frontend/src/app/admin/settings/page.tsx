"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import {
  Settings,
  Mail,
  Shield,
  Bell,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
  emailEnabled: boolean;
}

interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecial: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  mentionNotifications: boolean;
  messageNotifications: boolean;
  eventReminders: boolean;
  announcementNotifications: boolean;
}

const TABS = [
  { label: 'General', value: 'general', icon: Settings },
  { label: 'Email', value: 'email', icon: Mail },
  { label: 'Security', value: 'security', icon: Shield },
  { label: 'Notifications', value: 'notifications', icon: Bell },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const queryClient = useQueryClient();

  const [general, setGeneral] = useState<GeneralSettings>({
    siteName: '',
    siteDescription: '',
    maintenanceMode: false,
  });
  const [email, setEmail] = useState<EmailSettings>({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpFrom: '',
    emailEnabled: true,
  });
  const [security, setSecurity] = useState<SecuritySettings>({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecial: false,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    mentionNotifications: true,
    messageNotifications: true,
    eventReminders: true,
    announcementNotifications: true,
  });

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await api.get('/admin/settings');
      return data.data;
    },
  });

  useEffect(() => {
    if (settingsData) {
      if (settingsData.general) setGeneral(settingsData.general);
      if (settingsData.email) setEmail(settingsData.email);
      if (settingsData.security) setSecurity(settingsData.security);
      if (settingsData.notifications) setNotifications(settingsData.notifications);
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { section: string; data: any }) => {
      const { data } = await api.put('/admin/settings', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    },
  });

  const handleSave = () => {
    switch (activeTab) {
      case 'general':
        saveMutation.mutate({ section: 'general', data: general });
        break;
      case 'email':
        saveMutation.mutate({ section: 'email', data: email });
        break;
      case 'security':
        saveMutation.mutate({ section: 'security', data: security });
        break;
      case 'notifications':
        saveMutation.mutate({ section: 'notifications', data: notifications });
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Configure platform settings and preferences
        </p>
      </div>

      <div className="flex gap-6">
        {/* Tab Navigation */}
        <div className="w-48 shrink-0">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl transition ${
                    activeTab === tab.value
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">General Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Basic platform configuration</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Site Name</label>
                <Input
                  type="text"
                  value={general.siteName}
                  onChange={(e) => setGeneral({ ...general, siteName: e.target.value })}
                  placeholder="UniHub"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Site Description</label>
                <textarea
                  value={general.siteDescription}
                  onChange={(e) => setGeneral({ ...general, siteDescription: e.target.value })}
                  className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
                  rows={3}
                  placeholder="A platform for university students..."
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Maintenance Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    When enabled, only admins can access the platform
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGeneral({ ...general, maintenanceMode: !general.maintenanceMode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    general.maintenanceMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      general.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Email Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">SMTP configuration for outgoing emails</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">SMTP Host</label>
                  <Input
                    type="text"
                    value={email.smtpHost}
                    onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">SMTP Port</label>
                  <Input
                    type="number"
                    value={email.smtpPort}
                    onChange={(e) => setEmail({ ...email, smtpPort: parseInt(e.target.value) || 587 })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">SMTP Username</label>
                <Input
                  type="text"
                  value={email.smtpUser}
                  onChange={(e) => setEmail({ ...email, smtpUser: e.target.value })}
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">From Address</label>
                <Input
                  type="email"
                  value={email.smtpFrom}
                  onChange={(e) => setEmail({ ...email, smtpFrom: e.target.value })}
                  placeholder="noreply@unihub.com"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Email</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Allow the platform to send emails</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmail({ ...email, emailEnabled: !email.emailEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    email.emailEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      email.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Security Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Password policy and session management</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Minimum Password Length: {security.passwordMinLength}
                </label>
                <input
                  type="range"
                  min="6"
                  max="32"
                  value={security.passwordMinLength}
                  onChange={(e) => setSecurity({ ...security, passwordMinLength: parseInt(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Password Requirements</p>
                {[
                  { key: 'passwordRequireUppercase', label: 'Require uppercase letter' },
                  { key: 'passwordRequireNumber', label: 'Require number' },
                  { key: 'passwordRequireSpecial', label: 'Require special character' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <span className="text-sm text-gray-900 dark:text-white">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => setSecurity({ ...security, [item.key]: !(security as any)[item.key] })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        (security as any)[item.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          (security as any)[item.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Session Timeout (minutes)
                  </label>
                  <Input
                    type="number"
                    value={security.sessionTimeoutMinutes}
                    onChange={(e) => setSecurity({ ...security, sessionTimeoutMinutes: parseInt(e.target.value) || 60 })}
                    min="5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Max Login Attempts
                  </label>
                  <Input
                    type="number"
                    value={security.maxLoginAttempts}
                    onChange={(e) => setSecurity({ ...security, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Lockout Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={security.lockoutDurationMinutes}
                  onChange={(e) => setSecurity({ ...security, lockoutDurationMinutes: parseInt(e.target.value) || 15 })}
                  min="1"
                />
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Notification Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure notification delivery preferences</p>
              </div>
              {[
                { key: 'emailNotifications' as const, label: 'Email Notifications', desc: 'Send notifications via email' },
                { key: 'pushNotifications' as const, label: 'Push Notifications', desc: 'Browser push notifications' },
                { key: 'mentionNotifications' as const, label: 'Mention Alerts', desc: 'Notify when someone mentions you' },
                { key: 'messageNotifications' as const, label: 'Message Alerts', desc: 'Notify on new direct messages' },
                { key: 'eventReminders' as const, label: 'Event Reminders', desc: 'Reminders for upcoming events' },
                { key: 'announcementNotifications' as const, label: 'Announcements', desc: 'Platform announcement notifications' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      notifications[item.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
