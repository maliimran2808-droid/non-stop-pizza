'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Voucher } from '@/types';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiTag,
  FiPercent,
  FiDollarSign,
  FiClock,
  FiCheck,
  FiAlertCircle,
  FiGift,
  FiCalendar,
  FiUsers,
  FiEye,
  FiScissors,
} from 'react-icons/fi';

interface VoucherForm {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  min_order_amount: string;
  max_discount: string;
  usage_limit: string;
  is_active: boolean;
  expires_at: string;
}

const initialForm: VoucherForm = {
  code: '', description: '', discount_type: 'percentage', discount_value: '',
  min_order_amount: '0', max_discount: '', usage_limit: '', is_active: true, expires_at: '',
};

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const ITEMS_PER_PAGE = 12;

const AdminVouchersPage = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VoucherForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  // Drawer
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, totalRedeemed: 0 });

  useEffect(() => { fetchVouchers(); }, []);

  const fetchVouchers = async () => {
    try {
      const { data } = await supabase.from('vouchers').select('*').order('created_at', { ascending: false });
      if (data) {
        setVouchers(data);
        const now = new Date();
        setStats({
          total: data.length,
          active: data.filter(v => v.is_active && (!v.expires_at || new Date(v.expires_at) > now)).length,
          expired: data.filter(v => v.expires_at && new Date(v.expires_at) < now).length,
          totalRedeemed: data.reduce((sum, v) => sum + v.used_count, 0),
        });
      }
    } catch (err) { console.error('Fetch error:', err); }
    setIsLoading(false);
    setTimeout(() => { gsap.fromTo('.vouch-el', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out' }); }, 100);
  };

  const handleFormChange = (field: keyof VoucherForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const generateCode = () => {
    if (form.description.trim()) {
      // Generate from description: "20% off all orders" → "20OFF"
      const words = form.description.toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
      let code = words.slice(0, 3).join('').slice(0, 10);
      setForm(prev => ({ ...prev, code }));
    } else if (form.discount_value) {
      // Generate from discount value
      const type = form.discount_type === 'percentage' ? 'OFF' : 'FLAT';
      const code = `${form.discount_value}${type}`;
      setForm(prev => ({ ...prev, code }));
    } else {
      // Fallback: simple random
      const num = Math.floor(Math.random() * 999);
      setForm(prev => ({ ...prev, code: `SAVE${num}` }));
    }
  };

  const openAddModal = () => {
    setForm(initialForm); setIsEditing(false); setEditingId(null); setIsModalOpen(true);
  };

  const openEditModal = (voucher: Voucher) => {
    setForm({
      code: voucher.code, description: voucher.description || '',
      discount_type: voucher.discount_type, discount_value: voucher.discount_value.toString(),
      min_order_amount: voucher.min_order_amount.toString(),
      max_discount: voucher.max_discount?.toString() || '',
      usage_limit: voucher.usage_limit?.toString() || '',
      is_active: voucher.is_active,
      expires_at: voucher.expires_at ? new Date(voucher.expires_at).toISOString().slice(0, 16) : '',
    });
    setIsEditing(true); setEditingId(voucher.id); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error('Code required'); return; }
    if (!form.discount_value || Number(form.discount_value) <= 0) { toast.error('Discount required'); return; }
    if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) { toast.error('Max 100%'); return; }

    setIsSaving(true);
    try {
      const data = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: Number(form.min_order_amount) || 0,
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        is_active: form.is_active,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && editingId) {
        await supabase.from('vouchers').update(data).eq('id', editingId);
        toast.success('Voucher updated! ✅');
      } else {
        await supabase.from('vouchers').insert(data);
        toast.success('Voucher created! 🎟️');
      }
      setIsModalOpen(false); fetchVouchers();
    } catch (err: any) {
      if (err.code === '23505') toast.error('Code exists');
      else toast.error('Save failed');
    }
    setIsSaving(false);
  };

  const handleDelete = async (voucher: Voucher) => {
    if (!confirm(`Delete "${voucher.code}"?`)) return;
    try {
      await supabase.from('vouchers').delete().eq('id', voucher.id);
      setVouchers(prev => prev.filter(v => v.id !== voucher.id));
      if (selectedVoucher?.id === voucher.id) closeDrawer();
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const toggleActive = async (voucher: Voucher) => {
    try {
      await supabase.from('vouchers').update({ is_active: !voucher.is_active, updated_at: new Date().toISOString() }).eq('id', voucher.id);
      setVouchers(prev => prev.map(v => v.id === voucher.id ? { ...v, is_active: !v.is_active } : v));
      toast.success(`${!voucher.is_active ? 'Activated' : 'Deactivated'}`);
    } catch { toast.error('Failed'); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`"${code}" copied!`);
  };

  // Drawer
  const openDrawer = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setIsDrawerOpen(true);
    setTimeout(() => { if (drawerRef.current) gsap.fromTo(drawerRef.current, { x: '100%' }, { x: '0%', duration: 0.4, ease: 'power3.out' }); }, 10);
  };

  const closeDrawer = () => {
    if (drawerRef.current) gsap.to(drawerRef.current, { x: '100%', duration: 0.3, ease: 'power3.in', onComplete: () => { setIsDrawerOpen(false); setSelectedVoucher(null); } });
  };

  // Helpers
  const isExpired = (v: Voucher) => v.expires_at ? new Date(v.expires_at) < new Date() : false;
  const isLimitReached = (v: Voucher) => v.usage_limit ? v.used_count >= v.usage_limit : false;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  const getVoucherStatus = (v: Voucher) => {
    if (isExpired(v)) return { label: 'Expired', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
    if (isLimitReached(v)) return { label: 'Limit Reached', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
    if (!v.is_active) return { label: 'Inactive', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' };
    return { label: 'Active', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' };
  };
  const getUsagePercentage = (v: Voucher) => v.usage_limit ? Math.min(Math.round((v.used_count / v.usage_limit) * 100), 100) : 0;

  // Filter
  const filtered = vouchers.filter(v => {
    const matchSearch = v.code.toLowerCase().includes(searchQuery.toLowerCase()) || (v.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' && v.is_active && !isExpired(v)) || (filterStatus === 'expired' && isExpired(v)) || (filterStatus === 'inactive' && !v.is_active);
    const matchType = filterType === 'all' || v.discount_type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, filterType]);

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="spinner h-8 w-8" style={{ borderColor: '#E8002D', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 vouch-el">
        <div>
          <h1 className="text-3xl font-semibold text-white">
            Vouchers
            <span className="ml-1 inline-block h-1 w-8 rounded-full" style={{ backgroundColor: '#E8002D' }} />
          </h1>
          <p className="mt-1 text-sm font-normal text-gray-500">{stats.active} Vouchers Active</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: '#E8002D' }}>
          <FiPlus size={16} /> Create New Voucher
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 vouch-el">
        {[
          { label: 'Total Vouchers', value: stats.total, color: '#E8002D', icon: FiTag },
          { label: 'Active', value: stats.active, color: '#22C55E', icon: FiCheck },
          { label: 'Expired', value: stats.expired, color: '#EF4444', icon: FiClock },
          { label: 'Total Redeemed', value: stats.totalRedeemed, color: '#3B82F6', icon: FiUsers },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4" style={{ ...glassStyle }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <p className="mt-3 text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-jetbrains)' }}>{s.value}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 vouch-el">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5" style={{ ...glassStyle, minWidth: '200px' }}>
          <FiSearch size={14} className="text-gray-500" />
          <input type="text" placeholder="Search voucher code, name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-gray-600" />
        </div>
        {[
          { value: filterStatus, onChange: setFilterStatus, options: [{ v: 'all', l: 'All Status' }, { v: 'active', l: '✅ Active' }, { v: 'expired', l: '⏰ Expired' }, { v: 'inactive', l: '❌ Inactive' }] },
          { value: filterType, onChange: setFilterType, options: [{ v: 'all', l: 'All Types' }, { v: 'percentage', l: '% Percentage' }, { v: 'fixed', l: '💵 Fixed' }] },
        ].map((f, i) => (
          <div key={i} className="relative">
            <select value={f.value} onChange={e => f.onChange(e.target.value)} className="appearance-none rounded-xl px-4 py-2.5 pr-8 text-xs font-medium text-white outline-none" style={{ ...glassStyle }}>
              {f.options.map(o => <option key={o.v} value={o.v} style={{ backgroundColor: '#111' }}>{o.l}</option>)}
            </select>
            <FiChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        ))}
      </div>

      {/* Voucher Cards Grid */}
      {paginated.length === 0 ? (
        <div className="rounded-xl py-20 text-center vouch-el" style={{ ...glassStyle }}>
          <FiTag size={40} className="mx-auto" style={{ color: 'rgba(232,0,45,0.3)' }} />
          <p className="mt-4 text-lg font-semibold text-gray-400">No vouchers found</p>
          <p className="mt-1 text-sm font-light text-gray-600">Create your first voucher to start offering discounts</p>
          <button onClick={openAddModal} className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>Create Voucher</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 vouch-el">
          {paginated.map(voucher => {
            const status = getVoucherStatus(voucher);
            const usage = getUsagePercentage(voucher);

            return (
              <div
                key={voucher.id}
                className="group relative overflow-hidden rounded-xl transition-all hover:shadow-lg hover:shadow-red-500/5"
                style={{ ...glassStyle }}
              >
                {/* Ticket Dashed Divider */}
                <div className="absolute bottom-0 left-16 top-0 flex items-center" style={{ borderLeft: '2px dashed rgba(232,0,45,0.3)' }}>
                  <div className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full" style={{ backgroundColor: '#0A0A0A' }} />
                  <div className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full" style={{ backgroundColor: '#0A0A0A' }} />
                  <FiScissors size={10} className="absolute -left-[5px] top-1/2 -translate-y-1/2 rotate-90" style={{ color: 'rgba(232,0,45,0.4)' }} />
                </div>

                {/* Status Badge */}
                <div className="absolute right-3 top-3">
                  <span className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase" style={{ backgroundColor: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                </div>

                <div className="flex">
                  {/* Left — Discount */}
                  <div className="flex w-16 flex-shrink-0 flex-col items-center justify-center py-5" style={{ backgroundColor: 'rgba(232,0,45,0.05)' }}>
                    <span className="text-lg font-bold" style={{ color: '#E8002D', fontFamily: 'var(--font-jetbrains)' }}>
                      {voucher.discount_type === 'percentage' ? `${voucher.discount_value}%` : `Rs.${voucher.discount_value}`}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500">OFF</span>
                  </div>

                  {/* Right — Details */}
                  <div className="flex-1 p-4 pl-6">
                    {/* Code */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold tracking-wider text-white" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                        {voucher.code}
                      </span>
                      <button onClick={() => copyCode(voucher.code)} className="text-gray-500 transition-all hover:text-white">
                        <FiCopy size={12} />
                      </button>
                    </div>

                    {/* Description */}
                    {voucher.description && (
                      <p className="mt-1 line-clamp-1 text-[11px] font-light text-gray-500">{voucher.description}</p>
                    )}

                    {/* Details */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Number(voucher.min_order_amount) > 0 && (
                        <span className="rounded-md px-1.5 py-0.5 text-[9px] font-medium text-gray-400" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          Min. Rs. {Number(voucher.min_order_amount).toLocaleString()}
                        </span>
                      )}
                      {voucher.expires_at && (
                        <span className="rounded-md px-1.5 py-0.5 text-[9px] font-medium text-gray-400" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          Until {formatDate(voucher.expires_at)}
                        </span>
                      )}
                    </div>

                    {/* Usage Bar */}
                    {voucher.usage_limit && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>Used {voucher.used_count} / {voucher.usage_limit}</span>
                          <span style={{ fontFamily: 'var(--font-jetbrains)' }}>{usage}%</span>
                        </div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${usage}%`, backgroundColor: '#E8002D' }} />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => openDrawer(voucher)} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold text-white transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        <FiEye size={10} /> View
                      </button>
                      <button onClick={() => openEditModal(voucher)} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold text-white transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        <FiEdit2 size={10} /> Edit
                      </button>
                      <button onClick={() => handleDelete(voucher)} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-red-400 transition-all hover:bg-red-500/10" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                        <FiTrash2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > ITEMS_PER_PAGE && (
        <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 vouch-el" style={{ ...glassStyle }}>
          <p className="text-xs text-gray-500">Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 disabled:opacity-30"><FiChevronLeft size={14} /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5) { if (currentPage <= 3) page = i + 1; else if (currentPage >= totalPages - 2) page = totalPages - 4 + i; else page = currentPage - 2 + i; }
              return <button key={page} onClick={() => setCurrentPage(page)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${currentPage === page ? 'text-white' : 'text-gray-500 hover:bg-white/5'}`} style={currentPage === page ? { backgroundColor: '#E8002D' } : {}}>{page}</button>;
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 disabled:opacity-30"><FiChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {/* Voucher Detail Drawer */}
      {isDrawerOpen && selectedVoucher && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={closeDrawer} />
          <div ref={drawerRef} className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto shadow-2xl sm:w-[420px]" style={{ backgroundColor: '#0F0F0F', borderLeft: '1px solid rgba(255,255,255,0.07)', transform: 'translateX(100%)' }}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: '#0F0F0F', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="text-lg font-semibold text-white">Voucher Details</h2>
              <button onClick={closeDrawer} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-white"><FiX size={18} /></button>
            </div>

            <div className="space-y-5 p-5">
              {/* Code */}
              <div className="rounded-xl p-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(232,0,45,0.1), rgba(0,0,0,0))' }}>
                <p className="text-3xl font-bold tracking-widest text-white" style={{ fontFamily: 'var(--font-jetbrains)' }}>{selectedVoucher.code}</p>
                <button onClick={() => copyCode(selectedVoucher.code)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium" style={{ color: '#E8002D' }}>
                  <FiCopy size={12} /> Copy Code
                </button>
                <p className="mt-3 text-2xl font-bold" style={{ color: '#E8002D' }}>
                  {selectedVoucher.discount_type === 'percentage' ? `${selectedVoucher.discount_value}% OFF` : `Rs. ${Number(selectedVoucher.discount_value).toLocaleString()} OFF`}
                </p>
              </div>

              {/* Usage Gauge */}
              {selectedVoucher.usage_limit && (
                <div className="rounded-xl p-5 text-center" style={{ ...glassStyle }}>
                  <div className="relative mx-auto h-24 w-24">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#E8002D" strokeWidth="6" strokeDasharray={`${getUsagePercentage(selectedVoucher) * 2.64} 264`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-jetbrains)' }}>{getUsagePercentage(selectedVoucher)}%</p>
                      <p className="text-[8px] text-gray-500">USED</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">{selectedVoucher.used_count} of {selectedVoucher.usage_limit} uses</p>
                </div>
              )}

              {/* Details */}
              <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Details</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Type', value: selectedVoucher.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount' },
                    { label: 'Value', value: selectedVoucher.discount_type === 'percentage' ? `${selectedVoucher.discount_value}%` : `Rs. ${Number(selectedVoucher.discount_value).toLocaleString()}` },
                    Number(selectedVoucher.min_order_amount) > 0 ? { label: 'Min Order', value: `Rs. ${Number(selectedVoucher.min_order_amount).toLocaleString()}` } : null,
                    selectedVoucher.max_discount ? { label: 'Max Discount', value: `Rs. ${Number(selectedVoucher.max_discount).toLocaleString()}` } : null,
                    { label: 'Status', value: getVoucherStatus(selectedVoucher).label },
                    selectedVoucher.expires_at ? { label: 'Expires', value: formatDate(selectedVoucher.expires_at) } : null,
                    { label: 'Created', value: formatDate(selectedVoucher.created_at) },
                  ].filter(Boolean).map((item: any, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className="text-xs font-semibold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedVoucher.description && (
                <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Description</p>
                  <p className="text-sm text-gray-400">{selectedVoucher.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => { closeDrawer(); setTimeout(() => openEditModal(selectedVoucher), 400); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <FiEdit2 size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(selectedVoucher)} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                  <FiTrash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.07)', maxHeight: '90vh' }}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? 'Edit Voucher' : 'Create Voucher'}
                  <span className="ml-1 inline-block h-0.5 w-6 rounded-full" style={{ backgroundColor: '#E8002D' }} />
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-white"><FiX size={20} /></button>
              </div>

              <div className="space-y-4">
                {/* Code */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Voucher Code *</label>
                  <div className="flex gap-2">
                    <input type="text" className="flex-1 rounded-xl border-none px-4 py-2.5 text-sm uppercase text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="SAVE20" value={form.code} onChange={e => handleFormChange('code', e.target.value.toUpperCase())} />
                    <button onClick={generateCode} className="rounded-xl px-3 text-xs font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>Generate</button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Description</label>
                  <input type="text" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="20% off on all orders" value={form.description} onChange={e => handleFormChange('description', e.target.value)} />
                </div>

                {/* Discount Type + Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Type *</label>
                    <div className="flex gap-2">
                      {[{ v: 'percentage' as const, l: '% Percent' }, { v: 'fixed' as const, l: 'Rs. Fixed' }].map(t => (
                        <button key={t.v} onClick={() => handleFormChange('discount_type', t.v)} className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all ${form.discount_type === t.v ? 'text-white' : 'text-gray-500'}`}
                          style={form.discount_type === t.v ? { backgroundColor: '#E8002D' } : { ...glassStyle }}>{t.l}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Value *</label>
                    <input type="number" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder={form.discount_type === 'percentage' ? '20' : '200'} value={form.discount_value} onChange={e => handleFormChange('discount_value', e.target.value)} />
                  </div>
                </div>

                {/* Min Order + Max Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Min Order (Rs.)</label>
                    <input type="number" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="0" value={form.min_order_amount} onChange={e => handleFormChange('min_order_amount', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Max Discount (Rs.)</label>
                    <input type="number" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="No limit" value={form.max_discount} onChange={e => handleFormChange('max_discount', e.target.value)} />
                  </div>
                </div>

                {/* Usage Limit + Expiry */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Usage Limit</label>
                    <input type="number" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="Unlimited" value={form.usage_limit} onChange={e => handleFormChange('usage_limit', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Expires At</label>
                    <input type="datetime-local" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none" style={{ ...glassStyle, colorScheme: 'dark' }} value={form.expires_at} onChange={e => handleFormChange('expires_at', e.target.value)} />
                  </div>
                </div>

                {/* Active */}
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.is_active} onChange={e => handleFormChange('is_active', e.target.checked)} className="h-4 w-4 rounded accent-red-600" />
                  <span className="text-xs font-medium text-gray-400">✅ Active</span>
                </label>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-400 transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={handleSave} disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8002D' }}>
                    {isSaving ? <><div className="spinner h-4 w-4" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> Saving...</> : isEditing ? 'Update Voucher' : 'Save Voucher'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminVouchersPage;