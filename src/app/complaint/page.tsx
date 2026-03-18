'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import {
  FiArrowLeft,
  FiAlertCircle,
  FiUser,
  FiPhone,
  FiMail,
  FiMessageSquare,
  FiSend,
  FiCheck,
} from 'react-icons/fi';

const ComplaintPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animate on mount
  useEffect(() => {
    gsap.fromTo(
      '.complaint-section',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  // Handle form change
  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.customer_name.trim()) newErrors.customer_name = 'Name is required';
    if (!form.customer_phone.trim()) newErrors.customer_phone = 'Phone is required';
    if (
      form.customer_phone &&
      !/^(\+92|0)?3\d{9}$/.test(form.customer_phone.replace(/[\s-]/g, ''))
    )
      newErrors.customer_phone = 'Enter a valid Pakistani phone number';
    if (
      form.customer_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)
    )
      newErrors.customer_email = 'Enter a valid email';
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    if (!form.message.trim()) newErrors.message = 'Message is required';
    if (form.message.trim().length < 10)
      newErrors.message = 'Message must be at least 10 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit complaint
  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('complaints').insert({
        customer_name: form.customer_name,
        customer_email: form.customer_email || null,
        customer_phone: form.customer_phone,
        subject: form.subject,
        message: form.message,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Complaint submitted successfully!');

      // Animate success
      setTimeout(() => {
        gsap.fromTo(
          '.success-container',
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        );
      }, 100);
    } catch (err) {
      console.error('Complaint error:', err);
      toast.error('Failed to submit complaint. Please try again.');
    }

    setIsSubmitting(false);
  };

  // Success View
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="success-container text-center" style={{fontFamily:'Poppins'}}>
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-600">
            <FiCheck size={48} className="text-white-600" />
          </div>
          <h1
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Complaint Submitted! ✅
          </h1>
          <p
            className="mt-2 text-sm sm:text-base"
            style={{ color: 'var(--text-secondary)' }}
          >
            We have received your complaint and will get back to you shortly.
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            Our team reviews complaints within 24 hours.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({
                  customer_name: '',
                  customer_email: '',
                  customer_phone: '',
                  subject: '',
                  message: '',
                });
              }}
              className="btn-secondary rounded-xl px-8"
            >
              Submit Another
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn-primary rounded-xl px-8"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10 ">
      {/* Header */}
      <div
        className="complaint-section py-4"
       
      >
        <div className="container-custom justify-center text-center flex items-center gap-4">
      
          <div>
            <h1
              className="lg:text-[3rem] sm:text-2xl"
              style={{ color: 'var(--text-primary)' , fontFamily:'Poppins'}}
            >
              Submit a Complaint
            </h1>
            <p
              className="text-xs sm:text-sm"
              style={{ color: 'var(--text-secondary)' , fontFamily:'Poppins'}}
            >
              We value your feedback and will resolve your issue promptly
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom mt-6">
        <div className="mx-auto max-w-2xl">
          {/* Info Banner */}
          <div
            className="complaint-section mb-6 flex items-start gap-3 rounded-2xl p-4"
            style={{
              backgroundColor:'var(--checkout-page)',
              border: '1px solid var(--input-checkcolor)',
            }}
          >
            <FiAlertCircle size={20} className="mt-0.5 flex-shrink-0 text-primary-600" />
            <div style={{fontFamily:'Poppins'}}>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Your complaint goes directly to our management team
              </p>
              <p
                className="mt-1 text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                We take every complaint seriously. Please provide as much detail as
                possible so we can resolve your issue quickly.
              </p>
            </div>
          </div>

          {/* Complaint Form */}
          <div
            className="complaint-section rounded-2xl p-5 sm:p-6"
            style={{
              fontFamily:'Poppins',
               backgroundColor:'var(--checkout-page)',
              border: '1px solid var(--input-checkcolor)',
            }}
          >
            <div className="space-y-5">
              {/* Name & Phone Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label
                    className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}}
                    placeholder="Enter your name"
                    value={form.customer_name}
                    onChange={(e) => handleChange('customer_name', e.target.value)}
                  />
                  {errors.customer_name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.customer_name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="03XX XXXXXXX"
                    value={form.customer_phone}
                      style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}}
                    onChange={(e) => handleChange('customer_phone', e.target.value)}
                  />
                  {errors.customer_phone && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.customer_phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  className="input-field"
                    style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}}
                  placeholder="your@email.com"
                  value={form.customer_email}
                  onChange={(e) => handleChange('customer_email', e.target.value)}
                />
                {errors.customer_email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.customer_email}
                  </p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  className="input-field"
                    style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}}
                  placeholder="Brief title of your complaint"
                  value={form.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                />
                {errors.subject && (
                  <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
                )}
              </div>

              {/* Quick Subject Tags */}
              <div className="flex flex-wrap gap-2">
                {[
                  'Wrong Order',
                  'Late Delivery',
                  'Cold Food',
                  'Missing Items',
                  'Bad Quality',
                  'Rude Behavior',
                  'Overcharged',
                  'Other',
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleChange('subject', tag)}
                    className={`rounded-full cursor-pointer px-3 py-1.5 text-xs font-medium transition-all ${
                      form.subject === tag
                        ? 'bg-primary-600 text-white'
                        : ''
                    }`}
                    style={
                      form.subject !== tag
                        ? {
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                          }
                        : {}
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Message */}
              <div>
                <label
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
              
                  Describe Your Complaint
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={5}
                    style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}}
                  placeholder="Please describe your issue in detail. Include your order number if applicable..."
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.message}</p>
                )}
                <p
                  className="mt-1 text-right text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {form.message.length} characters
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner h-5 w-5" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FiSend size={18} />
                    <span style={{fontFamily:'Poppins'}}>Submit Complaint</span>
                  </>
                )}
              </button>

              <p
                className="text-center text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                🔒 Your information is kept confidential and used only to resolve
                your complaint.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintPage;