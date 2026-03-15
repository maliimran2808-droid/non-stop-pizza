import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// This endpoint receives webhooks from Safepay when payment is completed
// It will work when deployed to production (not on localhost)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Safepay Webhook Received:', JSON.stringify(body));

    // Safepay webhook payload structure
    const tracker = body?.data?.tracker?.token || body?.tracker || body?.token || '';
    const state = body?.data?.tracker?.state || body?.data?.state || body?.state || '';
    const orderId = body?.data?.tracker?.order_id || body?.order_id || '';
    const amount = body?.data?.tracker?.amount || body?.amount || 0;

    console.log('Webhook data:', { tracker, state, orderId, amount });

    if (!tracker && !orderId) {
      console.error('No tracker or order_id in webhook');
      return NextResponse.json({ received: true });
    }

    // Find order
    let order = null;

    if (tracker) {
      const { data } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('payment_reference', tracker)
        .single();
      order = data;
    }

    if (!order && orderId) {
      const { data } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('order_number', orderId)
        .single();
      order = data;
    }

    if (!order) {
      console.error('Order not found for webhook');
      return NextResponse.json({ received: true });
    }

    // Check payment state
    const paidStates = ['PAID', 'paid', 'completed', 'delivered', 'success'];

    if (paidStates.includes(state)) {
      // Payment confirmed!
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_reference: tracker || `SP-${Date.now()}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      console.log('✅ Payment confirmed for order:', order.order_number);
    } else {
      // Payment failed or cancelled
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      console.log('❌ Payment failed for order:', order.order_number, 'State:', state);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ received: true });
  }
}

// Handle GET requests (redirect-based callbacks)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const tracker = searchParams.get('tracker') || searchParams.get('beacon') || '';
  const orderId = searchParams.get('order_id') || '';

  console.log('Safepay GET callback:', { tracker, orderId });

  // Find order and redirect to payment check
  if (orderId) {
    return NextResponse.redirect(`${siteUrl}/payment-check`);
  }

  return NextResponse.redirect(`${siteUrl}/payment-check`);
}