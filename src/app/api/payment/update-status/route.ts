import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentStatus } = await request.json();

    if (!orderId || !paymentStatus) {
      return NextResponse.json(
        { error: 'Missing fields' },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from('orders')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update status error:', err);
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    );
  }
}