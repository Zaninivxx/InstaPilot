import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { publishInstagramImage } from '@/lib/buffer';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const postRef = adminDb.collection('posts').doc(id);
  const postSnap = await postRef.get();

  if (!postSnap.exists) return NextResponse.json({ error: 'Post não encontrado.' }, { status: 404 });

  const post = postSnap.data()!;
  if (post.status === 'published') return NextResponse.json({ error: 'Esse post já foi enviado.' }, { status: 409 });

  await postRef.update({ status: 'publishing', error_message: null });

  try {
    const result = await publishInstagramImage({
      mediaUrl: post.media_url,
      caption: post.caption,
      altText: post.alt_text,
    });

    const publishedAt = new Date().toISOString();
    await postRef.update({
      status: 'published',
      buffer_post_id: result.postId,
      buffer_channel_id: result.channel.id,
      buffer_status: result.status,
      external_link: result.externalLink,
      published_at: publishedAt,
      error_message: null,
    });

    return NextResponse.json({
      ok: true,
      bufferPostId: result.postId,
      publishedAt,
      externalLink: result.externalLink,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao publicar pelo Buffer.';
    await postRef.update({ status: 'failed', error_message: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
