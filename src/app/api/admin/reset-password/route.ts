import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Find admin
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await supabaseAdmin
      .from('admins')
      .update({ password_hash: hashedPassword })
      .eq('id', admin.id);

    // Clean up used OTPs
    await supabaseAdmin
      .from('password_resets')
      .delete()
      .eq('email', email.toLowerCase().trim());

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}