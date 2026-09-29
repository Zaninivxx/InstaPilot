import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snap = await adminDb.collection('posts').orderBy('created_at', 'desc').limit(50).get();
    const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ posts: [], setupRequired: true, message: error instanceof Error ? error.message : 'Configuração incompleta.' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.caption?.trim() || !body.media_url?.trim()) {
      return NextResponse.json({ error: 'Legenda e mídia são obrigatórias.' }, { status: 400 });
    }

    const post = {
      caption: body.caption.trim(),
      media_url: body.media_url.trim(),
      alt_text: body.alt_text?.trim() || null,
      status: 'draft',
      created_at: new Date().toISOString(),
      published_at: null,
      ig_container_id: null,
      ig_media_id: null,
      error_message: null,
    };

    const ref = await adminDb.collection('posts').add(post);
    return NextResponse.json({ post: { id: ref.id, ...post } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao criar rascunho.' }, { status: 500 });
  }
}
