import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { decryptSecret } from '@/lib/crypto';
import { publishImagePost } from '@/lib/instagram';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const postRef = adminDb.collection('posts').doc(id);
  const postSnap = await postRef.get();

  if (!postSnap.exists) return NextResponse.json({ error: 'Post não encontrado.' }, { status: 404 });

  const post = postSnap.data()!;
  if (post.status === 'published') return NextResponse.json({ error: 'Esse post já foi publicado.' }, { status: 409 });

  const connectionSnap = await adminDb.collection('instagram_connections').doc('primary').get();
  if (!connectionSnap.exists) return NextResponse.json({ error: 'Conecte o Instagram antes de publicar.' }, { status: 400 });

  const connection = connectionSnap.data()!;

  await postRef.update({ status: 'publishing', error_message: null });

  try {
    const result = await publishImagePost({
      igUserId: connection.ig_user_id,
      token: decryptSecret(connection.access_token_enc),
      mediaUrl: post.media_url,
      caption: post.caption,
      altText: post.alt_text,
    });

    const publishedAt = new Date().toISOString();
    await postRef.update({
      status: 'published',
      ig_container_id: result.containerId,
      ig_media_id: result.mediaId,
      published_at: publishedAt,
      error_message: null,
    });

    return NextResponse.json({ ok: true, mediaId: result.mediaId, publishedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao publicar.';
    await postRef.update({ status: 'failed', error_message: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
