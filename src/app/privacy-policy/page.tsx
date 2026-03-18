'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import gsap from 'gsap';
import { FiArrowLeft, FiShield } from 'react-icons/fi';

interface PolicySection {
  id: string;
  heading: string;
  content: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
const PrivacyPolicyPage = () => {
  const router = useRouter();
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const { data } = await supabase
        .from('privacy_policy')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (data) setSections(data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setIsLoading(false);

    // Animate
    setTimeout(() => {
      gsap.fromTo(
        '.policy-section',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
      );
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner h-10 w-10 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <div
        className="border-b py-4"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="container-custom flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-gray-100"
            style={{ color: 'var(--text-primary)' }}
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <FiShield size={22} className="text-primary-600" />
            <h1
              className="text-xl font-bold sm:text-2xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Privacy Policy
            </h1>
          </div>
        </div>
      </div>

      <div className="container-custom mt-6">
        <div className="mx-auto max-w-3xl">
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
                Privacy Policy coming soon
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              {/* Last Updated */}
              <p
                className="mb-6 text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                Last Updated:{' '}
                {new Date(
                  sections[sections.length - 1]?.updated_at || Date.now()
                ).toLocaleDateString('en-PK', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>

              {/* Policy Sections */}
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`policy-section ${
                    index > 0 ? 'mt-8' : ''
                  }`}
                >
                  <h2
                    className="text-lg font-bold sm:text-xl"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {index + 1}. {section.heading}
                  </h2>
                  <div
                    className="mt-3 text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;