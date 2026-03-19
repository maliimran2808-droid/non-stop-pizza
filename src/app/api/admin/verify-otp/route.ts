import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    // Find OTP
    const { data: reset } = await supabaseAdmin
      .from('password_resets')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('otp_code', otp.trim())
      .eq('is_used', false)
      .single();

    if (!reset) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    // Check expiry
    if (new Date(reset.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Code has expired. Request a new one.' }, { status: 400 });
    }

    // Mark as used
    await supabaseAdmin
      .from('password_resets')
      .update({ is_used: true })
      .eq('id', reset.id);

    return NextResponse.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}