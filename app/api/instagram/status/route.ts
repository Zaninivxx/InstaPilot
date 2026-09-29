import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snap = await adminDb.collection('instagram_connections').doc('primary').get();
    if (!snap.exists) return NextResponse.json({ connected: false, connection: null });

    const data = snap.data()!;
    return NextResponse.json({
      connected: true,
      connection: {
        ig_user_id: data.ig_user_id,
        username: data.username,
        token_expires_at: data.token_expires_at || null,
        updated_at: data.updated_at || null,
      },
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      connection: null,
      setupRequired: true,
      message: error instanceof Error ? error.message : 'Configuração incompleta.',
    });
  }
}
