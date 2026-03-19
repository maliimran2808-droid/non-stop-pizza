import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nonstop-pizza-admin-secret-key-2025';

export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { action } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }

    switch (action) {
      case 'clear_orders': {
        // Delete order items first
        await supabaseAdmin.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Then delete orders
        await supabaseAdmin.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        return NextResponse.json({ success: true, message: 'All orders cleared' });
      }

      case 'clear_complaints': {
        await supabaseAdmin.from('complaints').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        return NextResponse.json({ success: true, message: 'All complaints cleared' });
      }

      case 'clear_vouchers': {
        await supabaseAdmin.from('vouchers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        return NextResponse.json({ success: true, message: 'All vouchers cleared' });
      }

      case 'reset_settings': {
        // Delete all settings
        await supabaseAdmin.from('site_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Insert defaults
        const defaults = [
          { key: 'restaurant_name', value: 'NonStop Pizza' },
          { key: 'restaurant_phone', value: '+92-XXX-XXXXXXX' },
          { key: 'restaurant_email', value: 'info@nonstoppizza.com' },
          { key: 'delivery_fee', value: '150' },
          { key: 'min_order_amount', value: '500' },
          { key: 'delivery_time', value: '30-45 mins' },
        ];

        for (const setting of defaults) {
          await supabaseAdmin.from('site_settings').insert(setting);
        }

        return NextResponse.json({ success: true, message: 'Settings reset to defaults' });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err) {
    console.error('Danger action error:', err);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}