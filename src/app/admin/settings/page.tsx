'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import toast from 'react-hot-toast';
import {
  FiSave,
  FiSettings,
  FiLock,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
} from 'react-icons/fi';

interface Settings {
  restaurant_name: string;
  restaurant_phone: string;
  restaurant_email: string;
  delivery_fee: string;
  min_order_amount: string;
  delivery_time: string;
}

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<Settings>({
    restaurant_name: '',
    restaurant_phone: '',
    restaurant_email: '',
    delivery_fee: '',
    min_order_amount: '',
    delivery_time: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('*');

      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((item) => {
          settingsMap[item.key] = item.value;
        });

        setSettings({
          restaurant_name: settingsMap.restaurant_name || '',
          restaurant_phone: settingsMap.restaurant_phone || '',
          restaurant_email: settingsMap.restaurant_email || '',
          delivery_fee: settingsMap.delivery_fee || '',
          min_order_amount: settingsMap.min_order_amount || '',
          delivery_time: settingsMap.delivery_time || '',
        });
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
    setIsLoading(false);
  };

  // Handle settings change
  const handleChange = (field: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Save settings
  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      const entries = Object.entries(settings);

      for (const [key, value] of entries) {
        const { data: existing } = await supabase
          .from('site_settings')
          .select('id')
          .eq('key', key)
          .single();

        if (existing) {
          await supabase
            .from('site_settings')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key);
        } else {
          await supabase
            .from('site_settings')
            .insert({ key, value });
        }
      }

      toast.success('Settings saved successfully! ✅');
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error('Failed to save settings');
    }

    setIsSaving(false);
  };

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      toast.error('Enter your current password');
      return;
    }
    if (!newPassword.trim()) {
      toast.error('Enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to change password');
        setIsChangingPassword(false);
        return;
      }

      toast.success('Password changed successfully! 🔒');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Something went wrong');
    }

    setIsChangingPassword(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner h-10 w-10 text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Settings ⚙️
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Manage your restaurant settings and admin account
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Restaurant Settings */}
        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2
            className="mb-5 flex items-center gap-2 text-lg font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            <FiSettings size={20} className="text-primary-600" />
            Restaurant Settings
          </h2>

          <div className="space-y-4">
            {/* Restaurant Name */}
            <div>
              <label
                className="mb-1.5 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Restaurant Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="NonStop Pizza"
                value={settings.restaurant_name}
                onChange={(e) =>
                  handleChange('restaurant_name', e.target.value)
                }
              />
            </div>

            {/* Phone */}
            <div>
              <label
                className="mb-1.5 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="+92-XXX-XXXXXXX"
                value={settings.restaurant_phone}
                onChange={(e) =>
                  handleChange('restaurant_phone', e.target.value)
                }
              />
            </div>

            {/* Email */}
            <div>
              <label
                className="mb-1.5 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="info@nonstoppizza.com"
                value={settings.restaurant_email}
                onChange={(e) =>
                  handleChange('restaurant_email', e.target.value)
                }
              />
            </div>

            {/* Delivery Fee */}
            <div>
              <label
                className="mb-1.5 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Delivery Fee (Rs.)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="150"
                value={settings.delivery_fee}
                onChange={(e) =>
                  handleChange('delivery_fee', e.target.value)
                }
              />
            </div>

            {/* Min Order Amount */}
            <div>
              <label
                className="mb-1.5 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Minimum Order Amount (Rs.)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="500"
                value={settings.min_order_amount}
                onChange={(e) =>
                  handleChange('min_order_amount', e.target.value)
                }
              />
            </div>

            {/* Delivery Time */}
            <div>
              <label
                className="mb-1.5 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Estimated Delivery Time
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="30-45 mins"
                value={settings.delivery_time}
                onChange={(e) =>
                  handleChange('delivery_time', e.target.value)
                }
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="spinner h-5 w-5" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2
            className="mb-5 flex items-center gap-2 text-lg font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            <FiLock size={20} className="text-primary-600" />
            Change Password
          </h2>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label
                className="mb-1.5 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {showCurrentPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label
                className="mb-1.5 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {showNewPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                className="mb-1.5 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Confirm New Password
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Change Password Button */}
            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChangingPassword ? (
                <>
                  <div className="spinner h-5 w-5" />
                  <span>Changing...</span>
                </>
              ) : (
                <>
                  <FiLock size={16} />
                  <span>Change Password</span>
                </>
              )}
            </button>

            {/* Password Tips */}
            <div
              className="rounded-xl p-3"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                🔒 Password Tips:
              </p>
              <ul
                className="mt-1 list-inside list-disc space-y-0.5 text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                <li>At least 6 characters long</li>
                <li>Use a mix of letters and numbers</li>
                <li>Don&apos;t share your password with anyone</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;