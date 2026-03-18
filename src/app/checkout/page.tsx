'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase-client';
import { CheckoutForm } from '@/types';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import {
  FiArrowLeft,
  FiShoppingCart,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiNavigation,
  FiFileText,
  FiCreditCard,
  FiDollarSign,
  FiTrash2,
  FiMinus,
  FiPlus,
  FiCheck,
} from 'react-icons/fi';

const CheckoutPage = () => {
  const router = useRouter();
  const {
    items,
    getTotalItems,
    getSubtotal,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCartStore();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(150);

  const totalItems = getTotalItems();
  const subtotal = getSubtotal();

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  // Dynamic total
  const total = subtotal + deliveryFee - discount;

  // Form state
  const [form, setForm] = useState<CheckoutForm>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    address: '',
    area: '',
    landmark: '',
    delivery_instructions: '',
    payment_method: 'cod',
  });

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch delivery fee from settings
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'delivery_fee')
          .single();

        if (data) {
          setDeliveryFee(Number(data.value));
        }
      } catch (err) {
        console.log('Using default delivery fee');
      }
    };

    fetchDeliveryFee();
  }, []);


    // Check if returning from payment
  

  // Animate on mount
  useEffect(() => {
    gsap.fromTo(
      '.checkout-section',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power3.out',
      }
    );
  }, []);

  // Generate order number
  const generateOrderNumber = () => {
    const prefix = 'NSP';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  // Handle form change
  const handleFormChange = (field: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.customer_name.trim()) newErrors.customer_name = 'Name is required';
    if (!form.customer_phone.trim()) newErrors.customer_phone = 'Phone is required';
    if (form.customer_phone && !/^(\+92|0)?3\d{9}$/.test(form.customer_phone.replace(/[\s-]/g, '')))
      newErrors.customer_phone = 'Enter a valid Pakistani phone number';
    if (form.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email))
      newErrors.customer_email = 'Enter a valid email';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    if (!form.area.trim()) newErrors.area = 'Area is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Apply voucher
  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Enter a voucher code');
      return;
    }

    setIsApplyingVoucher(true);

    try {
      const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !voucher) {
        toast.error('Invalid voucher code');
        setIsApplyingVoucher(false);
        return;
      }

      // Check expiry
      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
        toast.error('This voucher has expired');
        setIsApplyingVoucher(false);
        return;
      }

      // Check usage limit
      if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
        toast.error('This voucher has reached its usage limit');
        setIsApplyingVoucher(false);
        return;
      }

      // Check min order amount
      if (subtotal < Number(voucher.min_order_amount)) {
        toast.error(`Minimum order amount is Rs. ${Number(voucher.min_order_amount).toLocaleString()}`);
        setIsApplyingVoucher(false);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (voucher.discount_type === 'percentage') {
        discountAmount = (subtotal * Number(voucher.discount_value)) / 100;
        if (voucher.max_discount && discountAmount > Number(voucher.max_discount)) {
          discountAmount = Number(voucher.max_discount);
        }
      } else {
        discountAmount = Number(voucher.discount_value);
      }

      discountAmount = Math.min(discountAmount, subtotal);

      setAppliedVoucher(voucher);
      setDiscount(Math.round(discountAmount));
      toast.success(`Voucher applied! You save Rs. ${Math.round(discountAmount).toLocaleString()} 🎉`);
    } catch (err) {
      toast.error('Failed to apply voucher');
    }

    setIsApplyingVoucher(false);
  };

  // Remove voucher
  const removeVoucher = () => {
    setAppliedVoucher(null);
    setDiscount(0);
    setVoucherCode('');
    toast.success('Voucher removed');
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const newOrderNumber = generateOrderNumber();

      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: newOrderNumber,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          customer_email: form.customer_email || null,
          address: form.address,
          area: form.area,
          landmark: form.landmark || null,
          delivery_instructions: form.delivery_instructions || null,
          payment_method: form.payment_method,
          payment_status: 'pending',
          payment_reference: null,
          subtotal,
          delivery_fee: deliveryFee,
          total: subtotal + deliveryFee - discount,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        variant_name: item.variant.name,
        quantity: item.quantity,
        unit_price: item.variant.price,
        total_price: item.variant.price * item.quantity,
        special_instructions: item.special_instructions || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // If voucher was applied, increment used_count
      if (appliedVoucher) {
        await supabase
          .from('vouchers')
          .update({
            used_count: appliedVoucher.used_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appliedVoucher.id);
      }

      // If CARD payment → Redirect to Safepay
           // If CARD payment → Redirect to Safepay
      if (form.payment_method === 'card') {
        toast.loading('Redirecting to secure payment page...', { duration: 5000 });

        try {
          const paymentRes = await fetch('/api/payment/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderData.id,
              amount: subtotal + deliveryFee - discount,
            }),
          });

          const paymentData = await paymentRes.json();

          if (!paymentRes.ok) {
            throw new Error(paymentData.error || 'Payment initiation failed');
          }

          // Save order info before redirecting
               // Save order info
                   // Save order info
               localStorage.setItem('pending_payment_order', JSON.stringify({
            orderId: orderData.id,
            orderNumber: newOrderNumber,
            token: paymentData.token || '',
            openedAt: Date.now(),
          }));

          clearCart();

          // Open Safepay in popup
          const popupWidth = 500;
          const popupHeight = 700;
          const left = (window.screen.width - popupWidth) / 2;
          const top = (window.screen.height - popupHeight) / 2;

          const paymentWindow = window.open(
            paymentData.checkoutUrl,
            'SafepayPayment',
            `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
          );

          if (paymentWindow) {
            const pollTimer = setInterval(() => {
              if (paymentWindow.closed) {
                clearInterval(pollTimer);
                // Save closed time
                const pendingData = localStorage.getItem('pending_payment_order');
                if (pendingData) {
                  const parsed = JSON.parse(pendingData);
                  parsed.closedAt = Date.now();
                  localStorage.setItem('pending_payment_order', JSON.stringify(parsed));
                }
                window.location.href = '/payment-check';
              }
            }, 500);
          } else {
            // Popup blocked — open in same window
            window.location.href = paymentData.checkoutUrl;
          }

          setIsPlacingOrder(false);
          return;
        } catch (paymentErr: any) {
          console.error('Safepay error:', paymentErr);
          toast.error(paymentErr.message || 'Payment gateway unavailable. Order placed with pending payment.');
        }
      }

      // For COD or if payment initiation failed
      setOrderNumber(newOrderNumber);
      setOrderPlaced(true);
      clearCart();
      toast.success('Order placed successfully! 🎉');

      setTimeout(() => {
        gsap.fromTo(
          '.success-container',
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        );
      }, 100);
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    }

    setIsPlacingOrder(false);
  };

  // Order Success View
  if (orderPlaced) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="success-container text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <FiCheck size={48} className="text-green-600" />
          </div>
          <h1
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Order Placed Successfully! 🎉
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Thank you for ordering from NonStop Pizza
          </p>

          <div
            className="mx-auto mt-6 max-w-sm rounded-2xl p-6"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your Order Number
            </p>
            <p className="mt-1 text-2xl font-extrabold text-primary-600">
              {orderNumber}
            </p>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Save this number to track your order
            </p>
          </div>

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
        </div>
      </div>
    );
  }

  // Empty Cart View
  if (totalItems === 0 && !orderPlaced) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <span className="text-6xl">🛒</span>
          <h1
            className="mt-4 text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Your Cart is Empty
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Add some delicious items to your cart first!
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary mt-6 rounded-xl px-8"
          >
            Browse Menu 🍕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      

      <div className="container-custom mt-6">
        <div className="grid grid-cols-1 max-w-[80vw] mx-auto gap-6 lg:grid-cols-3">
          {/* LEFT - Form */}
          <div className="lg:col-span-2">
            {/* Order Items */}
           
            {/* Customer Details */}
            <div
              className="checkout-section mt-6 rounded-2xl p-[3rem]"
              style={{
                backgroundColor: 'var(--checkout-page)',
             
              }}
            >
              <h2
                className="flex flex-col items-start p-0 m-0 font-semibold text-lg"
                style={{ color: 'var(--text-primary)', fontFamily:'Poppins' , letterSpacing:'.7px', fontSize:'1.4rem'}}>
                Checkout
            
              </h2>
    <span style={{color:'var(--text-primary)', fontFamily:'Poppins'}}>This is a <strong>Deliver Order<img className='inline mx-1 w-6' src='/delivery.webp'/></strong></span>
                <p className='text-sm' style={{color:'var(--text-primary)', fontFamily:'Poppins'}}>Just a last step, please enter your details:</p>


<div style={{width:'100%', height:'2px', backgroundColor:'var(--separator-color)', margin:'20px auto'}}></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" style={{fontFamily:'Poppins'}}>
                
                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                     Full Name
                  </label>
                  <input style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}} type="text" className="input-field" placeholder="Full Name" value={form.customer_name} onChange={(e) => handleFormChange('customer_name', e.target.value)} />
                  {errors.customer_name && <p className="mt-1 text-xs text-red-500">{errors.customer_name}</p>}
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                   Phone Number
                  </label>
                  <input style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}} type="tel" className="input-field" placeholder="03xx-xxxxxxx" value={form.customer_phone} onChange={(e) => handleFormChange('customer_phone', e.target.value)} />
                  {errors.customer_phone && <p className="mt-1 text-xs text-red-500">{errors.customer_phone}</p>}
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                   Email
                  </label>
                  <input style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}} type="email" className="input-field" placeholder="Enter your email" value={form.customer_email} onChange={(e) => handleFormChange('customer_email', e.target.value)} />
                  {errors.customer_email && <p className="mt-1 text-xs text-red-500">{errors.customer_email}</p>}
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Area
                  </label>
                  <input style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}} type="text" className="input-field" placeholder="E.g., Gulshan, DHA, Saddar" value={form.area} onChange={(e) => handleFormChange('area', e.target.value)} />
                  {errors.area && <p className="mt-1 text-xs text-red-500">{errors.area}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Full Address
                  </label>
                  <input style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}} type="text" className="input-field" placeholder="Enter your complete address" value={form.address} onChange={(e) => handleFormChange('address', e.target.value)} />
                  {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Near Landmark
                  </label>
                  <input style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}} type="text" className="input-field" placeholder="any famous place nearby" value={form.landmark} onChange={(e) => handleFormChange('landmark', e.target.value)} />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Delivery Instructions
                  </label>
                  <input style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}} type="text" className="input-field" placeholder="Ring the bell, call on arrival..." value={form.delivery_instructions} onChange={(e) => handleFormChange('delivery_instructions', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div
              className="checkout-section mt-6 rounded-2xl py-3 px-[3rem]"
              style={{
                backgroundColor: 'var(--checkout-page)',
               
              }}
            >
            <label className="mb-2 flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--text-primary)', fontFamily:'Poppins' }}>
                   Payment Information
                  </label>
                   
           

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* COD */}
                <button
                  onClick={() => handleFormChange('payment_method', 'cod')}
                  className={`flex items-center gap-3 rounded-xl p-4 transition-all duration-300 ${
                    form.payment_method === 'cod'
                      ? 'border-2 border-primary-600'
                      : ''
                  }`}
                  style={
                    form.payment_method !== 'cod'
                      ? {
                          backgroundColor: 'var(--bg-primary)',
                          border: '2px solid var(--input-checkcolor)',
                        }
                      : {}
                  }
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      form.payment_method === 'cod'
                        ? 'bg-primary-600 text-white'
                        : 'transparent'
                    }`}
                  >
                    <FiDollarSign size={22} />
                  </div>
                  <div className="text-left" style={{fontFamily:'Poppins'}}>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Cash on Delivery
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Pay when you receive
                    </p>
                  </div>
                  {form.payment_method === 'cod' && (
                    <FiCheck size={20} className="ml-auto text-primary-600" />
                  )}
                </button>

                {/* Card */}
                <button
                disabled
                  onClick={() => handleFormChange('payment_method', 'card')}
                  className={`flex items-center gap-3 rounded-xl p-4 transition-all duration-300 ${
                    form.payment_method === 'card'
                      ? 'border-2 border-primary-600'
                      : ''
                  }`}
                  style={
                    form.payment_method !== 'card'
                      ? {
                          backgroundColor: 'var(--bg-primary)',
                          border: '2px solid var(--input-checkcolor)',
                        }
                      : {}
                  }
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      form.payment_method === 'card'
                        ? 'bg-primary-600 text-white'
                        : ''
                    }`}
                   
                  >
                    <FiCreditCard size={22} />
                  </div>
                  <div className="text-left"  style={{fontFamily:"Poppins"}}>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Credit / Debit Card
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Visa, Master, UnionPay, PayPak (COMING SOON)
                    </p>
                  </div>
                  {form.payment_method === 'card' && (
                    <FiCheck size={20} className="ml-auto text-primary-600" />
                  )}
                </button>
              </div>

              {/* Safepay Card Payment Info */}
              {form.payment_method === 'card' && (
                <div
                  className="mt-5 rounded-xl p-5 text-center"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Secure Card Payment
                  </h3>
                  <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    You will be redirected to a <strong>secure payment page</strong> to enter your card details safely.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    {['Visa', 'MasterCard', 'UnionPay', 'PayPak'].map((card) => (
                      <span
                        key={card}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        💳 {card}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    🔐 Your card details are never stored on our servers. Powered by Safepay.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT - Order Summary (Sticky) */}
          <div className="lg:col-span-1 mt-6">
            <div
              className="checkout-section sticky top-4 rounded-2xl p-5"
              style={{
                backgroundColor: 'var(--checkout-page)',
      
              }}
            >
           

              {/* Items Summary */}
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm" style={{fontFamily:'Poppins'}}>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {item.quantity} x {item.product.name}
                    </span>
                    <span className="font-bold text-[15px]" style={{ color: 'var(--text-primary)', fontFamily:'Poppins' }}>
                      Rs. {(item.variant.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="my-4 h-px" style={{ backgroundColor: 'var(--text-primary)' }} />
   <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily:'Poppins' }}>
                Your Order
              </h2>
              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm" style={{fontFamily:'Poppins'}}>
                <span style={{ color: 'var(--text-primary)' }}>Subtotal</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>

              {/* Delivery Fee */}
              <div className="mt-2 flex items-center justify-between text-sm" style={{fontFamily:'Poppins'}}>
                <span style={{ color: 'var(--text-primary)' }}>Delivery Fee</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Rs. {deliveryFee}
                </span>
              </div>

              {/* Voucher Input Section */}
              <div className="mt-4">
                {appliedVoucher ? (
                  <div
                    className="flex items-center justify-between rounded-xl p-3"
                    style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac' }}
                  >
                    <div className="flex items-center gap-2" style={{fontFamily:'Poppins'}}>
                      <span className="text-lg">🎟️</span>
                      <div style={{fontFamily:'Poppins'}}>
                        <p className="text-sm font-bold text-green-700">{appliedVoucher.code}</p>
                        <p className="text-[10px] text-green-600">
                          {appliedVoucher.discount_type === 'percentage'
                            ? `${appliedVoucher.discount_value}% off`
                            : `Rs. ${Number(appliedVoucher.discount_value).toLocaleString()} off`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeVoucher}
                      className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 transition-all"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-xs font-medium" style={{ color: 'var(--text-primary)', fontFamily:'Poppins' }}>
                      🎟️ Have a voucher code?
                    </p>
                    <div className="flex gap-2" style={{fontFamily:'Poppins'}}>
                      <input
                        type="text"
                        className="input-field flex-1 uppercase"
                        placeholder="Enter code"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && applyVoucher()}
                      />
                      <button
                        onClick={applyVoucher}
                        disabled={isApplyingVoucher}
                        className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white cursor-pointer transition-all hover:bg-primary-700 disabled:opacity-60"
                      >
                        {isApplyingVoucher ? '...' : 'Apply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Discount Row */}
              {discount > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">
                  <span className="font-semibold text-green-700">🎉 Discount</span>
                  <span className="font-bold text-green-700">- Rs. {discount.toLocaleString()}</span>
                </div>
              )}

              <div className="my-4 h-px" style={{ backgroundColor: 'var(--border-color)' }} />

              {/* Total */}
              <div className="flex items-center justify-between" style={{fontFamily:'Poppins'}}>
                <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                 Grand Total
                </span>
                <div className="text-right">
                  {discount > 0 && (
                    <span className="mr-2 text-sm line-through" style={{ color: 'var(--text-secondary)' }}>
                      Rs. {(subtotal + deliveryFee).toLocaleString()}
                    </span>
                  )}
                  <span className="text-xl font-extrabold text-primary-600" style={{fontFamily:'Poppins'}}>
                    Rs. {total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* You Save Message */}
              {discount > 0 && (
                <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-center">
                  <p className="text-sm font-bold text-green-700" style={{fontFamily:'Poppins'}}>
                    🎉 You save Rs. {discount.toLocaleString()}!
                  </p>
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPlacingOrder ? (
                  <>
                    <div className="spinner h-5 w-5" />
                    <span style={{fontFamily:'Poppins'}}>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span style={{fontFamily:'Poppins'}}>Place Order</span>
                    <span style={{fontFamily:'Poppins'}}>— Rs. {total.toLocaleString()}</span>
                  </>
                )}
              </button>

              {/* Payment Info */}
              <p className="mt-3 text-center text-[10px]" style={{ color: 'var(--text-secondary)', fontFamily:'Poppins' }}>
                {form.payment_method === 'cod'
                  ? '💵 You will pay cash on delivery'
                  : '🔒 Secure payment via Safepay'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;