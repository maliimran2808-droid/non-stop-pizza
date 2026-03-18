'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiShield,
} from 'react-icons/fi';

interface PolicySection {
  id: string;
  heading: string;
  content: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PolicyForm {
  heading: string;
  content: string;
  display_order: number;
  is_active: boolean;
}

const initialForm: PolicyForm = {
  heading: '',
  content: '',
  display_order: 0,
  is_active: true,
};

const AdminPrivacyPolicyPage = () => {
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PolicyForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data } = await supabase
        .from('privacy_policy')
        .select('*')
        .order('display_order', { ascending: true });

      if (data) setSections(data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setIsLoading(false);
  };

  const handleFormChange = (field: keyof PolicyForm, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddModal = () => {
    setForm({
      ...initialForm,
      display_order: sections.length + 1,
    });
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (section: PolicySection) => {
    setForm({
      heading: section.heading,
      content: section.content,
      display_order: section.display_order,
      is_active: section.is_active,
    });
    setIsEditing(true);
    setEditingId(section.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.heading.trim()) {
      toast.error('Heading is required');
      return;
    }
    if (!form.content.trim()) {
      toast.error('Content is required');
      return;
    }

    setIsSaving(true);

    try {
      const data = {
        heading: form.heading.trim(),
        content: form.content.trim(),
        display_order: form.display_order,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && editingId) {
        const { error } = await supabase
          .from('privacy_policy')
          .update(data)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Section updated! ✅');
      } else {
        const { error } = await supabase
          .from('privacy_policy')
          .insert(data);

        if (error) throw error;
        toast.success('Section added! 🛡️');
      }

      setIsModalOpen(false);
      fetchSections();
    } catch (err) {
      toast.error('Failed to save section');
    }

    setIsSaving(false);
  };

  const handleDelete = async (section: PolicySection) => {
    if (!confirm(`Delete "${section.heading}"?`)) return;

    try {
      const { error } = await supabase
        .from('privacy_policy')
        .delete()
        .eq('id', section.id);

      if (error) throw error;

      setSections((prev) => prev.filter((s) => s.id !== section.id));
      toast.success('Section deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (section: PolicySection) => {
    try {
      const { error } = await supabase
        .from('privacy_policy')
        .update({
          is_active: !section.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', section.id);

      if (error) throw error;

      setSections((prev) =>
        prev.map((s) =>
          s.id === section.id ? { ...s, is_active: !s.is_active } : s
        )
      );

      toast.success(`Section ${!section.is_active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex((s) => s.id === sectionId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newSections = [...sections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    const tempOrder = newSections[index].display_order;
    newSections[index].display_order = newSections[swapIndex].display_order;
    newSections[swapIndex].display_order = tempOrder;

    [newSections[index], newSections[swapIndex]] = [
      newSections[swapIndex],
      newSections[index],
    ];

    setSections(newSections);

    try {
      await supabase
        .from('privacy_policy')
        .update({ display_order: newSections[index].display_order })
        .eq('id', newSections[index].id);

      await supabase
        .from('privacy_policy')
        .update({ display_order: newSections[swapIndex].display_order })
        .eq('id', newSections[swapIndex].id);

      toast.success('Order updated');
    } catch (err) {
      toast.error('Failed to update order');
      fetchSections();
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
            Privacy Policy 🛡️
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {sections.length} sections • Manage your privacy policy content
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2 rounded-xl"
        >
          <FiPlus size={18} />
          Add Section
        </button>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <FiShield size={48} className="mx-auto text-primary-300" />
          <p
            className="mt-4 text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            No privacy policy sections yet
          </p>
          <button onClick={openAddModal} className="btn-primary mt-4 rounded-xl">
            Add First Section
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="flex gap-3 rounded-2xl p-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                opacity: section.is_active ? 1 : 0.6,
              }}
            >
              {/* Order Controls */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => moveSection(section.id, 'up')}
                  disabled={index === 0}
                  className="flex h-6 w-6 items-center justify-center rounded transition-all hover:bg-gray-100 disabled:opacity-30"
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
                  onClick={() => moveSection(section.id, 'down')}
                  disabled={index === sections.length - 1}
                  className="flex h-6 w-6 items-center justify-center rounded transition-all hover:bg-gray-100 disabled:opacity-30"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <FiArrowDown size={14} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-base font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {section.heading}
                </h3>
                <p
                  className="mt-1 line-clamp-2 text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {section.content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-shrink-0 items-start gap-2">
                <button
                  onClick={() => toggleActive(section)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition-all ${
                    section.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {section.is_active ? '✅' : '❌'}
                </button>
                <button
                  onClick={() => openEditModal(section)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-all hover:bg-primary-200"
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(section)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-all hover:bg-red-200"
                >
                  <FiTrash2 size={14} />
                </button>
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
              {/* Modal Header */}
              <div className="mb-5 flex items-center justify-between">
                <h2
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {isEditing ? 'Edit Section' : 'Add Section'} 🛡️
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
                {/* Heading */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Section Heading *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="E.g., Information We Collect"
                    value={form.heading}
                    onChange={(e) => handleFormChange('heading', e.target.value)}
                  />
                </div>

                {/* Content */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Content *
                  </label>
                  <textarea
                    className="input-field resize-none"
                    rows={10}
                    placeholder="Write the privacy policy content for this section...

You can write multiple paragraphs by pressing Enter twice.

Each paragraph will be displayed separately."
                    value={form.content}
                    onChange={(e) => handleFormChange('content', e.target.value)}
                  />
                  <p
                    className="mt-1 text-right text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {form.content.length} characters
                  </p>
                </div>

                {/* Active */}
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => handleFormChange('is_active', e.target.checked)}
                    className="h-4 w-4 rounded accent-primary-600"
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    ✅ Active (visible to customers)
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
                      <span>{isEditing ? 'Update Section' : 'Add Section'}</span>
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

export default AdminPrivacyPolicyPage;