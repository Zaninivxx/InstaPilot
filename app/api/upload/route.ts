import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary ainda não foi configurado na Vercel.' }, { status: 500 });
    }

    const body = await req.json();
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

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'instapilot/posts';
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao preparar upload.' }, { status: 500 });
  }
}
