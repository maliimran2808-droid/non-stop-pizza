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
  FiMessageSquare,
  FiSend,
  FiRefreshCw,
  FiChevronDown,
  FiUser,
  FiPhone,
  FiMail,
  FiClock,
  FiCheck,
  FiCheckCircle,
} from 'react-icons/fi';

type ComplaintStatus = 'pending' | 'reviewed' | 'resolved';

const statusOptions: { value: ComplaintStatus; label: string; color: string; emoji: string }[] = [
  { value: 'pending', label: 'Pending', color: 'badge-yellow', emoji: '⏳' },
  { value: 'reviewed', label: 'Reviewed', color: 'badge-blue', emoji: '👁️' },
  { value: 'resolved', label: 'Resolved', color: 'badge-green', emoji: '✅' },
];

const AdminComplaintsPage = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [adminResponse, setAdminResponse] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);

  // Fetch complaints
  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setComplaints(data);
        setUnreadCount(data.filter((c) => !c.is_read).length);
      }
    } catch (err) {
      console.error('Fetch complaints error:', err);
    }
    setIsLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter complaints
  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredComplaints(complaints);
    } else {
      setFilteredComplaints(
        complaints.filter((c) => c.status === filterStatus)
      );
    }
  }, [complaints, filterStatus]);

  // Subscribe to real-time new complaints
  useEffect(() => {
    const channel = supabase
      .channel('admin-complaints')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaints',
        },
        (payload) => {
          const newComplaint = payload.new as Complaint;
          setComplaints((prev) => [newComplaint, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast.success(`📝 New Complaint: ${newComplaint.subject}`, {
            duration: 8000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mark complaint as read
  const markAsRead = async (complaint: Complaint) => {
    if (!complaint.is_read) {
      await supabase
        .from('complaints')
        .update({ is_read: true })
        .eq('id', complaint.id);

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaint.id ? { ...c, is_read: true } : c
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  // View complaint details
  const viewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAdminResponse(complaint.admin_response || '');
    markAsRead(complaint);
    setIsDetailOpen(true);

    setTimeout(() => {
      if (detailRef.current) {
        gsap.fromTo(
          detailRef.current,
          { x: '100%', opacity: 0 },
          { x: '0%', opacity: 1, duration: 0.4, ease: 'power3.out' }
        );
      }
    }, 10);
  };

  // Close detail panel
  const closeDetail = () => {
    if (detailRef.current) {
      gsap.to(detailRef.current, {
        x: '100%',
        opacity: 0,
        duration: 0.3,
        ease: 'power3.in',
        onComplete: () => {
          setIsDetailOpen(false);
          setSelectedComplaint(null);
        },
      });
    }
  };

  // Update complaint status
  const updateStatus = async (complaintId: string, newStatus: ComplaintStatus) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', complaintId);

      if (error) throw error;

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId ? { ...c, status: newStatus } : c
        )
      );

      if (selectedComplaint?.id === complaintId) {
        setSelectedComplaint((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }

      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Send admin response
  const sendResponse = async () => {
    if (!selectedComplaint) return;
    if (!adminResponse.trim()) {
      toast.error('Please write a response');
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          admin_response: adminResponse.trim(),
          status: 'reviewed' as ComplaintStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === selectedComplaint.id
            ? {
                ...c,
                admin_response: adminResponse.trim(),
                status: 'reviewed' as ComplaintStatus,
              }
            : c
        )
      );

      setSelectedComplaint((prev) =>
        prev
          ? {
              ...prev,
              admin_response: adminResponse.trim(),
              status: 'reviewed' as ComplaintStatus,
            }
          : null
      );

      toast.success('Response saved! ✅');
    } catch (err) {
      toast.error('Failed to save response');
    }

    setIsSending(false);
  };

  // Delete complaint
  const handleDelete = async (complaint: Complaint) => {
    if (!confirm(`Delete complaint "${complaint.subject}"?`)) return;

    try {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaint.id);

      if (error) throw error;

      setComplaints((prev) => prev.filter((c) => c.id !== complaint.id));

      if (selectedComplaint?.id === complaint.id) {
        closeDetail();
      }

      toast.success('Complaint deleted');
    } catch (err) {
      toast.error('Failed to delete complaint');
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    return statusOptions.find((s) => s.value === status)?.color || 'badge-yellow';
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
            Complaints Management 📝
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {complaints.length} total complaints • {unreadCount} unread
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-600 animate-pulse">
              📝 {unreadCount} New!
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={fetchComplaints}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-gray-100"
            style={{ color: 'var(--text-primary)' }}
          >
            <FiRefreshCw size={18} />
          </button>

          {/* Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field appearance-none pr-10"
              style={{ minWidth: '160px' }}
            >
              <option value="all">All Complaints</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </select>
            <FiChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-secondary)' }}
            />
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        {filteredComplaints.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-5xl">📭</span>
            <p
              className="mt-4 text-lg font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              No complaints found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Customer
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Subject
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Status
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Response
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Date
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className={`cursor-pointer transition-all ${
                      !complaint.is_read ? 'animate-blink font-semibold' : ''
                    }`}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                    }}
                    onClick={() => viewComplaint(complaint)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p
                          className="font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {!complaint.is_read && (
                            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />
                          )}
                          {complaint.customer_name}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {complaint.customer_phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p
                        className="max-w-[200px] truncate font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {complaint.subject}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${getStatusBadge(complaint.status)}`}
                      >
                        {complaint.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {complaint.admin_response ? (
                        <span className="badge badge-green">Responded</span>
                      ) : (
                        <span className="badge badge-yellow">No Response</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {formatDate(complaint.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewComplaint(complaint);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-all hover:bg-primary-200"
                        >
                          <FiEye size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(complaint);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-all hover:bg-red-200"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complaint Detail Side Panel */}
      {isDetailOpen && selectedComplaint && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeDetail}
          />

          {/* Panel */}
          <div
            ref={detailRef}
            className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto shadow-2xl sm:w-[500px]"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            {/* Panel Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div>
                <h2
                  className="text-lg font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Complaint Details
                </h2>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {formatDate(selectedComplaint.created_at)}
                </p>
              </div>
              <button
                onClick={closeDetail}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-gray-100"
                style={{ color: 'var(--text-primary)' }}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* Status Update */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h3
                  className="mb-3 text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Update Status
                </h3>
                <div className="flex gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      onClick={() =>
                        updateStatus(selectedComplaint.id, status.value)
                      }
                      className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                        selectedComplaint.status === status.value
                          ? 'bg-primary-600 text-white shadow-md'
                          : ''
                      }`}
                      style={
                        selectedComplaint.status !== status.value
                          ? {
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                            }
                          : {}
                      }
                    >
                      <span>{status.emoji}</span>
                      <span>{status.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Info */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h3
                  className="mb-3 text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Customer Info
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FiUser size={16} className="text-primary-600" />
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Name
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {selectedComplaint.customer_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiPhone size={16} className="text-primary-600" />
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Phone
                      </p>
                      <a
                        href={`tel:${selectedComplaint.customer_phone}`}
                        className="text-sm font-medium text-primary-600 underline"
                      >
                        {selectedComplaint.customer_phone}
                      </a>
                    </div>
                  </div>

                  {selectedComplaint.customer_email && (
                    <div className="flex items-center gap-3">
                      <FiMail size={16} className="text-primary-600" />
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Email
                        </p>
                        <a
                          href={`mailto:${selectedComplaint.customer_email}`}
                          className="text-sm font-medium text-primary-600 underline"
                        >
                          {selectedComplaint.customer_email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Complaint Content */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h3
                  className="mb-2 text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Subject
                </h3>
                <p
                  className="mb-4 text-base font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {selectedComplaint.subject}
                </p>

                <h3
                  className="mb-2 text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Message
                </h3>
                <div
                  className="rounded-lg p-3 text-sm leading-relaxed"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {selectedComplaint.message}
                </div>
              </div>

              {/* Admin Response */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h3
                  className="mb-3 flex items-center gap-2 text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <FiMessageSquare size={16} className="text-primary-600" />
                  Admin Response
                </h3>

                <textarea
                  className="input-field resize-none"
                  rows={4}
                  placeholder="Write your response to this complaint..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                />

                <button
                  onClick={sendResponse}
                  disabled={isSending}
                  className="btn-primary mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSending ? (
                    <>
                      <div className="spinner h-4 w-4" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSend size={16} />
                      <span>Save Response</span>
                    </>
                  )}
                </button>

                {selectedComplaint.admin_response && (
                  <div
                    className="mt-3 rounded-lg p-3"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <p
                      className="mb-1 text-xs font-semibold"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Current Response:
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {selectedComplaint.admin_response}
                    </p>
                  </div>
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(selectedComplaint)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-300 bg-red-50 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-100"
              >
                <FiTrash2 size={16} />
                Delete This Complaint
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminComplaintsPage;