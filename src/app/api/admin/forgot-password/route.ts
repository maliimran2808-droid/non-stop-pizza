import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if admin exists
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, email, name')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete old OTPs for this email
    await supabaseAdmin
      .from('password_resets')
      .delete()
      .eq('email', email.toLowerCase().trim());

    // Save OTP with 10 min expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await supabaseAdmin.from('password_resets').insert({
      email: email.toLowerCase().trim(),
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
    });

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'NonStop Pizza <onboarding@resend.dev>',
      to: email.toLowerCase().trim(),
      subject: '🔐 Password Reset Code — NonStop Pizza',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 24px; color: #E8002D; margin: 0;">NonStop Pizza</h1>
            <p style="color: #888; font-size: 14px; margin-top: 4px;">Admin Dashboard</p>
          </div>
          
          <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; text-align: center;">
            <h2 style="color: #333; font-size: 20px; margin: 0 0 10px;">Password Reset Code</h2>
            <p style="color: #666; font-size: 14px; margin: 0 0 24px;">Use this code to reset your password. It expires in 10 minutes.</p>
            
            <div style="background: #fff; border: 2px solid #E8002D; border-radius: 12px; padding: 20px; margin: 0 auto; max-width: 240px;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #E8002D;">${otp}</span>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
          </div>
          
          <p style="text-align: center; color: #ccc; font-size: 11px; margin-top: 30px;">© ${new Date().getFullYear()} NonStop Pizza</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}