import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { decryptSecret } from '@/lib/crypto';
import { publishImagePost } from '@/lib/instagram';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = getSupabaseAdmin();
  const { data: post, error: postError } = await supabase.from('posts').select('*').eq('id', id).single();
  if (postError || !post) return NextResponse.json({ error: 'Post não encontrado.' }, { status: 404 });
  if (post.status === 'published') return NextResponse.json({ error: 'Esse post já foi publicado.' }, { status: 409 });

  const { data: connection, error: connectionError } = await supabase.from('instagram_connections').select('*').eq('singleton_key','primary').single();
  if (connectionError || !connection) return NextResponse.json({ error: 'Conecte o Instagram antes de publicar.' }, { status: 400 });

  await supabase.from('posts').update({ status: 'publishing', error_message: null }).eq('id', id);
  try {
    const result = await publishImagePost({ igUserId: connection.ig_user_id, token: decryptSecret(connection.access_token_enc), mediaUrl: post.media_url, caption: post.caption, altText: post.alt_text });
    const publishedAt = new Date().toISOString();
    await supabase.from('posts').update({ status: 'published', ig_container_id: result.containerId, ig_media_id: result.mediaId, published_at: publishedAt }).eq('id', id);
    return NextResponse.json({ ok: true, mediaId: result.mediaId, publishedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao publicar.';
    await supabase.from('posts').update({ status: 'failed', error_message: message }).eq('id', id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
