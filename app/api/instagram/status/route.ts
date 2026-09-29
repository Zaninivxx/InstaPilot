import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('instagram_connections').select('ig_user_id,username,token_expires_at,updated_at').eq('singleton_key','primary').maybeSingle();
    if (error) throw error;
    return NextResponse.json({ connected: Boolean(data), connection: data || null });
  } catch (error) {
    return NextResponse.json({ connected: false, connection: null, setupRequired: true, message: error instanceof Error ? error.message : 'Configuração incompleta.' });
  }
}
