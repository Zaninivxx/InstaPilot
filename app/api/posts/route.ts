import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return NextResponse.json({ posts: data });
  } catch (error) {
    return NextResponse.json({ posts: [], setupRequired: true, message: error instanceof Error ? error.message : 'Configuração incompleta.' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.caption?.trim() || !body.media_url?.trim()) return NextResponse.json({ error: 'Legenda e mídia são obrigatórias.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('posts').insert({ caption: body.caption.trim(), media_url: body.media_url.trim(), alt_text: body.alt_text?.trim() || null, status: 'draft' }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ post: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao criar rascunho.' }, { status: 500 });
  }
}
