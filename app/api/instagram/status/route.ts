import { NextResponse } from 'next/server';
import { getInstagramChannel } from '@/lib/buffer';

export async function GET() {
  try {
    const channel = await getInstagramChannel();
    return NextResponse.json({
      connected: true,
      connection: {
        username: channel.displayName || channel.name || 'instagram',
        channel_id: channel.id,
        avatar: channel.avatar || null,
        provider: 'buffer',
      },
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      connection: null,
      message: error instanceof Error ? error.message : 'Buffer não configurado.',
    });
  }
}
