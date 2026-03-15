'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { BannerSlide } from '@/types';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiImage,
  FiArrowUp,
  FiArrowDown,
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
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '',
  display_order: 0,
  is_active: true,
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

  // Fetch banners
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data } = await supabase
        .from('banner_slides')
        .select('*')
        .order('display_order', { ascending: true });

      if (data) setBanners(data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setIsLoading(false);
  };

  // Handle form change
  const handleFormChange = (field: keyof BannerForm, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle image select
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Upload image
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('banners')
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
      return null;
    }
  };

  // Open add modal
  const openAddModal = () => {
    setForm({
      ...initialForm,
      display_order: banners.length + 1,
    });
    setImageFile(null);
    setImagePreview(null);
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (banner: BannerSlide) => {
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      display_order: banner.display_order,
      is_active: banner.is_active,
    });
    setImageFile(null);
    setImagePreview(banner.image_url || null);
    setIsEditing(true);
    setEditingId(banner.id);
    setIsModalOpen(true);
  };

  // Save banner
  const handleSave = async () => {
    if (!imagePreview && !form.image_url) {
      toast.error('Please upload a banner image');
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl = form.image_url;

      if (imageFile) {
        const url = await uploadImage(imageFile);
        if (url) imageUrl = url;
      }

      const bannerData = {
        title: form.title.trim() || null,
        subtitle: form.subtitle.trim() || null,
        image_url: imageUrl,
        link_url: form.link_url.trim() || null,
        display_order: form.display_order,
        is_active: form.is_active,
      };

      if (isEditing && editingId) {
        const { error } = await supabase
          .from('banner_slides')
          .update(bannerData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Banner updated! ✅');
      } else {
        const { error } = await supabase
          .from('banner_slides')
          .insert(bannerData);

        if (error) throw error;
        toast.success('Banner added! 🖼️');
      }

      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save banner');
    }

    setIsSaving(false);
  };

  // Delete banner
  const handleDelete = async (banner: BannerSlide) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const { error } = await supabase
        .from('banner_slides')
        .delete()
        .eq('id', banner.id);

      if (error) throw error;

      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      toast.success('Banner deleted');
    } catch (err) {
      toast.error('Failed to delete banner');
    }
  };

  // Toggle active
  const toggleActive = async (banner: BannerSlide) => {
    try {
      const { error } = await supabase
        .from('banner_slides')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (error) throw error;

      setBanners((prev) =>
        prev.map((b) =>
          b.id === banner.id ? { ...b, is_active: !b.is_active } : b
        )
      );

      toast.success(
        `Banner ${!banner.is_active ? 'activated' : 'deactivated'}`
      );
    } catch (err) {
      toast.error('Failed to update banner');
    }
  };

  // Move banner up/down
  const moveBanner = async (bannerId: string, direction: 'up' | 'down') => {
    const index = banners.findIndex((b) => b.id === bannerId);
    if (index === -1) return;

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === banners.length - 1) return;

    const newBanners = [...banners];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    const tempOrder = newBanners[index].display_order;
    newBanners[index].display_order = newBanners[swapIndex].display_order;
    newBanners[swapIndex].display_order = tempOrder;

    [newBanners[index], newBanners[swapIndex]] = [
      newBanners[swapIndex],
      newBanners[index],
    ];

    setBanners(newBanners);

    try {
      await supabase
        .from('banner_slides')
        .update({ display_order: newBanners[index].display_order })
        .eq('id', newBanners[index].id);

      await supabase
        .from('banner_slides')
        .update({ display_order: newBanners[swapIndex].display_order })
        .eq('id', newBanners[swapIndex].id);

      toast.success('Order updated');
    } catch (err) {
      toast.error('Failed to update order');
      fetchBanners();
    }
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Banners Management 🖼️
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {banners.length} total banners • These appear on the home page slider
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2 rounded-xl"
        >
          <FiPlus size={18} />
          Add Banner
        </button>
      </div>

      {/* Banners Grid */}
      {banners.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <span className="text-5xl">🖼️</span>
          <p
            className="mt-4 text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            No banners yet
          </p>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Placeholder banners will be shown until you add your own
          </p>
          <button
            onClick={openAddModal}
            className="btn-primary mt-4 rounded-xl"
          >
            Add First Banner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="flex flex-col overflow-hidden rounded-2xl sm:flex-row"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                opacity: banner.is_active ? 1 : 0.6,
              }}
            >
              {/* Order Controls */}
              <div
                className="flex items-center justify-center gap-2 px-3 py-2 sm:flex-col sm:py-0"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRight: '1px solid var(--border-color)',
                }}
              >
                <button
                  onClick={() => moveBanner(banner.id, 'up')}
                  disabled={index === 0}
                  className="flex h-7 w-7 items-center justify-center rounded transition-all hover:bg-gray-200 disabled:opacity-30"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <FiArrowUp size={14} />
                </button>
                <span
                  className="text-xs font-bold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {index + 1}
                </span>
                <button
                  onClick={() => moveBanner(banner.id, 'down')}
                  disabled={index === banners.length - 1}
                  className="flex h-7 w-7 items-center justify-center rounded transition-all hover:bg-gray-200 disabled:opacity-30"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <FiArrowDown size={14} />
                </button>
              </div>

              {/* Banner Image */}
              <div className="h-32 w-full overflow-hidden sm:h-auto sm:w-64">
                <img
                  src={banner.image_url}
                  alt={banner.title || 'Banner'}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Banner Info */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-base font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {banner.title || 'No Title'}
                    </h3>
                    {!banner.is_active && (
                      <span className="badge badge-red">Inactive</span>
                    )}
                  </div>
                  {banner.subtitle && (
                    <p
                      className="mt-1 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.link_url && (
                    <p className="mt-1 text-xs text-primary-600">
                      Link: {banner.link_url}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      banner.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {banner.is_active ? '✅ Active' : '❌ Inactive'}
                  </button>
                  <button
                    onClick={() => openEditModal(banner)}
                    className="flex items-center gap-1 rounded-lg bg-primary-100 px-3 py-1.5 text-xs font-medium text-primary-600 transition-all hover:bg-primary-200"
                  >
                    <FiEdit2 size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner)}
                    className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-200"
                  >
                    <FiTrash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Banner Modal */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-2xl"
              style={{
                backgroundColor: 'var(--bg-primary)',
                maxHeight: '90vh',
              }}
            >
              {/* Modal Header */}
              <div className="mb-5 flex items-center justify-between">
                <h2
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {isEditing ? 'Edit Banner' : 'Add New Banner'} 🖼️
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-gray-100"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Banner Image *
                  </label>
                  <div
                    className="flex flex-col items-center gap-4 rounded-xl p-4"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '2px dashed var(--border-color)',
                    }}
                  >
                    {imagePreview ? (
                      <div className="h-40 w-full overflow-hidden rounded-xl">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center">
                        <div className="text-center">
                          <FiImage
                            size={40}
                            style={{ color: 'var(--text-secondary)' }}
                            className="mx-auto"
                          />
                          <p
                            className="mt-2 text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Upload banner image
                          </p>
                        </div>
                      </div>
                    )}
                    <label className="btn-secondary cursor-pointer rounded-lg px-4 py-2 text-sm">
                      {imagePreview ? 'Change Image' : 'Choose Image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </label>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Recommended: 1200×500px, Max 5MB
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="E.g., Special Deals Today!"
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="E.g., Get 30% OFF on all pizzas"
                    value={form.subtitle}
                    onChange={(e) =>
                      handleFormChange('subtitle', e.target.value)
                    }
                  />
                </div>

                {/* Link URL */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Link URL (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="E.g., /checkout or https://..."
                    value={form.link_url}
                    onChange={(e) =>
                      handleFormChange('link_url', e.target.value)
                    }
                  />
                </div>

                {/* Active Toggle */}
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      handleFormChange('is_active', e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 accent-primary-600"
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    ✅ Active (visible on home page)
                  </span>
                </label>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="btn-ghost flex-1 rounded-xl border py-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <div className="spinner h-5 w-5" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{isEditing ? 'Update Banner' : 'Add Banner'}</span>
                    )}
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