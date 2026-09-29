import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || 'image.jpg');
    const contentType = String(body.contentType || 'image/jpeg');
    const size = Number(body.size || 0);

    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Apenas imagens são aceitas neste MVP.' }, { status: 400 });
    }

    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: 'Arquivo inválido.' }, { status: 400 });
    }

    if (size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem acima de 25 MB.' }, { status: 400 });
    }

    const ext = name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const objectPath = `post-media/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const bucket = adminStorage.bucket();
    const object = bucket.file(objectPath);

    const [uploadUrl] = await object.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    const [readUrl] = await object.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: new Date('2035-03-01T00:00:00Z'),
    });

    return NextResponse.json({ uploadUrl, url: readUrl, path: objectPath });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao preparar upload.' }, { status: 500 });
  }
}
