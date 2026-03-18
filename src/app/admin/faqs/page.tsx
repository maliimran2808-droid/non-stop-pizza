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
  FiHelpCircle,
} from 'react-icons/fi';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FAQForm {
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

const initialForm: FAQForm = {
  question: '',
  answer: '',
  display_order: 0,
  is_active: true,
};

const AdminFAQsPage = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FAQForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const { data } = await supabase
        .from('faqs')
        .select('*')
        .order('display_order', { ascending: true });

      if (data) setFaqs(data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setIsLoading(false);
  };

  const handleFormChange = (field: keyof FAQForm, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddModal = () => {
    setForm({
      ...initialForm,
      display_order: faqs.length + 1,
    });
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (faq: FAQ) => {
    setForm({
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order,
      is_active: faq.is_active,
    });
    setIsEditing(true);
    setEditingId(faq.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim()) {
      toast.error('Question is required');
      return;
    }
    if (!form.answer.trim()) {
      toast.error('Answer is required');
      return;
    }

    setIsSaving(true);

    try {
      const data = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        display_order: form.display_order,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && editingId) {
        const { error } = await supabase
          .from('faqs')
          .update(data)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('FAQ updated! ✅');
      } else {
        const { error } = await supabase
          .from('faqs')
          .insert(data);

        if (error) throw error;
        toast.success('FAQ added! ❓');
      }

      setIsModalOpen(false);
      fetchFaqs();
    } catch (err) {
      toast.error('Failed to save FAQ');
    }

    setIsSaving(false);
  };

  const handleDelete = async (faq: FAQ) => {
    if (!confirm(`Delete "${faq.question}"?`)) return;

    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', faq.id);

      if (error) throw error;

      setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
      toast.success('FAQ deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (faq: FAQ) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({
          is_active: !faq.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', faq.id);

      if (error) throw error;

      setFaqs((prev) =>
        prev.map((f) =>
          f.id === faq.id ? { ...f, is_active: !f.is_active } : f
        )
      );

      toast.success(`FAQ ${!faq.is_active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const moveFaq = async (faqId: string, direction: 'up' | 'down') => {
    const index = faqs.findIndex((f) => f.id === faqId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === faqs.length - 1) return;

    const newFaqs = [...faqs];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    const tempOrder = newFaqs[index].display_order;
    newFaqs[index].display_order = newFaqs[swapIndex].display_order;
    newFaqs[swapIndex].display_order = tempOrder;

    [newFaqs[index], newFaqs[swapIndex]] = [newFaqs[swapIndex], newFaqs[index]];

    setFaqs(newFaqs);

    try {
      await supabase
        .from('faqs')
        .update({ display_order: newFaqs[index].display_order })
        .eq('id', newFaqs[index].id);

      await supabase
        .from('faqs')
        .update({ display_order: newFaqs[swapIndex].display_order })
        .eq('id', newFaqs[swapIndex].id);

      toast.success('Order updated');
    } catch (err) {
      toast.error('Failed to update order');
      fetchFaqs();
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
            FAQs Management ❓
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {faqs.length} questions • Manage frequently asked questions
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2 rounded-xl"
        >
          <FiPlus size={18} />
          Add FAQ
        </button>
      </div>

      {/* FAQs List */}
      {faqs.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <FiHelpCircle size={48} className="mx-auto text-primary-300" />
          <p
            className="mt-4 text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            No FAQs yet
          </p>
          <button onClick={openAddModal} className="btn-primary mt-4 rounded-xl">
            Add First FAQ
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className="flex gap-3 rounded-2xl p-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                opacity: faq.is_active ? 1 : 0.6,
              }}
            >
              {/* Order Controls */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => moveFaq(faq.id, 'up')}
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
                  onClick={() => moveFaq(faq.id, 'down')}
                  disabled={index === faqs.length - 1}
                  className="flex h-6 w-6 items-center justify-center rounded transition-all hover:bg-gray-100 disabled:opacity-30"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <FiArrowDown size={14} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-sm font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Q: {faq.question}
                </h3>
                <p
                  className="mt-1 line-clamp-2 text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  A: {faq.answer}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-shrink-0 items-start gap-2">
                <button
                  onClick={() => toggleActive(faq)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition-all ${
                    faq.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {faq.is_active ? '✅' : '❌'}
                </button>
                <button
                  onClick={() => openEditModal(faq)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-all hover:bg-primary-200"
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(faq)}
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
                  {isEditing ? 'Edit FAQ' : 'Add FAQ'} ❓
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
                {/* Question */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Question * (shown in bold)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="E.g., What are your delivery hours?"
                    value={form.question}
                    onChange={(e) => handleFormChange('question', e.target.value)}
                  />
                </div>

                {/* Answer */}
                <div>
                  <label
                    className="mb-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Answer * (shown in regular text)
                  </label>
                  <textarea
                    className="input-field resize-none"
                    rows={6}
                    placeholder="Write the answer here...

You can write multiple paragraphs by pressing Enter twice."
                    value={form.answer}
                    onChange={(e) => handleFormChange('answer', e.target.value)}
                  />
                  <p
                    className="mt-1 text-right text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {form.answer.length} characters
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
                      <span>{isEditing ? 'Update FAQ' : 'Add FAQ'}</span>
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

export default AdminFAQsPage;