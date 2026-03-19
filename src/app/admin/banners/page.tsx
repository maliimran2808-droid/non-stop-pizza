'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { BannerSlide } from '@/types';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiImage,
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiArrowUp,
  FiArrowDown,
  FiUpload,
  FiCheck,
  FiAlertCircle,
  FiLink,
  FiMonitor,
} from 'react-icons/fi';

interface BannerForm {
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
}

const initialForm: BannerForm = {
  title: '', subtitle: '', image_url: '', link_url: '', display_order: 0, is_active: true,
};

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const AdminBannersPage = () => {
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Preview
  const [previewBanner, setPreviewBanner] = useState<BannerSlide | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try {
      const { data } = await supabase.from('banner_slides').select('*').order('display_order', { ascending: true });
      if (data) {
        setBanners(data);
        setStats({
          total: data.length,
          active: data.filter(b => b.is_active).length,
          inactive: data.filter(b => !b.is_active).length,
        });
      }
    } catch (err) { console.error('Fetch error:', err); }
    setIsLoading(false);
    setTimeout(() => { gsap.fromTo('.ban-el', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out' }); }, 100);
  };

  const handleFormChange = (field: keyof BannerForm, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) { toast.error('Images only'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop();
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('banners').upload(name, file);
      if (error) throw error;
      return supabase.storage.from('banners').getPublicUrl(name).data.publicUrl;
    } catch { toast.error('Upload failed'); return null; }
  };

  const openAddModal = () => {
    setForm({ ...initialForm, display_order: banners.length + 1 });
    setImageFile(null); setImagePreview(null);
    setIsEditing(false); setEditingId(null); setIsModalOpen(true);
  };

  const openEditModal = (banner: BannerSlide) => {
    setForm({
      title: banner.title || '', subtitle: banner.subtitle || '',
      image_url: banner.image_url, link_url: banner.link_url || '',
      display_order: banner.display_order, is_active: banner.is_active,
    });
    setImageFile(null); setImagePreview(banner.image_url || null);
    setIsEditing(true); setEditingId(banner.id); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!imagePreview && !form.image_url) { toast.error('Upload an image'); return; }
    setIsSaving(true);
    try {
      let imageUrl = form.image_url;
      if (imageFile) { const url = await uploadImage(imageFile); if (url) imageUrl = url; }

      const data = {
        title: form.title.trim() || null, subtitle: form.subtitle.trim() || null,
        image_url: imageUrl, link_url: form.link_url.trim() || null,
        display_order: form.display_order, is_active: form.is_active,
      };

      if (isEditing && editingId) {
        await supabase.from('banner_slides').update(data).eq('id', editingId);
        toast.success('Banner updated! ✅');
      } else {
        await supabase.from('banner_slides').insert(data);
        toast.success('Banner added! 🖼️');
      }
      setIsModalOpen(false); fetchBanners();
    } catch { toast.error('Save failed'); }
    setIsSaving(false);
  };

  const handleDelete = async (banner: BannerSlide) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await supabase.from('banner_slides').delete().eq('id', banner.id);
      setBanners(prev => prev.filter(b => b.id !== banner.id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const toggleActive = async (banner: BannerSlide) => {
    try {
      await supabase.from('banner_slides').update({ is_active: !banner.is_active }).eq('id', banner.id);
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b));
      toast.success(`${!banner.is_active ? 'Activated' : 'Deactivated'}`);
    } catch { toast.error('Failed'); }
  };

  const moveBanner = async (id: string, direction: 'up' | 'down') => {
    const idx = banners.findIndex(b => b.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === banners.length - 1) return;

    const newBanners = [...banners];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = newBanners[idx].display_order;
    newBanners[idx].display_order = newBanners[swapIdx].display_order;
    newBanners[swapIdx].display_order = temp;
    [newBanners[idx], newBanners[swapIdx]] = [newBanners[swapIdx], newBanners[idx]];
    setBanners(newBanners);

    try {
      await supabase.from('banner_slides').update({ display_order: newBanners[idx].display_order }).eq('id', newBanners[idx].id);
      await supabase.from('banner_slides').update({ display_order: newBanners[swapIdx].display_order }).eq('id', newBanners[swapIdx].id);
    } catch { fetchBanners(); }
  };

  // Filter
  const filtered = banners.filter(b => {
    const matchSearch = (b.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (b.subtitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' && b.is_active) || (filterStatus === 'inactive' && !b.is_active);
    return matchSearch && matchStatus;
  });

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="spinner h-8 w-8" style={{ borderColor: '#E8002D', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 ban-el">
        <div>
          <h1 className="text-3xl font-semibold text-white">
            Banners
            <span className="ml-1 inline-block h-1 w-8 rounded-full" style={{ backgroundColor: '#E8002D' }} />
          </h1>
          <p className="mt-1 text-sm font-normal text-gray-500">Manage your website & app banners</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: '#E8002D' }}>
          <FiUpload size={16} /> Upload New Banner
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 ban-el">
        {[
          { label: 'Total Banners', value: stats.total, color: '#E8002D', icon: FiImage },
          { label: 'Active', value: stats.active, color: '#22C55E', icon: FiCheck },
          { label: 'Inactive', value: stats.inactive, color: '#EF4444', icon: FiAlertCircle },
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
      <div className="mb-4 flex flex-wrap items-center gap-3 ban-el">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5" style={{ ...glassStyle, minWidth: '200px' }}>
          <FiSearch size={14} className="text-gray-500" />
          <input type="text" placeholder="Search banners..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-gray-600" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none rounded-xl px-4 py-2.5 pr-8 text-xs font-medium text-white outline-none" style={{ ...glassStyle }}>
            <option value="all" style={{ backgroundColor: '#111' }}>All Status</option>
            <option value="active" style={{ backgroundColor: '#111' }}>✅ Active</option>
            <option value="inactive" style={{ backgroundColor: '#111' }}>❌ Inactive</option>
          </select>
          <FiChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* Banner Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl py-20 text-center ban-el" style={{ ...glassStyle }}>
          <FiImage size={40} className="mx-auto" style={{ color: 'rgba(232,0,45,0.3)' }} />
          <p className="mt-4 text-lg font-semibold text-gray-400">No banners uploaded yet</p>
          <p className="mt-1 text-sm font-light text-gray-600">Upload your first banner to display on your website</p>
          <button onClick={openAddModal} className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>Upload Banner</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 ban-el">
          {filtered.map((banner, idx) => (
            <div key={banner.id} className="group overflow-hidden rounded-xl transition-all hover:shadow-lg hover:shadow-red-500/5" style={{ ...glassStyle, opacity: banner.is_active ? 1 : 0.6 }}>
              {/* Image */}
              <div className="relative overflow-hidden" style={{ aspectRatio: '16/5' }}>
                <img src={banner.image_url} alt={banner.title || 'Banner'} className="h-full w-full object-cover transition-all duration-500 group-hover:brightness-75 group-hover:scale-105" />

                {/* Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 transition-all group-hover:opacity-100">
                  <button onClick={() => setPreviewBanner(banner)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30">
                    <FiEye size={18} />
                  </button>
                  <button onClick={() => openEditModal(banner)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30">
                    <FiEdit2 size={18} />
                  </button>
                </div>

                {/* Order Badge */}
                <div className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                  Order #{banner.display_order}
                </div>

                {/* Reorder */}
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
                  <button onClick={() => moveBanner(banner.id, 'up')} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"><FiArrowUp size={12} /></button>
                  <button onClick={() => moveBanner(banner.id, 'down')} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"><FiArrowDown size={12} /></button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-white">{banner.title || 'Untitled Banner'}</h3>
                    {banner.subtitle && <p className="mt-0.5 truncate text-[11px] font-light text-gray-500">{banner.subtitle}</p>}
                    {banner.link_url && (
                      <div className="mt-1 flex items-center gap-1">
                        <FiLink size={10} className="text-gray-600" />
                        <p className="truncate text-[10px] text-gray-600">{banner.link_url}</p>
                      </div>
                    )}
                  </div>

                  {/* Status Toggle */}
                  <button onClick={() => toggleActive(banner)}
                    className="relative h-6 w-11 flex-shrink-0 rounded-full transition-all"
                    style={{ backgroundColor: banner.is_active ? '#E8002D' : 'rgba(255,255,255,0.1)' }}>
                    <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: banner.is_active ? '22px' : '2px' }} />
                    {banner.is_active && <div className="absolute inset-0 animate-pulse rounded-full" style={{ backgroundColor: 'rgba(232,0,45,0.3)' }} />}
                  </button>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEditModal(banner)} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold text-white transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <FiEdit2 size={11} /> Edit
                  </button>
                  <button onClick={() => handleDelete(banner)} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold text-red-400 transition-all hover:bg-red-500/10" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                    <FiTrash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setPreviewBanner(null)}>
          <div className="relative max-h-[80vh] max-w-5xl overflow-hidden rounded-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewBanner(null)} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"><FiX size={18} /></button>
            <img src={previewBanner.image_url} alt={previewBanner.title || 'Banner'} className="w-full object-contain" />
            <div className="p-4" style={{ backgroundColor: '#111' }}>
              <h3 className="text-lg font-semibold text-white">{previewBanner.title || 'Untitled'}</h3>
              {previewBanner.subtitle && <p className="mt-1 text-sm text-gray-400">{previewBanner.subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.07)', maxHeight: '90vh' }}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? 'Edit Banner' : 'Upload Banner'}
                  <span className="ml-1 inline-block h-0.5 w-6 rounded-full" style={{ backgroundColor: '#E8002D' }} />
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-white"><FiX size={20} /></button>
              </div>

              <div className="space-y-4">
                {/* Image Upload — Drag & Drop */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Banner Image *</label>
                  <div
                    className={`mt-2 flex flex-col items-center justify-center rounded-xl p-6 transition-all ${isDragging ? 'scale-[1.02]' : ''}`}
                    style={{
                      border: `2px dashed ${isDragging ? '#E8002D' : 'rgba(232,0,45,0.3)'}`,
                      backgroundColor: isDragging ? 'rgba(232,0,45,0.05)' : 'rgba(255,255,255,0.02)',
                    }}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    {imagePreview ? (
                      <div className="w-full overflow-hidden rounded-xl" style={{ aspectRatio: '16/5' }}>
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <>
                        <FiUpload size={32} className="text-gray-600" />
                        <p className="mt-3 text-sm text-gray-400">Drag & drop your banner image here</p>
                        <p className="mt-1 text-[10px] text-gray-600">PNG, JPG, WEBP — Recommended: 1920×600px</p>
                      </>
                    )}
                    <label className="mt-3 cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      {imagePreview ? 'Change Image' : 'Browse Files'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Title</label>
                  <input type="text" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="Banner title" value={form.title} onChange={e => handleFormChange('title', e.target.value)} />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Subtitle</label>
                  <input type="text" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="Banner subtitle" value={form.subtitle} onChange={e => handleFormChange('subtitle', e.target.value)} />
                </div>

                {/* Link URL */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Link URL</label>
                  <input type="text" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="/checkout or https://..." value={form.link_url} onChange={e => handleFormChange('link_url', e.target.value)} />
                </div>

                {/* Display Order */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Display Order</label>
                  <input type="number" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="1" value={form.display_order} onChange={e => handleFormChange('display_order', Number(e.target.value))} />
                </div>

                {/* Active */}
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.is_active} onChange={e => handleFormChange('is_active', e.target.checked)} className="h-4 w-4 rounded accent-red-600" />
                  <span className="text-xs font-medium text-gray-400">✅ Active (visible on website)</span>
                </label>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-400 transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={handleSave} disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8002D' }}>
                    {isSaving ? <><div className="spinner h-4 w-4" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> Saving...</> : isEditing ? 'Update Banner' : 'Save Banner'}
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

export default AdminBannersPage;