'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
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
  FiArrowUp,
  FiArrowDown,
  FiHelpCircle,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiSave,
  FiHash,
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

const initialForm: FAQForm = { question: '', answer: '', display_order: 0, is_active: true };

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const ITEMS_PER_PAGE = 10;

const AdminFAQsPage = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<FAQForm>(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('order');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { fetchFaqs(); }, []);

  const fetchFaqs = async () => {
    try {
      const { data } = await supabase.from('faqs').select('*').order('display_order', { ascending: true });
      if (data) setFaqs(data);
    } catch (err) { console.error('Fetch error:', err); }
    setIsLoading(false);
    setTimeout(() => { gsap.fromTo('.faq-el', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out' }); }, 100);
  };

  const handleFormChange = (field: keyof FAQForm, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const clearForm = () => {
    setForm(initialForm); setIsEditing(false); setEditingId(null);
  };

  const startEdit = (faq: FAQ) => {
    setForm({ question: faq.question, answer: faq.answer, display_order: faq.display_order, is_active: faq.is_active });
    setIsEditing(true); setEditingId(faq.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!form.question.trim()) { toast.error('Question required'); return; }
    if (!form.answer.trim()) { toast.error('Answer required'); return; }
    setIsSaving(true);
    try {
      const data = { question: form.question.trim(), answer: form.answer.trim(), display_order: form.display_order, is_active: form.is_active, updated_at: new Date().toISOString() };
      if (isEditing && editingId) {
        await supabase.from('faqs').update(data).eq('id', editingId);
        toast.success('FAQ updated! ✅');
      } else {
        await supabase.from('faqs').insert({ ...data, display_order: faqs.length + 1 });
        toast.success('FAQ added! ❓');
      }
      clearForm(); fetchFaqs();
    } catch { toast.error('Save failed'); }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await supabase.from('faqs').delete().eq('id', deleteTarget.id);
      setFaqs(prev => prev.filter(f => f.id !== deleteTarget.id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
    setDeleteTarget(null);
  };

  const toggleActive = async (faq: FAQ) => {
    try {
      await supabase.from('faqs').update({ is_active: !faq.is_active, updated_at: new Date().toISOString() }).eq('id', faq.id);
      setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, is_active: !f.is_active } : f));
      toast.success(`${!faq.is_active ? 'Published' : 'Drafted'}`);
    } catch { toast.error('Failed'); }
  };

  const moveFaq = async (id: string, direction: 'up' | 'down') => {
    const idx = faqs.findIndex(f => f.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === faqs.length - 1) return;

    const newFaqs = [...faqs];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = newFaqs[idx].display_order;
    newFaqs[idx].display_order = newFaqs[swapIdx].display_order;
    newFaqs[swapIdx].display_order = temp;
    [newFaqs[idx], newFaqs[swapIdx]] = [newFaqs[swapIdx], newFaqs[idx]];
    setFaqs(newFaqs);

    try {
      await supabase.from('faqs').update({ display_order: newFaqs[idx].display_order }).eq('id', newFaqs[idx].id);
      await supabase.from('faqs').update({ display_order: newFaqs[swapIdx].display_order }).eq('id', newFaqs[swapIdx].id);
    } catch { fetchFaqs(); }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // Filter + Sort
  const filtered = faqs
    .filter(f => {
      const matchSearch = f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'all' || (filterStatus === 'published' && f.is_active) || (filterStatus === 'draft' && !f.is_active);
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'order') return a.display_order - b.display_order;
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'az') return a.question.localeCompare(b.question);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, sortBy]);

  const stats = {
    total: faqs.length,
    published: faqs.filter(f => f.is_active).length,
    draft: faqs.filter(f => !f.is_active).length,
  };

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="spinner h-8 w-8" style={{ borderColor: '#E8002D', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 faq-el">
        <div>
          <h1 className="text-3xl font-semibold text-white">
            FAQs
            <span className="ml-1 inline-block h-1 w-8 rounded-full" style={{ backgroundColor: '#E8002D' }} />
          </h1>
          <p className="mt-1 text-sm font-normal text-gray-500">Manage frequently asked questions for your website</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3 faq-el">
        {[
          { label: 'Total FAQs', value: stats.total, color: '#E8002D', icon: FiHelpCircle },
          { label: 'Published', value: stats.published, color: '#22C55E', icon: FiCheck },
          { label: 'Draft', value: stats.draft, color: '#F59E0B', icon: FiAlertCircle },
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
      <div className="mb-4 flex flex-wrap items-center gap-3 faq-el">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5" style={{ ...glassStyle, minWidth: '200px' }}>
          <FiSearch size={14} className="text-gray-500" />
          <input type="text" placeholder="Search questions, answers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-gray-600" />
        </div>
        {[
          { value: filterStatus, onChange: setFilterStatus, options: [{ v: 'all', l: 'All Status' }, { v: 'published', l: '✅ Published' }, { v: 'draft', l: '📝 Draft' }] },
          { value: sortBy, onChange: setSortBy, options: [{ v: 'order', l: 'Display Order' }, { v: 'newest', l: 'Newest' }, { v: 'oldest', l: 'Oldest' }, { v: 'az', l: 'A → Z' }] },
        ].map((f, i) => (
          <div key={i} className="relative">
            <select value={f.value} onChange={e => f.onChange(e.target.value)} className="appearance-none rounded-xl px-4 py-2.5 pr-8 text-xs font-medium text-white outline-none" style={{ ...glassStyle }}>
              {f.options.map(o => <option key={o.v} value={o.v} style={{ backgroundColor: '#111' }}>{o.l}</option>)}
            </select>
            <FiChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 faq-el">
        {/* Left — FAQ List */}
        <div className="lg:col-span-2">
          {paginated.length === 0 ? (
            <div className="rounded-xl py-20 text-center" style={{ ...glassStyle }}>
              <FiHelpCircle size={40} className="mx-auto" style={{ color: 'rgba(232,0,45,0.3)' }} />
              <p className="mt-4 text-lg font-semibold text-gray-400">No FAQs found</p>
              <p className="mt-1 text-sm font-light text-gray-600">Add your first FAQ to help your customers</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginated.map((faq, idx) => {
                const isExpanded = expandedId === faq.id;
                return (
                  <div key={faq.id} className="overflow-hidden rounded-xl transition-all" style={{ ...glassStyle, borderLeft: isExpanded ? '3px solid #E8002D' : '3px solid transparent', opacity: faq.is_active ? 1 : 0.6 }}>
                    {/* Question Row */}
                    <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all hover:bg-red-500/[0.02]" onClick={() => toggleExpand(faq.id)}>
                      {/* Order */}
                      <div className="flex flex-col items-center gap-0.5">
                        <button onClick={e => { e.stopPropagation(); moveFaq(faq.id, 'up'); }} className="flex h-4 w-4 items-center justify-center rounded text-gray-600 hover:text-white"><FiArrowUp size={9} /></button>
                        <span className="text-[9px] font-bold text-gray-600" style={{ fontFamily: 'var(--font-jetbrains)' }}>{faq.display_order}</span>
                        <button onClick={e => { e.stopPropagation(); moveFaq(faq.id, 'down'); }} className="flex h-4 w-4 items-center justify-center rounded text-gray-600 hover:text-white"><FiArrowDown size={9} /></button>
                      </div>

                      {/* Question */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{faq.question}</p>
                      </div>

                      {/* Status + Expand */}
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${faq.is_active ? 'text-green-500' : 'text-yellow-500'}`} style={{ backgroundColor: faq.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)' }}>
                        {faq.is_active ? 'Published' : 'Draft'}
                      </span>

                      <FiChevronDown size={14} className={`flex-shrink-0 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Answer (Expanded) */}
                    <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: isExpanded ? '500px' : '0', opacity: isExpanded ? 1 : 0 }}>
                      <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-sm font-light leading-relaxed text-gray-400 whitespace-pre-line">{faq.answer}</p>

                        <div className="mt-3 flex items-center gap-2">
                          <button onClick={() => startEdit(faq)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-white transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                            <FiEdit2 size={10} /> Edit
                          </button>
                          <button onClick={() => toggleActive(faq)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-white transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                            {faq.is_active ? '📝 Move to Draft' : '✅ Publish'}
                          </button>
                          <button onClick={() => setDeleteTarget(faq)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-red-400 transition-all hover:bg-red-500/10" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                            <FiTrash2 size={10} /> Delete
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
            <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3" style={{ ...glassStyle }}>
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
        </div>

        {/* Right — Add/Edit Panel (Sticky) */}
        <div>
          <div className="sticky top-4 rounded-xl p-5" style={{ ...glassStyle }}>
            <h3 className="mb-4 text-base font-semibold text-white">
              {isEditing ? 'Edit FAQ' : 'Add New FAQ'}
              <span className="ml-1 inline-block h-0.5 w-5 rounded-full" style={{ backgroundColor: '#E8002D' }} />
            </h3>

            <div className="space-y-4">
              {/* Question */}
              <div>
                <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Question *</label>
                <textarea
                  className="w-full resize-none rounded-xl border-none px-4 py-3 text-sm font-medium text-white outline-none placeholder:text-gray-600"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  rows={3}
                  placeholder="What is your delivery time?"
                  value={form.question}
                  onChange={e => handleFormChange('question', e.target.value)}
                />
              </div>

              {/* Answer */}
              <div>
                <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Answer *</label>
                <textarea
                  className="w-full resize-none rounded-xl border-none px-4 py-3 text-sm font-light text-white outline-none placeholder:text-gray-600"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  rows={6}
                  placeholder="Write a clear and helpful answer...

You can write multiple paragraphs."
                  value={form.answer}
                  onChange={e => handleFormChange('answer', e.target.value)}
                />
                <div className="mt-1 flex justify-between text-[10px] text-gray-600">
                  <span>{form.answer.split(/\s+/).filter(Boolean).length} words</span>
                  <span>{form.answer.length} chars</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Status</label>
                <button
                  onClick={() => handleFormChange('is_active', !form.is_active)}
                  className="relative h-6 w-11 rounded-full transition-all"
                  style={{ backgroundColor: form.is_active ? '#E8002D' : 'rgba(255,255,255,0.1)' }}
                >
                  <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: form.is_active ? '22px' : '2px' }} />
                  {form.is_active && <div className="absolute inset-0 animate-pulse rounded-full" style={{ backgroundColor: 'rgba(232,0,45,0.3)' }} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500">{form.is_active ? '✅ Will be published on website' : '📝 Saved as draft'}</p>

              {/* Buttons */}
              <button onClick={handleSave} disabled={isSaving} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8002D' }}>
                {isSaving ? <><div className="spinner h-4 w-4" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> Saving...</> : <><FiSave size={14} /> {isEditing ? 'Update FAQ' : 'Save FAQ'}</>}
              </button>

              {isEditing && (
                <button onClick={clearForm} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-gray-400 transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <FiX size={14} /> Cancel Edit
                </button>
              )}

              {!isEditing && (form.question || form.answer) && (
                <button onClick={clearForm} className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-gray-500 transition-all hover:text-gray-300">
                  Clear Form
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setDeleteTarget(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl" style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                <FiTrash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-white">Delete FAQ?</h3>
              <p className="mt-2 text-sm text-gray-500">Are you sure you want to delete this FAQ? This action cannot be undone.</p>
              <p className="mt-2 truncate rounded-lg px-3 py-2 text-xs font-medium text-gray-400" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                &quot;{deleteTarget.question}&quot;
              </p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-gray-400 transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                <button onClick={handleDelete} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>
                  <FiTrash2 size={14} /> Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminFAQsPage;