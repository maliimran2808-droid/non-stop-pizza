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
    <div className="min-h-screen max pb-10"  style={{width:'85.5vw', fontFamily:'Poppins', margin:'0 auto'}}>
      {/* Header */}
      <div
        className="py-4"
       
      >
        <div className="container-custom flex items-center gap-4">
       
          <div className="flex flex-col mx-auto items-start gap-2">
            
            <h1
              className="lg:text-[2.3rem] sm:text-2xl privacy-policy_txt"
              style={{ color: 'var(--text-primary)' }}
            >
              Our Privacy & Security Policies
            </h1>
            <p>Safeguarding your privacy and the security of your personal information is important to us. Please take a few minutes to read the following policies so that you understand how we treat your personal information. As we continuously improve and expand our services, these policies might change. So please check them out periodically. If you have questions about our policy, please click on the Feedback option to contact us via our electronic feedback form.</p>
              </div>
        </div>
      </div>

      <div className="container-custom" style={{fontFamily:'Poppins'}}>
        <div className="mx-auto">
          {sections.length === 0 ? (
            <div
              className="text-start"
              style={{
           
         
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
           
            >
              {/* Last Updated */}
              

              {/* Policy Sections */}
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`policy-section ${
                    index > 0 ? 'mt-4' : ''
                  }`}
                >
                  <h2
                    className="lg:text-[2rem] privacy-policy_txt text-semibold sm:text-xl"
                 
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {section.heading}
                  </h2>
                  <div
                    className="mt-3 leading-relaxed  whitespace-pre-line "
                    style={{ color: 'var(--text-primary)' }}
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