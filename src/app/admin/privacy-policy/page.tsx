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
  FiCheck,
  FiClock,
  FiShield,
  FiAlertTriangle,
  FiArrowUp,
  FiArrowDown,
  FiEye,
  FiSave,
  FiChevronDown,
  FiFileText,
  FiCalendar,
  FiHash,
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
  heading: '', content: '', display_order: 0, is_active: true,
};

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const AdminPrivacyPolicyPage = () => {
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PolicyForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => { fetchSections(); }, []);

  const fetchSections = async () => {
    try {
      const { data } = await supabase.from('privacy_policy').select('*').order('display_order', { ascending: true });
      if (data) setSections(data);
    } catch (err) { console.error('Fetch error:', err); }
    setIsLoading(false);
    setTimeout(() => { gsap.fromTo('.pp-el', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out' }); }, 100);
  };

  const handleFormChange = (field: keyof PolicyForm, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const openAddModal = () => {
    setForm({ ...initialForm, display_order: sections.length + 1 });
    setIsEditing(false); setEditingId(null); setIsModalOpen(true);
  };

  const openEditModal = (section: PolicySection) => {
    setForm({ heading: section.heading, content: section.content, display_order: section.display_order, is_active: section.is_active });
    setIsEditing(true); setEditingId(section.id); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.heading.trim()) { toast.error('Heading required'); return; }
    if (!form.content.trim()) { toast.error('Content required'); return; }
    setIsSaving(true);
    try {
      const data = { heading: form.heading.trim(), content: form.content.trim(), display_order: form.display_order, is_active: form.is_active, updated_at: new Date().toISOString() };
      if (isEditing && editingId) {
        await supabase.from('privacy_policy').update(data).eq('id', editingId);
        toast.success('Section updated! ✅');
      } else {
        await supabase.from('privacy_policy').insert(data);
        toast.success('Section added! 🛡️');
      }
      setIsModalOpen(false); fetchSections();
    } catch { toast.error('Save failed'); }
    setIsSaving(false);
  };

  const handleDelete = async (section: PolicySection) => {
    if (!confirm(`Delete "${section.heading}"?`)) return;
    try {
      await supabase.from('privacy_policy').delete().eq('id', section.id);
      setSections(prev => prev.filter(s => s.id !== section.id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const toggleActive = async (section: PolicySection) => {
    try {
      await supabase.from('privacy_policy').update({ is_active: !section.is_active, updated_at: new Date().toISOString() }).eq('id', section.id);
      setSections(prev => prev.map(s => s.id === section.id ? { ...s, is_active: !s.is_active } : s));
      toast.success(`${!section.is_active ? 'Activated' : 'Deactivated'}`);
    } catch { toast.error('Failed'); }
  };

  const moveSection = async (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;

    const newSections = [...sections];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = newSections[idx].display_order;
    newSections[idx].display_order = newSections[swapIdx].display_order;
    newSections[swapIdx].display_order = temp;
    [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];
    setSections(newSections);

    try {
      await supabase.from('privacy_policy').update({ display_order: newSections[idx].display_order }).eq('id', newSections[idx].id);
      await supabase.from('privacy_policy').update({ display_order: newSections[swapIdx].display_order }).eq('id', newSections[swapIdx].id);
    } catch { fetchSections(); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  const totalWords = sections.reduce((sum, s) => sum + s.content.split(/\s+/).length, 0);
  const totalChars = sections.reduce((sum, s) => sum + s.content.length, 0);
  const lastUpdated = sections.length > 0 ? sections.reduce((latest, s) => new Date(s.updated_at) > new Date(latest) ? s.updated_at : latest, sections[0].updated_at) : null;

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="spinner h-8 w-8" style={{ borderColor: '#E8002D', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 pp-el">
        <div>
          <h1 className="text-3xl font-semibold text-white">
            Privacy Policy
            <span className="ml-1 inline-block h-1 w-8 rounded-full" style={{ backgroundColor: '#E8002D' }} />
          </h1>
          <p className="mt-1 text-sm font-normal text-gray-500">Manage and update your website privacy policy</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPreviewOpen(true)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <FiEye size={14} /> Preview
          </button>
          <button onClick={openAddModal} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: '#E8002D' }}>
            <FiPlus size={16} /> Add Section
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pp-el">
        {[
          { label: 'Total Sections', value: sections.length.toString(), color: '#E8002D', icon: FiFileText },
          { label: 'Active Sections', value: sections.filter(s => s.is_active).length.toString(), color: '#22C55E', icon: FiCheck },
          { label: 'Last Updated', value: lastUpdated ? formatDate(lastUpdated) : 'Never', color: '#3B82F6', icon: FiCalendar },
          { label: 'Word Count', value: totalWords.toLocaleString(), color: '#F59E0B', icon: FiHash },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4" style={{ ...glassStyle }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <p className="mt-3 text-lg font-bold text-white" style={{ fontFamily: 'var(--font-jetbrains)' }}>{s.value}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 pp-el">
        {/* Left — Sections List */}
        <div className="lg:col-span-2">
          {sections.length === 0 ? (
            <div className="rounded-xl py-20 text-center" style={{ ...glassStyle }}>
              <FiShield size={40} className="mx-auto" style={{ color: 'rgba(232,0,45,0.3)' }} />
              <p className="mt-4 text-lg font-semibold text-gray-400">No sections yet</p>
              <p className="mt-1 text-sm font-light text-gray-600">Add your first privacy policy section</p>
              <button onClick={openAddModal} className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>Add Section</button>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, idx) => (
                <div key={section.id} className="group rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-red-500/5" style={{ ...glassStyle, opacity: section.is_active ? 1 : 0.5, borderLeft: section.is_active ? '3px solid #E8002D' : '3px solid rgba(255,255,255,0.05)' }}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Order Controls */}
                        <div className="flex flex-col items-center gap-0.5 pt-0.5">
                          <button onClick={() => moveSection(section.id, 'up')} disabled={idx === 0} className="flex h-5 w-5 items-center justify-center rounded text-gray-600 hover:text-white disabled:opacity-20"><FiArrowUp size={10} /></button>
                          <span className="text-[10px] font-bold text-gray-600" style={{ fontFamily: 'var(--font-jetbrains)' }}>{idx + 1}</span>
                          <button onClick={() => moveSection(section.id, 'down')} disabled={idx === sections.length - 1} className="flex h-5 w-5 items-center justify-center rounded text-gray-600 hover:text-white disabled:opacity-20"><FiArrowDown size={10} /></button>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-white">{section.heading}</h3>
                          <p className="mt-1 line-clamp-2 text-sm font-light leading-relaxed text-gray-500">{section.content}</p>
                          <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-600">
                            <span>{section.content.split(/\s+/).length} words</span>
                            <span>•</span>
                            <span>Updated {formatDate(section.updated_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        <button onClick={() => toggleActive(section)} className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${section.is_active ? 'text-green-500' : 'text-red-500'}`} style={{ backgroundColor: section.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }}>
                          {section.is_active ? 'Active' : 'Off'}
                        </button>
                        <button onClick={() => openEditModal(section)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/5" style={{ color: '#E8002D' }}><FiEdit2 size={13} /></button>
                        <button onClick={() => handleDelete(section)} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10"><FiTrash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Navigator + Info */}
        <div className="space-y-4">
          {/* Section Navigator */}
          <div className="rounded-xl p-4" style={{ ...glassStyle }}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Section Navigator</p>
            <div className="space-y-1">
              {sections.filter(s => s.is_active).map((section, idx) => (
                <div key={section.id} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 transition-all hover:bg-white/5 hover:text-white" style={{ borderLeft: '2px solid rgba(232,0,45,0.3)' }}>
                  <span className="text-[10px] font-bold text-gray-600" style={{ fontFamily: 'var(--font-jetbrains)' }}>{idx + 1}.</span>
                  <span className="truncate">{section.heading}</span>
                </div>
              ))}
              {sections.filter(s => s.is_active).length === 0 && <p className="py-2 text-center text-[11px] text-gray-600">No active sections</p>}
            </div>
          </div>

          {/* Policy Stats */}
          <div className="rounded-xl p-4" style={{ ...glassStyle }}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Document Stats</p>
            <div className="space-y-2.5">
              {[
                { label: 'Total Sections', value: sections.length },
                { label: 'Active Sections', value: sections.filter(s => s.is_active).length },
                { label: 'Total Words', value: totalWords.toLocaleString() },
                { label: 'Total Characters', value: totalChars.toLocaleString() },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-xs font-semibold text-white" style={{ fontFamily: 'var(--font-jetbrains)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl p-4" style={{ ...glassStyle }}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Quick Actions</p>
            <div className="space-y-2">
              <button onClick={openAddModal} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>
                <FiPlus size={14} /> Add New Section
              </button>
              <button onClick={() => setIsPreviewOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <FiEye size={14} /> Preview Policy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="relative h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl sm:p-12">
            <button onClick={() => setIsPreviewOpen(false)} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"><FiX size={18} /></button>

            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>Privacy Policy</h1>
              <p className="mt-1 text-sm text-gray-500">
                Last updated: {lastUpdated ? formatDate(lastUpdated) : 'N/A'}
              </p>
            </div>

            {sections.filter(s => s.is_active).map((section, idx) => (
              <div key={section.id} className={idx > 0 ? 'mt-8' : ''}>
                <h2 className="text-lg font-bold text-gray-900">{idx + 1}. {section.heading}</h2>
                <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                  {section.content}
                </div>
              </div>
            ))}

            {sections.filter(s => s.is_active).length === 0 && (
              <p className="py-12 text-center text-gray-400">No active sections to preview</p>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl overflow-y-auto rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.07)', maxHeight: '90vh' }}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? 'Edit Section' : 'Add Section'}
                  <span className="ml-1 inline-block h-0.5 w-6 rounded-full" style={{ backgroundColor: '#E8002D' }} />
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-white"><FiX size={20} /></button>
              </div>

              <div className="space-y-4">
                {/* Heading */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Section Heading *</label>
                  <input type="text" className="w-full rounded-xl border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600" style={{ ...glassStyle }} placeholder="E.g., Information We Collect" value={form.heading} onChange={e => handleFormChange('heading', e.target.value)} />
                </div>

                {/* Content */}
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-gray-500">Content *</label>
                  <textarea
                    className="w-full resize-none rounded-xl border-none px-4 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-gray-600"
                    style={{ ...glassStyle }}
                    rows={12}
                    placeholder="Write the privacy policy content for this section...

You can write multiple paragraphs by pressing Enter twice.

Each paragraph will be displayed separately on the website."
                    value={form.content}
                    onChange={e => handleFormChange('content', e.target.value)}
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-gray-600">
                    <span>{form.content.split(/\s+/).filter(Boolean).length} words</span>
                    <span>{form.content.length} characters</span>
                  </div>
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
                    {isSaving ? <><div className="spinner h-4 w-4" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> Saving...</> : isEditing ? 'Update Section' : 'Save Section'}
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