import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nonstop-pizza-admin-secret-key-2025';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { newEmail, password } = await request.json();

    if (!newEmail || !newEmail.trim()) {
      return NextResponse.json({ error: 'New email is required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required to change email' }, { status: 400 });
    }

    // Get admin
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    // Check if email already taken
    const { data: existing } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', newEmail.toLowerCase().trim())
      .neq('id', admin.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'This email is already in use' }, { status: 400 });
    }

    // Update email
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({ email: newEmail.toLowerCase().trim() })
      .eq('id', admin.id);

    if (updateError) throw updateError;

    // Generate new token with updated email
    const newToken = jwt.sign(
      { id: admin.id, email: newEmail.toLowerCase().trim(), name: admin.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({ success: true, email: newEmail.toLowerCase().trim() });

    response.cookies.set('admin_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Change email error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}