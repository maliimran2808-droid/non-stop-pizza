import { NextRequest, NextResponse } from 'next/server';
import { createPaymentTracker } from '@/lib/safepay';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount } = await request.json();

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Order ID and amount are required' },
        { status: 400 }
      );
    }

    // Verify order exists
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('Creating payment for:', order.order_number, 'Amount:', amount);

    // Create Safepay payment tracker
    const { token, checkoutUrl } = await createPaymentTracker(
      Number(amount),
      order.order_number
    );

    console.log('Token:', token);
    console.log('Checkout URL:', checkoutUrl);

    // Save token to order
    await supabaseAdmin
      .from('orders')
      .update({
        payment_reference: token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      checkoutUrl,
    });
  } catch (err: any) {
    console.error('Payment error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}