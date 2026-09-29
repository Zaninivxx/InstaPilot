import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, exchangeLongLivedToken, getInstagramProfile } from '@/lib/instagram';
import { encryptSecret } from '@/lib/crypto';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = req.cookies.get('ig_oauth_state')?.value;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${appUrl}/?ig_error=oauth_state`);
  }

  try {
    const short = await exchangeCode(code);
    const long = await exchangeLongLivedToken(short.access_token);
    const profile = await getInstagramProfile(long.access_token);
    const igUserId = profile.user_id || profile.id || short.user_id;
    const expiresAt = long.expires_in ? new Date(Date.now() + long.expires_in * 1000).toISOString() : null;
    const now = new Date().toISOString();

    const ref = adminDb.collection('instagram_connections').doc('primary');
    const previous = await ref.get();

    await ref.set({
      ig_user_id: igUserId,
      username: profile.username,
      access_token_enc: encryptSecret(long.access_token),
      token_expires_at: expiresAt,
      created_at: previous.exists ? previous.data()?.created_at || now : now,
      updated_at: now,
    }, { merge: true });

    const response = NextResponse.redirect(`${appUrl}/?connected=1`);
    response.cookies.delete('ig_oauth_state');
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(`${appUrl}/?ig_error=connect_failed`);
  }
}
