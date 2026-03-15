'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi';

const PaymentCheckPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'submitted' | 'not_completed' | 'failed'>('checking');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    checkPayment();
  }, []);

  const checkPayment = () => {
    const pendingData = localStorage.getItem('pending_payment_order');

    if (!pendingData) {
      setStatus('failed');
      return;
    }

    const { orderNumber: savedOrderNumber, orderId: savedOrderId, openedAt, closedAt } = JSON.parse(pendingData);
    setOrderNumber(savedOrderNumber);
    setOrderId(savedOrderId);

    // Calculate time spent on Safepay page
    const timeSpent = (closedAt || Date.now()) - (openedAt || Date.now());
    const secondsSpent = Math.round(timeSpent / 1000);

    console.log('Time spent on Safepay:', secondsSpent, 'seconds');

    // If user spent less than 15 seconds, they likely didn't complete payment
    if (secondsSpent < 15) {
      setStatus('not_completed');
      // Update order payment status to failed
      updateOrderStatus(savedOrderId, 'failed');
    } else {
      // User spent enough time — payment likely submitted
      setStatus('submitted');
      // Update order payment status to pending (admin will verify)
      updateOrderStatus(savedOrderId, 'pending');
    }

    localStorage.removeItem('pending_payment_order');

    // Animate
    setTimeout(() => {
      gsap.fromTo(
        '.result-box',
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }, 100);
  };

  const updateOrderStatus = async (id: string, paymentStatus: string) => {
    try {
      await fetch('/api/payment/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, paymentStatus }),
      });
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="result-box text-center max-w-md">
        {/* Checking */}
        {status === 'checking' && (
          <>
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
              <div className="spinner h-12 w-12 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Verifying Payment...
            </h1>
          </>
        )}

        {/* Payment Submitted (spent enough time) */}
        {status === 'submitted' && (
          <>
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
              <FiCheck size={48} className="text-green-600" />
            </div>
            <h1
              className="text-2xl font-bold sm:text-3xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Payment Submitted! 🎉
            </h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Your card payment has been submitted. Our team will verify the payment from Safepay and confirm your order.
            </p>

            {orderNumber && (
              <div
                className="mx-auto mt-6 max-w-sm rounded-2xl p-6"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Order Number
                </p>
                <p className="mt-1 text-2xl font-extrabold text-primary-600">
                  {orderNumber}
                </p>
                <p className="mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  💳 Payment verification in progress
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  🍕 Your order will be prepared once payment is confirmed
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => router.push(`/track-order?order=${orderNumber}`)}
                className="btn-primary rounded-xl px-8"
              >
                Track Order
              </button>
              <button
                onClick={() => router.push('/')}
                className="btn-secondary rounded-xl px-8"
              >
                Back to Menu
              </button>
            </div>
          </>
        )}

        {/* Payment NOT Completed (closed too quickly) */}
        {status === 'not_completed' && (
          <>
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100">
              <FiAlertTriangle size={48} className="text-yellow-600" />
            </div>
            <h1
              className="text-2xl font-bold sm:text-3xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Payment Not Completed ⚠️
            </h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              It looks like you closed the payment page without completing the payment.
            </p>

            {orderNumber && (
              <div
                className="mx-auto mt-6 max-w-sm rounded-2xl p-6"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Order Number
                </p>
                <p className="mt-1 text-2xl font-extrabold text-primary-600">
                  {orderNumber}
                </p>
                <p className="mt-3 text-xs text-red-500">
                  ❌ Payment was not completed
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Your order is saved. You can pay via Cash on Delivery or try card payment again.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => router.push(`/track-order?order=${orderNumber}`)}
                className="btn-primary rounded-xl px-8"
              >
                Track Order
              </button>
              <button
                onClick={() => router.push('/')}
                className="btn-secondary rounded-xl px-8"
              >
                Back to Menu
              </button>
            </div>
          </>
        )}

        {/* Failed — No Data */}
        {status === 'failed' && (
          <>
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
              <FiX size={48} className="text-red-600" />
            </div>
            <h1
              className="text-2xl font-bold sm:text-3xl"
              style={{ color: 'var(--text-primary)' }}
            >
              No Payment Found
            </h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              We couldn&apos;t find any pending payment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => router.push('/checkout')}
                className="btn-primary rounded-xl px-8"
              >
                Go to Checkout
              </button>
              <button
                onClick={() => router.push('/')}
                className="btn-secondary rounded-xl px-8"
              >
                Back to Menu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCheckPage;