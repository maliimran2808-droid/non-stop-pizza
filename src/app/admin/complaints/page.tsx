'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Complaint } from '@/types';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import {
  FiEye,
  FiTrash2,
  FiX,
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiMessageSquare,
  FiSend,
  FiRefreshCw,
  FiUser,
  FiPhone,
  FiMail,
  FiAlertCircle,
  FiAlertTriangle,
  FiCheck,
  FiClock,
  FiCheckCircle,
  FiCopy,
} from 'react-icons/fi';

type ComplaintStatus = 'pending' | 'reviewed' | 'resolved';

const statusConfig: { value: ComplaintStatus; label: string; color: string; bg: string; emoji: string }[] = [
  { value: 'pending', label: 'Open', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', emoji: '🔴' },
  { value: 'reviewed', label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', emoji: '🟡' },
  { value: 'resolved', label: 'Resolved', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', emoji: '🟢' },
];

const replyTemplates = [
  { label: 'Apology for late delivery', text: 'We sincerely apologize for the delay in your delivery. We understand how frustrating this can be and are working to ensure this does not happen again. Thank you for your patience.' },
  { label: 'Wrong order apology', text: 'We are very sorry for sending the wrong order. We are arranging a replacement immediately. Please accept our sincere apologies for the inconvenience.' },
  { label: 'Refund initiated', text: 'We have initiated a full refund for your order. The amount will be credited back within 3-5 business days. We apologize for the inconvenience.' },
  { label: 'Quality issue noted', text: 'Thank you for bringing this to our attention. We take food quality very seriously and have notified our kitchen team. We would like to offer you a complimentary meal on your next order.' },
  { label: 'General acknowledgment', text: 'Thank you for reaching out to us. We have received your complaint and our team is looking into it. We will get back to you shortly with a resolution.' },
];

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const ITEMS_PER_PAGE = 10;

const AdminComplaintsPage = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminResponse, setAdminResponse] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  const detailRef = useRef<HTMLDivElement>(null);

  const fetchComplaints = async () => {
    try {
      const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
      if (data) {
        setComplaints(data);
        setUnreadCount(data.filter(c => !c.is_read).length);
        setStats({
          total: data.length,
          open: data.filter(c => c.status === 'pending').length,
          inProgress: data.filter(c => c.status === 'reviewed').length,
          resolved: data.filter(c => c.status === 'resolved').length,
        });
      }
    } catch (err) { console.error('Fetch error:', err); }
    setIsLoading(false);
    setTimeout(() => { gsap.fromTo('.comp-el', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out' }); }, 100);
  };

  useEffect(() => { fetchComplaints(); }, []);

  // Filter
  useEffect(() => {
    let result = complaints;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.customer_name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q) || c.customer_phone.includes(q) || c.message.toLowerCase().includes(q));
    }
    if (filterStatus !== 'all') result = result.filter(c => c.status === filterStatus);
    setFilteredComplaints(result);
    setCurrentPage(1);
  }, [complaints, searchQuery, filterStatus]);

  // Real-time
  useEffect(() => {
    const channel = supabase.channel('admin-complaints-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaints' }, (payload) => {
        const nc = payload.new as Complaint;
        setComplaints(prev => [nc, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.success(`📝 New Complaint: ${nc.subject}`, { duration: 8000 });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Pagination
  const totalPages = Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE);
  const paginated = filteredComplaints.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Mark read
  const markAsRead = async (c: Complaint) => {
    if (!c.is_read) {
      await supabase.from('complaints').update({ is_read: true }).eq('id', c.id);
      setComplaints(prev => prev.map(x => x.id === c.id ? { ...x, is_read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // View detail
  const viewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAdminResponse(complaint.admin_response || '');
    markAsRead(complaint);
    setIsDetailOpen(true);
    setShowTemplates(false);
    setTimeout(() => { if (detailRef.current) gsap.fromTo(detailRef.current, { x: '100%' }, { x: '0%', duration: 0.4, ease: 'power3.out' }); }, 10);
  };

  const closeDetail = () => {
    if (detailRef.current) gsap.to(detailRef.current, { x: '100%', duration: 0.3, ease: 'power3.in', onComplete: () => { setIsDetailOpen(false); setSelectedComplaint(null); } });
  };

  // Update status
  const updateStatus = async (id: string, newStatus: ComplaintStatus) => {
    try {
      await supabase.from('complaints').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      if (selectedComplaint?.id === id) setSelectedComplaint(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Status → ${newStatus}`);
    } catch { toast.error('Failed'); }
  };

  // Send response
  const sendResponse = async () => {
    if (!selectedComplaint || !adminResponse.trim()) { toast.error('Write a response'); return; }
    setIsSending(true);
    try {
      await supabase.from('complaints').update({ admin_response: adminResponse.trim(), status: 'reviewed' as ComplaintStatus, updated_at: new Date().toISOString() }).eq('id', selectedComplaint.id);
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, admin_response: adminResponse.trim(), status: 'reviewed' as ComplaintStatus } : c));
      setSelectedComplaint(prev => prev ? { ...prev, admin_response: adminResponse.trim(), status: 'reviewed' as ComplaintStatus } : null);
      toast.success('Response saved! ✅');
    } catch { toast.error('Failed'); }
    setIsSending(false);
  };

  // Delete
  const handleDelete = async (complaint: Complaint) => {
    if (!confirm(`Delete "${complaint.subject}"?`)) return;
    try {
      await supabase.from('complaints').delete().eq('id', complaint.id);
      setComplaints(prev => prev.filter(c => c.id !== complaint.id));
      if (selectedComplaint?.id === complaint.id) closeDetail();
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getStatus = (s: string) => statusConfig.find(x => x.value === s) || statusConfig[0];

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="spinner h-8 w-8" style={{ borderColor: '#E8002D', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 comp-el">
        <div>
          <h1 className="text-3xl font-semibold text-white">
            Complaints
            <span className="ml-1 inline-block h-1 w-8 rounded-full" style={{ backgroundColor: '#E8002D' }} />
          </h1>
          <p className="mt-1 text-sm font-normal text-gray-500">{stats.open} Open Complaints</p>
        </div>
        <button onClick={fetchComplaints} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Critical Alert */}
      {stats.open > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl px-4 py-3 comp-el" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="flex items-center gap-2">
            <FiAlertTriangle size={16} className="animate-pulse text-red-500" />
            <span className="text-sm font-medium text-red-400">⚠️ {stats.open} complaints require attention</span>
          </div>
          <button onClick={() => setFilterStatus('pending')} className="rounded-lg px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>View Open</button>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 comp-el">
        {[
          { label: 'Total', value: stats.total, color: '#E8002D', icon: FiMessageSquare },
          { label: 'Open', value: stats.open, color: '#EF4444', icon: FiAlertCircle },
          { label: 'In Progress', value: stats.inProgress, color: '#F59E0B', icon: FiClock },
          { label: 'Resolved', value: stats.resolved, color: '#22C55E', icon: FiCheckCircle },
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
      <div className="mb-4 flex flex-wrap items-center gap-3 comp-el">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5" style={{ ...glassStyle, minWidth: '200px' }}>
          <FiSearch size={14} className="text-gray-500" />
          <input type="text" placeholder="Search complaints, customers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-gray-600" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none rounded-xl px-4 py-2.5 pr-8 text-xs font-medium text-white outline-none" style={{ ...glassStyle }}>
            <option value="all" style={{ backgroundColor: '#111' }}>All Status</option>
            {statusConfig.map(s => <option key={s.value} value={s.value} style={{ backgroundColor: '#111' }}>{s.emoji} {s.label}</option>)}
          </select>
          <FiChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl comp-el" style={{ ...glassStyle }}>
        {paginated.length === 0 ? (
          <div className="py-20 text-center">
            <FiCheckCircle size={40} className="mx-auto" style={{ color: 'rgba(34,197,94,0.3)' }} />
            <p className="mt-4 text-lg font-semibold text-gray-400">No complaints found</p>
            <p className="mt-1 text-sm font-light text-gray-600">All clear! No complaints match your filters</p>
            <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>Clear Filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Customer', 'Subject', 'Status', 'Response', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(complaint => {
                  const s = getStatus(complaint.status);
                  return (
                    <tr
                      key={complaint.id}
                      className={`cursor-pointer transition-all hover:bg-red-500/[0.03] ${!complaint.is_read ? 'animate-pulse' : ''}`}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        borderLeft: complaint.status === 'pending' ? '3px solid #E8002D' : '3px solid transparent',
                      }}
                      onClick={() => viewComplaint(complaint)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#E8002D' }}>
                            {complaint.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {!complaint.is_read && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />}
                              {complaint.customer_name}
                            </p>
                            <p className="text-[10px] text-gray-500">{complaint.customer_phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="max-w-[200px] truncate text-sm font-medium text-white">{complaint.subject}</p>
                        <p className="mt-0.5 max-w-[200px] truncate text-[10px] text-gray-500">{complaint.message}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {complaint.admin_response ? (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>Responded</span>
                        ) : (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>Awaiting</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5"><span className="text-xs text-gray-500">{formatDate(complaint.created_at)}</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1">
                          <button onClick={e => { e.stopPropagation(); viewComplaint(complaint); }} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/5" style={{ color: '#E8002D' }}><FiEye size={13} /></button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(complaint); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10"><FiTrash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredComplaints.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-gray-500">Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredComplaints.length)} of {filteredComplaints.length}</p>
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

      {/* Detail Drawer */}
      {isDetailOpen && selectedComplaint && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={closeDetail} />
          <div ref={detailRef} className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto shadow-2xl sm:w-[480px]" style={{ backgroundColor: '#0F0F0F', borderLeft: '1px solid rgba(255,255,255,0.07)', transform: 'translateX(100%)' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: '#0F0F0F', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <h2 className="text-lg font-semibold text-white">Complaint Details</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase" style={{ backgroundColor: getStatus(selectedComplaint.status).bg, color: getStatus(selectedComplaint.status).color }}>
                    {getStatus(selectedComplaint.status).label}
                  </span>
                </div>
              </div>
              <button onClick={closeDetail} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-white"><FiX size={18} /></button>
            </div>

            <div className="space-y-5 p-5">
              {/* Status Update */}
              <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Update Status</p>
                <div className="flex gap-2">
                  {statusConfig.map(s => (
                    <button key={s.value} onClick={() => updateStatus(selectedComplaint.id, s.value)}
                      className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2.5 text-[11px] font-semibold transition-all ${selectedComplaint.status === s.value ? 'text-white shadow-lg' : 'text-gray-500'}`}
                      style={selectedComplaint.status === s.value ? { backgroundColor: '#E8002D' } : { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span>{s.emoji}</span><span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer */}
              <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Customer</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: '#E8002D' }}>
                    {selectedComplaint.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedComplaint.customer_name}</p>
                    <p className="text-[10px] text-gray-500">{selectedComplaint.customer_phone}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><FiPhone size={12} style={{ color: '#E8002D' }} /><a href={`tel:${selectedComplaint.customer_phone}`} className="text-sm text-white underline">{selectedComplaint.customer_phone}</a></div>
                  {selectedComplaint.customer_email && <div className="flex items-center gap-2"><FiMail size={12} style={{ color: '#E8002D' }} /><a href={`mailto:${selectedComplaint.customer_email}`} className="text-sm text-white underline">{selectedComplaint.customer_email}</a></div>}
                </div>
              </div>

              {/* Complaint Content */}
              <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Subject</p>
                <p className="mb-4 text-base font-semibold text-white">{selectedComplaint.subject}</p>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Message</p>
                <div className="rounded-lg p-3 text-sm leading-relaxed text-gray-300 whitespace-pre-line" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {selectedComplaint.message}
                </div>
              </div>

              {/* Conversation Thread */}
              {selectedComplaint.admin_response && (
                <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Conversation</p>
                  {/* Customer message */}
                  <div className="mb-3 mr-8">
                    <div className="rounded-xl rounded-tl-none p-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="text-xs text-gray-300">{selectedComplaint.message}</p>
                    </div>
                    <p className="mt-1 text-[9px] text-gray-600">{selectedComplaint.customer_name} • {formatDate(selectedComplaint.created_at)}</p>
                  </div>
                  {/* Admin response */}
                  <div className="ml-8">
                    <div className="rounded-xl rounded-tr-none p-3" style={{ backgroundColor: 'rgba(232,0,45,0.08)', border: '1px solid rgba(232,0,45,0.15)' }}>
                      <p className="text-xs text-gray-300">{selectedComplaint.admin_response}</p>
                    </div>
                    <p className="mt-1 text-right text-[9px] text-gray-600">Admin • {formatDate(selectedComplaint.updated_at)}</p>
                  </div>
                </div>
              )}

              {/* Reply Section */}
              <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    <FiMessageSquare size={12} className="mr-1 inline" style={{ color: '#E8002D' }} />
                    {selectedComplaint.admin_response ? 'Update Response' : 'Reply to Customer'}
                  </p>
                  <div className="relative">
                    <button onClick={() => setShowTemplates(!showTemplates)} className="text-[10px] font-semibold" style={{ color: '#E8002D' }}>Use Template ▾</button>
                    {showTemplates && (
                      <div className="absolute right-0 top-6 z-20 w-64 rounded-xl p-2 shadow-xl" style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {replyTemplates.map((t, i) => (
                          <button key={i} onClick={() => { setAdminResponse(t.text); setShowTemplates(false); }} className="w-full rounded-lg px-3 py-2 text-left text-[11px] text-gray-400 transition-all hover:bg-white/5 hover:text-white">
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <textarea
                  className="w-full resize-none rounded-xl border-none px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  rows={4}
                  placeholder="Write your response..."
                  value={adminResponse}
                  onChange={e => setAdminResponse(e.target.value)}
                />
                <button onClick={sendResponse} disabled={isSending}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: '#E8002D' }}>
                  {isSending ? <><div className="spinner h-4 w-4" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> Saving...</> : <><FiSend size={14} /> Save Response</>}
                </button>
              </div>

              {/* Timeline */}
              <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Timeline</p>
                {[
                  { label: 'Submitted', done: true, emoji: '📝' },
                  { label: 'Reviewed', done: selectedComplaint.status === 'reviewed' || selectedComplaint.status === 'resolved', emoji: '👁️' },
                  { label: 'Responded', done: !!selectedComplaint.admin_response, emoji: '💬' },
                  { label: 'Resolved', done: selectedComplaint.status === 'resolved', emoji: '✅' },
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px]"
                        style={{ backgroundColor: step.done ? '#22C55E' : 'rgba(255,255,255,0.05)', color: step.done ? '#fff' : '#555', border: !step.done ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                        {step.done ? '✓' : step.emoji}
                      </div>
                      {idx < 3 && <div className="h-5 w-0.5" style={{ backgroundColor: step.done ? '#22C55E' : 'rgba(255,255,255,0.07)' }} />}
                    </div>
                    <div className="pb-3"><p className={`text-xs font-semibold ${step.done ? 'text-green-500' : 'text-gray-600'}`}>{step.label}</p></div>
                  </div>
                ))}
              </div>

              {/* Delete */}
              <button onClick={() => handleDelete(selectedComplaint)}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10"
                style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                <FiTrash2 size={14} /> Delete Complaint
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminComplaintsPage;