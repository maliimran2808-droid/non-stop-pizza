'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import gsap from 'gsap';
import { FiArrowLeft, FiHelpCircle, FiChevronDown } from 'react-icons/fi';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FAQsPage = () => {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const { data } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (data) setFaqs(data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setIsLoading(false);

    setTimeout(() => {
      gsap.fromTo(
        '.faq-item',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }
      );
    }, 100);
  };

  const toggleFaq = (id: string) => {
    if (openId === id) {
      // Close
      gsap.to(`.answer-${id}`, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
        onComplete: () => setOpenId(null),
      });
    } else {
      // Close previous
      if (openId) {
        gsap.to(`.answer-${openId}`, {
          height: 0,
          opacity: 0,
          duration: 0.2,
          ease: 'power2.inOut',
        });
      }

      setOpenId(id);

      // Open new
      setTimeout(() => {
        const element = document.querySelector(`.answer-${id}`) as HTMLElement;
        if (element) {
          const height = element.scrollHeight;
          gsap.fromTo(
            element,
            { height: 0, opacity: 0 },
            { height: height, opacity: 1, duration: 0.3, ease: 'power2.out' }
          );
        }
      }, 10);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner h-10 w-10 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="" style={{width:'85.5vw', fontFamily:'Poppins', margin:'20px auto 0px auto'}}>
      {/* Header */}
       <div
        className="py-4"
       
      >
        <div className="container-custom flex items-center gap-4">
       
          <div className="flex flex-col mx-auto items-start gap-2">
            
            <h1
              className="lg:text-[2.3rem] sm:text-2xl privacy-policy_txt"
              style={{ color: 'var(--text-primary)', letterSpacing:'normal !important' }}
            >
              Check out the amazing food variety of NonStop Pizza
            </h1>
            <p>SWe strive to bring the best experience of online ordering and delivery to our customers. If you are looking for best online deals with home delivery across the city then look no further, order now your favorite food from Kababjees Fried Chicken & enjoy your day.</p>
              </div>
        </div>
      </div>

      <div className="container-custom" style={{fontFamily:'Poppins'}}>
        <h2 className='uppercase' style={{fontSize:'2.3rem',letterSpacing:'0px', color:'var(--text-primary)'}}>FAQ</h2>
        <div className="mx-auto">
          {faqs.length === 0 ? (
            <div
              className="text-center"
           
            >
              <FiHelpCircle size={48} className="mx-auto text-primary-300" />
              <p
                className="mt-2 text-lg font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                FAQs coming soon
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => {
                const isOpen = openId === faq.id;

                return (
                  <div
                    key={faq.id}
                    className="faq-item overflow-hidden rounded-2xl transition-all"
                    style={{
                    
                      border: `1px solid ${isOpen ? '#dc2626' : 'var(--border-color)'}`,
                    }}
                  >
                    {/* Question */}
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left transition-all sm:p-5"
                    >
                      <h3
                        className="lg:text-[1.7rem] sm:text-[1rem]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {faq.question}
                      </h3>
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                          isOpen ? 'rotate-180 bg-primary-600 text-white' : ''
                        }`}
                        style={
                          !isOpen
                            ? {
                               
                                color: 'var(--text-primary)',
                              }
                            : {}
                        }
                      >
                        <FiChevronDown size={16} />
                      </div>
                    </button>

                    {/* Answer */}
                    <div
                      className={`answer-${faq.id} overflow-hidden`}
                      style={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    >
                      <div
                        className="border-t px-4 py-4 leading-relaxed whitespace-pre-line sm:px-5 sm:py-5 lg:text-[1.1rem] sm:text-[.8rem]"
                        style={{
                          color: 'var(--text-secondary)',
                          borderColor: 'var(--border-color)',
                        }}
                      >
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQsPage;