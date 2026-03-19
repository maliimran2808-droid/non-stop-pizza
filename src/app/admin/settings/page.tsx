'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { supabaseAdmin } from '@/lib/supabase-server';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import {
  FiSave, FiSettings, FiLock, FiEye, FiEyeOff, FiUser, FiBell,
  FiTruck, FiShield, FiGlobe, FiAlertTriangle, FiMonitor, FiMail,
} from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaTwitter, FaTiktok, FaYoutube, FaWhatsapp } from 'react-icons/fa';

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const navItems = [
  { id: 'general', label: 'General', icon: FiSettings },
  { id: 'profile', label: 'Profile & Password', icon: FiUser },
  { id: 'notifications', label: 'Notifications', icon: FiBell },
  { id: 'delivery', label: 'Delivery', icon: FiTruck },
  { id: 'security', label: 'Security', icon: FiShield },
  { id: 'social', label: 'Social Media', icon: FiGlobe },
  { id: 'danger', label: 'Danger Zone', icon: FiAlertTriangle },
];

const AdminSettingsPage = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  // General
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantTagline, setRestaurantTagline] = useState('');
  const [restaurantPhone, setRestaurantPhone] = useState('');
  const [restaurantEmail, setRestaurantEmail] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Notifications
  const [emailNewOrder, setEmailNewOrder] = useState(true);
  const [emailCancelled, setEmailCancelled] = useState(true);
  const [emailComplaint, setEmailComplaint] = useState(true);
  const [emailLowStock, setEmailLowStock] = useState(false);
  const [pushNewOrder, setPushNewOrder] = useState(true);
  const [pushCancelled, setPushCancelled] = useState(false);

  // Delivery
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [delFee, setDelFee] = useState('150');
  const [delTime, setDelTime] = useState('30-45 mins');
  const [delRadius, setDelRadius] = useState('10');
  const [freeDelEnabled, setFreeDelEnabled] = useState(false);
  const [freeDelAbove, setFreeDelAbove] = useState('');

  // Social
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Danger
  const [dangerAction, setDangerAction] = useState<string | null>(null);
  const [dangerConfirm, setDangerConfirm] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('site_settings').select('*');
      if (data) {
        const m: Record<string, string> = {};
        data.forEach(item => { m[item.key] = item.value; });

        setRestaurantName(m.restaurant_name || '');
        setRestaurantTagline(m.restaurant_tagline || '');
        setRestaurantPhone(m.restaurant_phone || '');
        setRestaurantEmail(m.restaurant_email || '');
        setRestaurantAddress(m.restaurant_address || '');
        setDeliveryFee(m.delivery_fee || '');
        setMinOrderAmount(m.min_order_amount || '');
        setDeliveryTime(m.delivery_time || '');
        setDelFee(m.delivery_fee || '150');
        setDelTime(m.delivery_time || '30-45 mins');
        setDelRadius(m.delivery_radius || '10');
        setDeliveryEnabled(m.delivery_enabled !== 'false');
        setFreeDelEnabled(m.free_delivery_enabled === 'true');
        setFreeDelAbove(m.free_delivery_above || '');
        setFacebook(m.social_facebook || '');
        setInstagram(m.social_instagram || '');
        setTwitter(m.social_twitter || '');
        setTiktok(m.social_tiktok || '');
        setYoutube(m.social_youtube || '');
        setWhatsapp(m.social_whatsapp || '');
      }
    } catch (err) { console.error('Settings error:', err); }
       // Fetch admin info
    try {
      const res = await fetch('/api/admin/verify');
      const adminData = await res.json();
      if (adminData.admin?.name) setAdminName(adminData.admin.name);
      if (adminData.admin?.email) { setAdminEmail(adminData.admin.email); setNewEmail(adminData.admin.email); }
    } catch { }

    setIsLoading(false);
    setTimeout(() => { gsap.fromTo('.set-el', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out' }); }, 100);
  };

  const saveSetting = async (key: string, value: string) => {
    const { data } = await supabase.from('site_settings').select('id').eq('key', key).single();
    if (data) await supabase.from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
    else await supabase.from('site_settings').insert({ key, value });
  };

  // Save General
  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      await saveSetting('restaurant_name', restaurantName);
      await saveSetting('restaurant_tagline', restaurantTagline);
      await saveSetting('restaurant_phone', restaurantPhone);
      await saveSetting('restaurant_email', restaurantEmail);
      await saveSetting('restaurant_address', restaurantAddress);
      await saveSetting('delivery_fee', deliveryFee);
      await saveSetting('min_order_amount', minOrderAmount);
      await saveSetting('delivery_time', deliveryTime);
      toast.success('General settings saved! ✅');
    } catch { toast.error('Failed to save'); }
    setIsSaving(false);
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!currentPassword) { toast.error('Enter current password'); return; }
    if (newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setIsChangingPw(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); setIsChangingPw(false); return; }
      toast.success('Password changed! 🔒');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch { toast.error('Error'); }
    setIsChangingPw(false);
  };
  // Change Name
  const handleChangeName = async () => {
    if (!adminName.trim()) { toast.error('Name required'); return; }
    setIsSavingName(true);
    try {
      const res = await fetch('/api/admin/change-name', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: adminName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); setIsSavingName(false); return; }
      toast.success('Name updated! Refresh to see changes in sidebar.');
    } catch { toast.error('Error'); }
    setIsSavingName(false);
  };
    // Change Email
  const handleChangeEmail = async () => {
    if (!newEmail.trim()) { toast.error('Email required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { toast.error('Enter a valid email'); return; }
    if (!emailPassword) { toast.error('Enter your password to confirm'); return; }
    if (newEmail.toLowerCase() === adminEmail.toLowerCase()) { toast.error('This is already your email'); return; }

    setIsSavingEmail(true);
    try {
      const res = await fetch('/api/admin/change-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim(), password: emailPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); setIsSavingEmail(false); return; }
      toast.success('Email updated! Use new email to login next time.');
      setAdminEmail(data.email);
      setEmailPassword('');
    } catch { toast.error('Error'); }
    setIsSavingEmail(false);
  };
  // Save Delivery
  const handleSaveDelivery = async () => {
    setIsSaving(true);
    try {
      await saveSetting('delivery_enabled', deliveryEnabled.toString());
      await saveSetting('delivery_fee', delFee);
      await saveSetting('delivery_time', delTime);
      await saveSetting('delivery_radius', delRadius);
      await saveSetting('free_delivery_enabled', freeDelEnabled.toString());
      await saveSetting('free_delivery_above', freeDelAbove);
      toast.success('Delivery settings saved! ✅');
    } catch { toast.error('Failed'); }
    setIsSaving(false);
  };

  // Save Social
  const handleSaveSocial = async () => {
    setIsSaving(true);
    try {
      await saveSetting('social_facebook', facebook);
      await saveSetting('social_instagram', instagram);
      await saveSetting('social_twitter', twitter);
      await saveSetting('social_tiktok', tiktok);
      await saveSetting('social_youtube', youtube);
      await saveSetting('social_whatsapp', whatsapp);
      toast.success('Social links saved! ✅');
    } catch { toast.error('Failed'); }
    setIsSaving(false);
  };

  // Danger Zone Actions
    const handleDangerAction = async () => {

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/danger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: dangerAction }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Action failed');
        setIsSaving(false);
        return;
      }

      toast.success(data.message || 'Action completed! ✅');

      // Refresh settings if reset
      if (dangerAction === 'reset_settings') {
        fetchSettings();
      }
    } catch (err) {
      console.error('Danger error:', err);
      toast.error('Action failed');
    }

    setIsSaving(false);
    setDangerAction(null);
    setDangerConfirm('');
  };

  // Toggle Component
  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button onClick={onChange} className="relative h-6 w-11 flex-shrink-0 rounded-full transition-all" style={{ backgroundColor: enabled ? '#E8002D' : 'rgba(255,255,255,0.1)' }}>
      <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: enabled ? '22px' : '2px' }} />
      {enabled && <div className="absolute inset-0 animate-pulse rounded-full" style={{ backgroundColor: 'rgba(232,0,45,0.3)' }} />}
    </button>
  );

  // Input styles
  const inp = "w-full rounded-xl bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600";
  const inpStyle = { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' };
  const label = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500";

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="spinner h-8 w-8" style={{ borderColor: '#E8002D', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Header */}
      <div className="mb-6 set-el">
        <h1 className="text-3xl font-semibold text-white">
          Settings<span className="ml-1 inline-block h-1 w-8 rounded-full" style={{ backgroundColor: '#E8002D' }} />
        </h1>
        <p className="mt-1 text-sm text-gray-500">Manage your restaurant preferences and configurations</p>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 set-el">
        {/* Left Nav */}
        <div>
          <div className="sticky top-4 rounded-xl p-3" style={{ ...glassStyle }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${activeSection === item.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                style={activeSection === item.id ? { backgroundColor: 'rgba(232,0,45,0.08)' } : {}}>
                {activeSection === item.id && <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full" style={{ backgroundColor: '#E8002D' }} />}
                <item.icon size={16} className={activeSection === item.id ? 'text-red-500' : 'text-gray-600'} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3 space-y-6">

          {/* ============ GENERAL ============ */}
          {activeSection === 'general' && (
            <div className="rounded-xl p-5" style={{ ...glassStyle }}>
              <h3 className="mb-5 text-lg font-semibold text-white">General Settings</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className={label}>Restaurant Name</label><input className={inp} style={inpStyle} value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="NonStop Pizza" /></div>
                  <div><label className={label}>Tagline</label><input className={inp} style={inpStyle} value={restaurantTagline} onChange={e => setRestaurantTagline(e.target.value)} placeholder="Fresh & Hot!" /></div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className={label}>Phone</label><input className={inp} style={inpStyle} value={restaurantPhone} onChange={e => setRestaurantPhone(e.target.value)} placeholder="+92-XXX-XXXXXXX" /></div>
                  <div><label className={label}>Email</label><input className={inp} style={inpStyle} value={restaurantEmail} onChange={e => setRestaurantEmail(e.target.value)} placeholder="info@nonstoppizza.com" type="email" /></div>
                </div>
                <div><label className={label}>Address</label><input className={inp} style={inpStyle} value={restaurantAddress} onChange={e => setRestaurantAddress(e.target.value)} placeholder="123 Food Street, City" /></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div><label className={label}>Delivery Fee (Rs.)</label><input className={inp} style={inpStyle} value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} type="number" placeholder="150" /></div>
                  <div><label className={label}>Min Order (Rs.)</label><input className={inp} style={inpStyle} value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} type="number" placeholder="500" /></div>
                  <div><label className={label}>Delivery Time</label><input className={inp} style={inpStyle} value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} placeholder="30-45 mins" /></div>
                </div>
                <button onClick={handleSaveGeneral} disabled={isSaving} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8002D' }}>
                  {isSaving ? 'Saving...' : <><FiSave size={14} /> Save General Settings</>}
                </button>
              </div>
            </div>
          )}

          {/* ============ PROFILE ============ */}
          {/* ============ PROFILE ============ */}
                 {/* ============ PROFILE ============ */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              {/* Change Name */}
              <div className="rounded-xl p-5" style={{ ...glassStyle }}>
                <h3 className="mb-5 text-lg font-semibold text-white">Admin Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label className={label}>Admin Display Name</label>
                    <input className={inp} style={inpStyle} value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Your name" />
                  </div>
                  <button onClick={handleChangeName} disabled={isSavingName} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8002D' }}>
                    {isSavingName ? 'Saving...' : <><FiUser size={14} /> Update Name</>}
                  </button>
                </div>
              </div>

              {/* Change Email */}
              <div className="rounded-xl p-5" style={{ ...glassStyle }}>
                <h3 className="mb-5 text-lg font-semibold text-white">Change Login Email</h3>
                <div className="space-y-4">
                  <div>
                    <label className={label}>Current Email</label>
                    <div className="rounded-xl px-4 py-2.5 text-sm text-gray-400" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {adminEmail || 'Loading...'}
                    </div>
                  </div>
                  <div>
                    <label className={label}>New Email</label>
                    <input type="email" className={inp} style={inpStyle} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="newemail@example.com" />
                  </div>
                  <div>
                    <label className={label}>Confirm with Password</label>
                    <div className="relative">
                      <input type={showEmailPassword ? 'text' : 'password'} className={`${inp} pr-12`} style={inpStyle} value={emailPassword} onChange={e => setEmailPassword(e.target.value)} placeholder="Enter your current password" />
                      <button onClick={() => setShowEmailPassword(!showEmailPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showEmailPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button>
                    </div>
                    <p className="mt-1 text-[10px] text-gray-600">Password required to verify your identity</p>
                  </div>
                  <button onClick={handleChangeEmail} disabled={isSavingEmail} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8002D' }}>
                    {isSavingEmail ? 'Saving...' : <><FiMail size={14} /> Update Email</>}
                  </button>
                </div>
              </div>

              {/* Change Password */}
              <div className="rounded-xl p-5" style={{ ...glassStyle }}>
                <h3 className="mb-5 text-lg font-semibold text-white">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className={label}>Current Password</label>
                    <div className="relative">
                      <input type={showCurrent ? 'text' : 'password'} className={`${inp} pr-12`} style={inpStyle} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                      <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button>
                    </div>
                  </div>
                  <div>
                    <label className={label}>New Password</label>
                    <div className="relative">
                      <input type={showNew ? 'text' : 'password'} className={`${inp} pr-12`} style={inpStyle} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                      <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button>
                    </div>
                  </div>
                  <div>
                    <label className={label}>Confirm New Password</label>
                    <input type="password" className={inp} style={inpStyle} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
                    {confirmPassword && newPassword !== confirmPassword && <p className="mt-1 text-xs text-red-500">Passwords don&apos;t match</p>}
                  </div>
                  <button onClick={handleChangePassword} disabled={isChangingPw} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8002D' }}>
                    {isChangingPw ? 'Changing...' : <><FiLock size={14} /> Change Password</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============ NOTIFICATIONS ============ */}
          {activeSection === 'notifications' && (
            <div className="rounded-xl p-5" style={{ ...glassStyle }}>
              <h3 className="mb-5 text-lg font-semibold text-white">Notification Preferences</h3>
              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-sm font-semibold text-white">📧 Email Notifications</p>
                  {[
                    { label: 'New Order Received', enabled: emailNewOrder, set: setEmailNewOrder },
                    { label: 'Order Cancelled', enabled: emailCancelled, set: setEmailCancelled },
                    { label: 'New Complaint', enabled: emailComplaint, set: setEmailComplaint },
                    { label: 'Low Stock Alert', enabled: emailLowStock, set: setEmailLowStock },
                  ].map((n, i) => (
                    <div key={i} className="mb-2 flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-sm text-gray-400">{n.label}</span>
                      <Toggle enabled={n.enabled} onChange={() => n.set(!n.enabled)} />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="mb-3 text-sm font-semibold text-white">🔔 Push Notifications</p>
                  {[
                    { label: 'New Order Received', enabled: pushNewOrder, set: setPushNewOrder },
                    { label: 'Order Cancelled', enabled: pushCancelled, set: setPushCancelled },
                  ].map((n, i) => (
                    <div key={i} className="mb-2 flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-sm text-gray-400">{n.label}</span>
                      <Toggle enabled={n.enabled} onChange={() => n.set(!n.enabled)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============ DELIVERY ============ */}
          {activeSection === 'delivery' && (
            <div className="rounded-xl p-5" style={{ ...glassStyle }}>
              <h3 className="mb-5 text-lg font-semibold text-white">Delivery Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-sm font-medium text-white">Enable Delivery</span>
                  <Toggle enabled={deliveryEnabled} onChange={() => setDeliveryEnabled(!deliveryEnabled)} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div><label className={label}>Delivery Fee (Rs.)</label><input className={inp} style={inpStyle} value={delFee} onChange={e => setDelFee(e.target.value)} type="number" /></div>
                  <div><label className={label}>Estimated Time</label><input className={inp} style={inpStyle} value={delTime} onChange={e => setDelTime(e.target.value)} /></div>
                  <div><label className={label}>Radius (km)</label><input className={inp} style={inpStyle} value={delRadius} onChange={e => setDelRadius(e.target.value)} type="number" /></div>
                </div>
                <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-sm text-gray-400">Free delivery above amount</span>
                  <Toggle enabled={freeDelEnabled} onChange={() => setFreeDelEnabled(!freeDelEnabled)} />
                </div>
                {freeDelEnabled && (
                  <div><label className={label}>Free Delivery Above (Rs.)</label><input className={inp} style={inpStyle} value={freeDelAbove} onChange={e => setFreeDelAbove(e.target.value)} type="number" placeholder="1000" /></div>
                )}
                <button onClick={handleSaveDelivery} disabled={isSaving} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8002D' }}>
                  {isSaving ? 'Saving...' : <><FiSave size={14} /> Save Delivery Settings</>}
                </button>
              </div>
            </div>
          )}

          {/* ============ SECURITY ============ */}
          {activeSection === 'security' && (
            <div className="rounded-xl p-5" style={{ ...glassStyle }}>
              <h3 className="mb-5 text-lg font-semibold text-white">Security Settings</h3>
              <div className="space-y-4">
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-sm font-semibold text-white">🔐 Two-Factor Authentication</p>
                  <p className="mt-1 text-xs text-gray-500">Add an extra layer of security. When enabled, you&apos;ll need a verification code in addition to your password.</p>
                  <button className="mt-3 rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>Enable 2FA</button>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-sm font-semibold text-white">🖥️ Active Sessions</p>
                  <div className="mt-3 flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2"><FiMonitor size={14} className="text-green-500" /><span className="text-xs text-gray-400">Current Session — This Device</span></div>
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-bold text-green-500">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ SOCIAL ============ */}
          {activeSection === 'social' && (
            <div className="rounded-xl p-5" style={{ ...glassStyle }}>
              <h3 className="mb-5 text-lg font-semibold text-white">Social Media Links</h3>
              <p className="mb-4 text-xs text-gray-500">These links will appear in the footer of your website.</p>
              <div className="space-y-4">
                {[
                  { label: 'Facebook', icon: FaFacebookF, value: facebook, set: setFacebook, ph: 'https://facebook.com/yourpage' },
                  { label: 'Instagram', icon: FaInstagram, value: instagram, set: setInstagram, ph: 'https://instagram.com/yourpage' },
                  { label: 'Twitter / X', icon: FaTwitter, value: twitter, set: setTwitter, ph: 'https://x.com/yourpage' },
                  { label: 'TikTok', icon: FaTiktok, value: tiktok, set: setTiktok, ph: 'https://tiktok.com/@yourpage' },
                  { label: 'YouTube', icon: FaYoutube, value: youtube, set: setYoutube, ph: 'https://youtube.com/yourchannel' },
                  { label: 'WhatsApp', icon: FaWhatsapp, value: whatsapp, set: setWhatsapp, ph: '+92XXXXXXXXXX' },
                ].map((s, i) => (
                  <div key={i}>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
                      <s.icon size={12} style={{ color: '#E8002D' }} /> {s.label}
                    </label>
                    <input className={inp} style={inpStyle} value={s.value} onChange={e => s.set(e.target.value)} placeholder={s.ph} />
                  </div>
                ))}
                <button onClick={handleSaveSocial} disabled={isSaving} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8002D' }}>
                  {isSaving ? 'Saving...' : <><FiSave size={14} /> Save Social Links</>}
                </button>
              </div>
            </div>
          )}

          {/* ============ DANGER ZONE ============ */}
          {activeSection === 'danger' && (
            <div className="rounded-xl p-5" style={{ ...glassStyle, borderColor: 'rgba(232,0,45,0.3)' }}>
              <h3 className="mb-2 text-lg font-semibold text-red-500">⚠️ Danger Zone</h3>
              <p className="mb-5 text-sm text-gray-500">These actions are irreversible. Proceed with extreme caution.</p>
              <div className="space-y-3">
                {[
                  { action: 'clear_orders', label: 'Clear All Orders', desc: 'Permanently delete all order records and order items' },
                  { action: 'clear_complaints', label: 'Clear All Complaints', desc: 'Remove all complaints permanently' },
                  { action: 'clear_vouchers', label: 'Clear All Vouchers', desc: 'Delete all voucher codes' },
                  { action: 'reset_settings', label: 'Reset All Settings', desc: 'Revert all settings to default values' },
                ].map(item => (
                  <div key={item.action} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                    <button onClick={() => setDangerAction(item.action)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/10" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
                      Execute
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Modal */}
            {dangerAction && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => { setDangerAction(null); setDangerConfirm(''); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl" style={{ backgroundColor: '#111111', border: '1px solid rgba(232,0,45,0.3)' }} onClick={e => e.stopPropagation()}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                <FiAlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-white">Are you sure?</h3>
              <p className="mt-2 text-sm text-gray-500">This action is <strong className="text-red-400">permanent</strong> and cannot be undone.</p>
              <p className="mt-2 text-sm text-gray-500">Type <strong className="text-red-400">CONFIRM</strong> below to proceed.</p>
              
              <input
                type="text"
                value={dangerConfirm}
                onChange={e => setDangerConfirm(e.target.value.toUpperCase())}
                placeholder="Type CONFIRM"
                autoFocus
                className="mt-4 w-full rounded-xl bg-transparent px-4 py-2.5 text-center text-sm uppercase text-white outline-none placeholder:text-gray-600"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              />

              {/* Show what user typed */}
              <p className="mt-2 text-[10px] text-gray-600">
                {dangerConfirm.length > 0 ? (
                  dangerConfirm.trim() === 'CONFIRM' ? (
                    <span className="text-green-500">✅ Ready to proceed</span>
                  ) : (
                    <span className="text-yellow-500">Keep typing: {dangerConfirm}/CONFIRM</span>
                  )
                ) : (
                  'Type CONFIRM to enable the button'
                )}
              </p>

              <div className="mt-5 flex gap-3">
                <button 
                  onClick={() => { setDangerAction(null); setDangerConfirm(''); }} 
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-gray-400 hover:bg-white/5" 
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (dangerConfirm.trim() === 'CONFIRM') {
                      handleDangerAction();
                    } else {
                      toast.error('Type CONFIRM first');
                    }
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all ${dangerConfirm.trim() === 'CONFIRM' ? 'opacity-100 hover:shadow-lg' : 'opacity-30 cursor-not-allowed'}`} 
                  style={{ backgroundColor: '#E8002D' }}
                >
                  <FiAlertTriangle size={14} /> Proceed
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSettingsPage;