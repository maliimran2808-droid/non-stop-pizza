'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import {
  FiMail, FiLock, FiLogIn, FiEye, FiEyeOff, FiCheck, FiAlertCircle, FiArrowLeft,
} from 'react-icons/fi';

type View = 'login' | 'forgot' | 'otp' | 'reset' | 'success';

const AdminLoginPage = () => {
  const router = useRouter();
  const [view, setView] = useState<View>('login');

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Forgot Password
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/verify');
        if (res.ok) { router.replace('/admin/dashboard'); return; }
      } catch { }
      setIsChecking(false);
    };
    checkAuth();
  }, [router]);

  // Animations
  useEffect(() => {
    if (!isChecking) {
      gsap.fromTo('.login-left', { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo('.login-right', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 });
      gsap.fromTo('.form-el', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.5 });
      gsap.fromTo('.float-card', { y: 0 }, { y: -12, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.8 });
    }
  }, [isChecking]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Animate view change
  const animateViewChange = (newView: View) => {
    gsap.to('.form-panel', {
      opacity: 0, y: 20, duration: 0.2,
      onComplete: () => {
        setView(newView);
        setTimeout(() => {
          gsap.fromTo('.form-panel', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        }, 50);
      },
    });
  };

  // Validate login
  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password.trim()) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        gsap.fromTo('.login-form', { x: -8 }, { x: 8, duration: 0.08, repeat: 5, yoyo: true, ease: 'power2.inOut', onComplete: () => { gsap.set('.login-form', { x: 0 }); } });
        setIsLoading(false);
        return;
      }
      toast.success(`Welcome back, ${data.admin.name}! 🍕`);
      gsap.to('.login-right', { scale: 0.95, opacity: 0, duration: 0.3, onComplete: () => { router.replace('/admin/dashboard'); } });
    } catch { toast.error('Something went wrong'); }
    setIsLoading(false);
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!resetEmail.trim()) { toast.error('Enter your email'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) { toast.error('Enter a valid email'); return; }
    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); setIsSendingOtp(false); return; }
      toast.success('OTP sent to your email! 📧');
      setResendTimer(60);
      animateViewChange('otp');
    } catch { toast.error('Error'); }
    setIsSendingOtp(false);
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    if (pasted.length === 6) otpRefs.current[5]?.focus();
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter all 6 digits'); return; }
    setIsVerifying(true);
    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim(), otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Invalid code');
        // Shake OTP boxes
        gsap.fromTo('.otp-container', { x: -8 }, { x: 8, duration: 0.08, repeat: 5, yoyo: true, ease: 'power2.inOut', onComplete: () => { gsap.set('.otp-container', { x: 0 }); } });
        setIsVerifying(false);
        return;
      }
      toast.success('Code verified! ✅');
      animateViewChange('reset');
    } catch { toast.error('Error'); }
    setIsVerifying(false);
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    if (newPassword !== confirmNewPassword) { toast.error("Passwords don't match"); return; }
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); setIsResetting(false); return; }
      toast.success('Password reset successfully! 🔒');
      animateViewChange('success');
    } catch { toast.error('Error'); }
    setIsResetting(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    await handleSendOtp();
  };

  // Input styles
  const inputClass = "w-full rounded-xl bg-transparent py-3 text-sm text-white outline-none placeholder:text-gray-600 transition-all";
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="spinner h-8 w-8" style={{ borderColor: '#E8002D', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0A0A0A', fontFamily: 'var(--font-poppins)' }}>

      {/* LEFT PANEL */}
      <div className="login-left relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[55%]" style={{ opacity: 0 }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,0,5,0.9) 50%, rgba(0,0,0,0.95) 100%)' }} />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-20 blur-[120px]" style={{ backgroundColor: '#E8002D' }} />
        <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full opacity-10 blur-[100px]" style={{ backgroundColor: '#E8002D' }} />
        <div className="absolute bottom-20 right-20 h-48 w-48 rounded-full opacity-15 blur-[80px]" style={{ backgroundColor: '#E8002D' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(rgba(232,0,45,0.5) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white">NonStop<span style={{ color: '#E8002D' }}>.</span></h2>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-extrabold leading-tight text-white xl:text-5xl">
            Manage Your Restaurant With <span style={{ color: '#E8002D' }}>Confidence</span>
          </h1>
          <p className="mt-4 text-base font-light leading-relaxed text-gray-400">Your all-in-one dashboard to track orders, manage menus, and grow your business.</p>
          <div className="mt-8 space-y-3">
            {['Real-time order tracking', 'Smart analytics & reports', 'Full menu & inventory control'].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(232,0,45,0.15)' }}>
                  <FiCheck size={12} style={{ color: '#E8002D' }} />
                </div>
                <span className="text-sm font-medium text-gray-300">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute right-10 top-1/4 space-y-4">
          {[{ emoji: '🍔', text: '124 Orders Today' }, { emoji: '⭐', text: '4.9 Rating' }, { emoji: '💰', text: 'Rs. 48,500 Earned' }].map((c, i) => (
            <div key={i} className="float-card rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-sm font-medium text-gray-300">{c.emoji} {c.text}</span>
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <p className="text-xs text-gray-600">© 2025 NonStop Pizza. All rights reserved.</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right flex w-full items-center justify-center px-6 py-10 lg:w-[45%]" style={{ opacity: 0 }}>
        <div className="w-full max-w-sm">

          {/* Mobile Logo */}
          <div className="mb-8 text-center lg:hidden">
            <h2 className="text-2xl font-bold text-white">NonStop<span style={{ color: '#E8002D' }}>.</span></h2>
          </div>

          {/* Desktop Logo Mark */}
          <div className="mb-8 hidden lg:block">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(232,0,45,0.1)' }}>
              <span className="text-2xl font-bold" style={{ color: '#E8002D' }}>N</span>
            </div>
          </div>

          {/* ============ FORM PANEL ============ */}
          <div className="form-panel">

            {/* ---- LOGIN VIEW ---- */}
            {view === 'login' && (
              <>
                <div className="form-el">
                  <h1 className="text-2xl font-bold text-white sm:text-3xl">Welcome Back</h1>
                  <p className="mt-2 text-sm font-light text-gray-500">Sign in to your admin dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="login-form mt-8 space-y-5">
                  <div className="form-el">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Email</label>
                    <div className="relative">
                      <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }} placeholder="Enter your email" autoFocus
                        className={`${inputClass} pl-11 pr-4`} style={{ ...inputStyle, borderColor: errors.email ? '#EF4444' : 'rgba(255,255,255,0.08)' }}
                        onFocus={e => { e.target.style.borderColor = '#E8002D'; e.target.style.boxShadow = '0 0 0 3px rgba(232,0,45,0.15)'; }}
                        onBlur={e => { e.target.style.borderColor = errors.email ? '#EF4444' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
                    </div>
                    {errors.email && <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><FiAlertCircle size={10} /> {errors.email}</p>}
                  </div>

                  <div className="form-el">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Password</label>
                    <div className="relative">
                      <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }} placeholder="Enter your password"
                        className={`${inputClass} pl-11 pr-12`} style={{ ...inputStyle, borderColor: errors.password ? '#EF4444' : 'rgba(255,255,255,0.08)' }}
                        onFocus={e => { e.target.style.borderColor = '#E8002D'; e.target.style.boxShadow = '0 0 0 3px rgba(232,0,45,0.15)'; }}
                        onBlur={e => { e.target.style.borderColor = errors.password ? '#EF4444' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><FiAlertCircle size={10} /> {errors.password}</p>}
                  </div>

                  {/* Forgot Password Link */}
                  <div className="form-el flex justify-end">
                    <button type="button" onClick={() => animateViewChange('forgot')} className="text-xs font-medium transition-colors hover:underline" style={{ color: '#E8002D' }}>
                      Forgot Password?
                    </button>
                  </div>

                  <div className="form-el">
                    <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
                      style={{ backgroundColor: '#E8002D' }}
                      onMouseEnter={e => { if (!isLoading) (e.target as HTMLElement).style.backgroundColor = '#9B0020'; }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = '#E8002D'; }}>
                      {isLoading ? <div className="spinner h-5 w-5" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> : <><FiLogIn size={16} /> Sign In</>}
                    </button>
                  </div>
                </form>

               
              </>
            )}

            {/* ---- FORGOT PASSWORD VIEW ---- */}
            {view === 'forgot' && (
              <>
                <button onClick={() => animateViewChange('login')} className="mb-6 flex items-center gap-2 text-sm font-medium transition-colors hover:text-white" style={{ color: '#E8002D' }}>
                  <FiArrowLeft size={16} /> Back to Login
                </button>

                <h1 className="text-2xl font-bold text-white">Reset Password</h1>
                <p className="mt-2 text-sm font-light text-gray-500">Enter your email and we&apos;ll send you a 6-digit reset code</p>

                <div className="mt-8 space-y-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Email Address</label>
                    <div className="relative">
                      <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="Enter your registered email" autoFocus
                        className={`${inputClass} pl-11 pr-4`} style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = '#E8002D'; e.target.style.boxShadow = '0 0 0 3px rgba(232,0,45,0.15)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
                    </div>
                  </div>

                  <button onClick={handleSendOtp} disabled={isSendingOtp} className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60" style={{ backgroundColor: '#E8002D' }}>
                    {isSendingOtp ? <div className="spinner h-5 w-5" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> : <><FiMail size={16} /> Send Reset Code</>}
                  </button>
                </div>
              </>
            )}

            {/* ---- OTP VIEW ---- */}
            {view === 'otp' && (
              <>
                <button onClick={() => animateViewChange('forgot')} className="mb-6 flex items-center gap-2 text-sm font-medium transition-colors hover:text-white" style={{ color: '#E8002D' }}>
                  <FiArrowLeft size={16} /> Back
                </button>

                <h1 className="text-2xl font-bold text-white">Enter Verification Code</h1>
                <p className="mt-2 text-sm font-light text-gray-500">We sent a 6-digit code to <strong className="text-gray-300">{resetEmail}</strong></p>

                <div className="mt-8 space-y-5">
                  {/* OTP Boxes */}
                  <div className="otp-container flex justify-center gap-2.5">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        autoFocus={i === 0}
                        className="h-14 w-12 rounded-xl bg-transparent text-center text-xl font-bold text-white outline-none transition-all"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          border: `2px solid ${digit ? '#E8002D' : 'rgba(255,255,255,0.08)'}`,
                        }}
                        onFocus={e => { e.target.style.borderColor = '#E8002D'; e.target.style.boxShadow = '0 0 0 3px rgba(232,0,45,0.15)'; }}
                        onBlur={e => { e.target.style.borderColor = digit ? '#E8002D' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                      />
                    ))}
                  </div>

                  {/* Resend Timer */}
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-xs text-gray-500">Resend code in <span className="font-semibold text-gray-300">0:{resendTimer.toString().padStart(2, '0')}</span></p>
                    ) : (
                      <button onClick={handleResendOtp} className="text-xs font-medium hover:underline" style={{ color: '#E8002D' }}>Resend Code</button>
                    )}
                  </div>

                  <button onClick={handleVerifyOtp} disabled={isVerifying || otp.join('').length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60" style={{ backgroundColor: '#E8002D' }}>
                    {isVerifying ? <div className="spinner h-5 w-5" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> : <><FiCheck size={16} /> Verify Code</>}
                  </button>
                </div>
              </>
            )}

            {/* ---- RESET PASSWORD VIEW ---- */}
            {view === 'reset' && (
              <>
                <h1 className="text-2xl font-bold text-white">Set New Password</h1>
                <p className="mt-2 text-sm font-light text-gray-500">Create a strong password for your account</p>

                <div className="mt-8 space-y-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">New Password</label>
                    <div className="relative">
                      <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" autoFocus
                        className={`${inputClass} pl-11 pr-12`} style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = '#E8002D'; e.target.style.boxShadow = '0 0 0 3px rgba(232,0,45,0.15)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                        {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">Confirm Password</label>
                    <div className="relative">
                      <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Confirm password"
                        className={`${inputClass} pl-11 pr-4`} style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = '#E8002D'; e.target.style.boxShadow = '0 0 0 3px rgba(232,0,45,0.15)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
                    </div>
                    {confirmNewPassword && newPassword !== confirmNewPassword && <p className="mt-1 text-xs text-red-500">Passwords don&apos;t match</p>}
                  </div>

                  <button onClick={handleResetPassword} disabled={isResetting} className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60" style={{ backgroundColor: '#E8002D' }}>
                    {isResetting ? <div className="spinner h-5 w-5" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> : <><FiLock size={16} /> Reset Password</>}
                  </button>
                </div>
              </>
            )}

            {/* ---- SUCCESS VIEW ---- */}
            {view === 'success' && (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
                  <FiCheck size={40} className="text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-white">Password Reset!</h1>
                <p className="mt-2 text-sm font-light text-gray-500">Your password has been updated successfully. You can now login with your new password.</p>
                <button onClick={() => { setView('login'); setEmail(resetEmail); setPassword(''); setResetEmail(''); setOtp(['', '', '', '', '', '']); setNewPassword(''); setConfirmNewPassword(''); }}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white" style={{ backgroundColor: '#E8002D' }}>
                  <FiLogIn size={16} /> Go to Login
                </button>
              </div>
            )}

          </div>

          <p className="mt-6 text-center text-xs text-gray-600">Protected by NonStop Pizza Admin</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;