'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Voucher } from '@/types';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiTag,
  FiCopy,
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
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '0',
  max_discount: '',
  usage_limit: '',
  is_active: true,
  expires_at: '',
};

const AdminVouchersPage = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VoucherForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const { data } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setVouchers(data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setIsLoading(false);
  };

  const handleFormChange = (field: keyof VoucherForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Generate random code
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'NSP-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, code }));
  };

  const openAddModal = () => {
    setForm(initialForm);
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (voucher: Voucher) => {
    setForm({
      code: voucher.code,
      description: voucher.description || '',
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value.toString(),
      min_order_amount: voucher.min_order_amount.toString(),
      max_discount: voucher.max_discount?.toString() || '',
      usage_limit: voucher.usage_limit?.toString() || '',
      is_active: voucher.is_active,
      expires_at: voucher.expires_at
        ? new Date(voucher.expires_at).toISOString().slice(0, 16)
        : '',
    });
    setIsEditing(true);
    setEditingId(voucher.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error('Voucher code is required');
      return;
    }
    if (!form.discount_value || Number(form.discount_value) <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }
    if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    setIsSaving(true);

    try {
      const voucherData = {
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
        const { error } = await supabase
          .from('vouchers')
          .update(voucherData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Voucher updated! ✅');
      } else {
        const { error } = await supabase
          .from('vouchers')
          .insert(voucherData);

        if (error) throw error;
        toast.success('Voucher created! 🎟️');
      }

      setIsModalOpen(false);
      fetchVouchers();
    } catch (err: any) {
      if (err.code === '23505') {
        toast.error('This voucher code already exists');
      } else {
        toast.error('Failed to save voucher');
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async (voucher: Voucher) => {
    if (!confirm(`Delete voucher "${voucher.code}"?`)) return;

    try {
      const { error } = await supabase
        .from('vouchers')
        .delete()
        .eq('id', voucher.id);

      if (error) throw error;

      setVouchers((prev) => prev.filter((v) => v.id !== voucher.id));
      toast.success('Voucher deleted');
    } catch (err) {
      toast.error('Failed to delete voucher');
    }
  };

  const toggleActive = async (voucher: Voucher) => {
    try {
      const { error } = await supabase
        .from('vouchers')
        .update({ is_active: !voucher.is_active, updated_at: new Date().toISOString() })
        .eq('id', voucher.id);

      if (error) throw error;

      setVouchers((prev) =>
        prev.map((v) =>
          v.id === voucher.id ? { ...v, is_active: !v.is_active } : v
        )
      );

      toast.success(`Voucher ${!voucher.is_active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Failed to update voucher');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code "${code}" copied!`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isExpired = (voucher: Voucher) => {
    if (!voucher.expires_at) return false;
    return new Date(voucher.expires_at) < new Date();
  };

  const isLimitReached = (voucher: Voucher) => {
    if (!voucher.usage_limit) return false;
    return voucher.used_count >= voucher.usage_limit;
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
            Vouchers Management 🎟️
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {vouchers.length} total vouchers
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2 rounded-xl"
        >
          <FiPlus size={18} />
          Create Voucher
        </button>
      </div>

      {/* Vouchers Grid */}
      {vouchers.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <span className="text-5xl">🎟️</span>
          <p
            className="mt-4 text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            No vouchers yet
          </p>
          <button onClick={openAddModal} className="btn-primary mt-4 rounded-xl">
            Create First Voucher
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vouchers.map((voucher) => (
            <div
              key={voucher.id}
              className="overflow-hidden rounded-2xl"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                opacity: voucher.is_active && !isExpired(voucher) && !isLimitReached(voucher) ? 1 : 0.6,
              }}
            >
              {/* Code Header */}
              <div className="flex items-center justify-between bg-primary-600 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FiTag size={16} className="text-white" />
                  <span className="text-lg font-extrabold tracking-wider text-white">
                    {voucher.code}
                  </span>
                </div>
                <button
                  onClick={() => copyCode(voucher.code)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition-all hover:bg-white/30"
                >
                  <FiCopy size={14} />
                </button>
              </div>

              {/* Info */}
              <div className="p-4">
                {voucher.description && (
                  <p
                    className="mb-2 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {voucher.description}
                  </p>
                )}

                {/* Discount */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-primary-600">
                    {voucher.discount_type === 'percentage'
                      ? `${voucher.discount_value}%`
                      : `Rs. ${Number(voucher.discount_value).toLocaleString()}`}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {voucher.discount_type === 'percentage' ? 'OFF' : 'OFF'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {voucher.min_order_amount > 0 && (
                    <p>Min order: Rs. {Number(voucher.min_order_amount).toLocaleString()}</p>
                  )}
                  {voucher.max_discount && (
                    <p>Max discount: Rs. {Number(voucher.max_discount).toLocaleString()}</p>
                  )}
                  {voucher.usage_limit && (
                    <p>
                      Usage: {voucher.used_count} / {voucher.usage_limit}
                    </p>
                  )}
                  {voucher.expires_at && (
                    <p>Expires: {formatDate(voucher.expires_at)}</p>
                  )}
                </div>

                {/* Status Badges */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {isExpired(voucher) && (
                    <span className="badge badge-red">Expired</span>
                  )}
                  {isLimitReached(voucher) && (
                    <span className="badge badge-red">Limit Reached</span>
                  )}
                  {!voucher.is_active && (
                    <span className="badge badge-yellow">Inactive</span>
                  )}
                  {voucher.is_active && !isExpired(voucher) && !isLimitReached(voucher) && (
                    <span className="badge badge-green">Active</span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => toggleActive(voucher)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      voucher.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {voucher.is_active ? '✅ Active' : '❌ Inactive'}
                  </button>
                  <button
                    onClick={() => openEditModal(voucher)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-all hover:bg-primary-200"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(voucher)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-all hover:bg-red-200"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
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
              <div className="mb-5 flex items-center justify-between">
                <h2
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {isEditing ? 'Edit Voucher' : 'Create Voucher'} 🎟️
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
                {/* Code */}
                <div>
                  <label className="mb-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Voucher Code *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input-field flex-1 uppercase"
                      placeholder="E.g., SAVE20"
                      value={form.code}
                      onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                    />
                    <button
                      onClick={generateCode}
                      className="btn-secondary rounded-lg px-3 text-xs"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Description
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="E.g., Flat 20% off on all orders"
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                  />
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Discount Type *
                    </label>
                    <select
                      className="input-field"
                      value={form.discount_type}
                      onChange={(e) => handleFormChange('discount_type', e.target.value)}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (Rs.)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder={form.discount_type === 'percentage' ? 'E.g., 20' : 'E.g., 200'}
                      value={form.discount_value}
                      onChange={(e) => handleFormChange('discount_value', e.target.value)}
                    />
                  </div>
                </div>

                {/* Min Order & Max Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Min Order Amount (Rs.)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0"
                      value={form.min_order_amount}
                      onChange={(e) => handleFormChange('min_order_amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Max Discount (Rs.)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="No limit"
                      value={form.max_discount}
                      onChange={(e) => handleFormChange('max_discount', e.target.value)}
                    />
                  </div>
                </div>

                {/* Usage Limit & Expiry */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Unlimited"
                      value={form.usage_limit}
                      onChange={(e) => handleFormChange('usage_limit', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Expires At
                    </label>
                    <input
                      type="datetime-local"
                      className="input-field"
                      value={form.expires_at}
                      onChange={(e) => handleFormChange('expires_at', e.target.value)}
                    />
                  </div>
                </div>

                {/* Active */}
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => handleFormChange('is_active', e.target.checked)}
                    className="h-4 w-4 rounded accent-primary-600"
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    ✅ Active
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
                      <span>{isEditing ? 'Update Voucher' : 'Create Voucher'}</span>
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

export default AdminVouchersPage;