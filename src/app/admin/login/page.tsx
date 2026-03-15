'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';

const AdminLoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/verify');
        if (res.ok) {
          router.replace('/admin/dashboard');
          return;
        }
      } catch (err) {
        // Not logged in
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [router]);

  // Animate on mount
  useEffect(() => {
    if (!isChecking) {
      gsap.fromTo(
        '.login-card',
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, [isChecking]);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      toast.success(`Welcome back, ${data.admin.name}! 🍕`);
      router.replace('/admin/dashboard');
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    }

    setIsLoading(false);
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner h-10 w-10 text-primary-600" />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #450a0a 100%)',
      }}
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute left-1/2 top-1/4 text-8xl opacity-10">🍕</div>
        <div className="absolute right-1/4 bottom-1/4 text-6xl opacity-10">🍕</div>
      </div>

      {/* Login Card */}
      <div
        className="login-card relative z-10 w-full max-w-md rounded-3xl p-8 opacity-0 shadow-2xl sm:p-10"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 shadow-lg">
            <span className="text-3xl">🍕</span>
          </div>
          <h1
            className="text-2xl font-extrabold tracking-wide"
            style={{ color: 'var(--text-primary)' }}
          >
            NONSTOP PIZZA
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Admin Dashboard Login
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              <FiMail size={14} className="text-primary-600" />
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="admin@nonstoppizza.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              <FiLock size={14} className="text-primary-600" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-12"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <div className="spinner h-5 w-5" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <FiLogIn size={18} />
                <span>Login to Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* First Time Hint */}
        <div
          className="mt-6 rounded-xl p-3 text-center"
          style={{
            backgroundColor: 'var(--input-bg)',
            border: '1px solid var(--border-color)',
          }}
        >
          <p
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            💡 First time login? Use email{' '}
            <strong>admin@nonstoppizza.com</strong> and set any password.
            That password will be saved for future logins.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;