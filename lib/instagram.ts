const apiVersion = process.env.INSTAGRAM_API_VERSION || 'v25.0';
const graphBase = `https://graph.instagram.com/${apiVersion}`;

export function instagramAuthorizeUrl(state: string) {
  const appId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  if (!appId || !redirectUri) throw new Error('INSTAGRAM_APP_ID/INSTAGRAM_REDIRECT_URI não configurados.');

  const url = new URL('https://www.instagram.com/oauth/authorize');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'instagram_business_basic,instagram_business_content_publish');
  url.searchParams.set('state', state);
  url.searchParams.set('enable_fb_login', '0');
  url.searchParams.set('force_authentication', '1');
  return url.toString();
}

export async function exchangeCode(code: string) {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) throw new Error('Credenciais do Instagram incompletas.');

  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code: code.replace(/#_$/, '')
  });

  const response = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store'
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error_message || json.error?.message || 'Falha no OAuth do Instagram.');
  return json as { access_token: string; user_id: string };
}

export async function exchangeLongLivedToken(shortToken: string) {
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appSecret) throw new Error('INSTAGRAM_APP_SECRET ausente.');
  const url = new URL(`${graphBase}/access_token`);
  url.searchParams.set('grant_type', 'ig_exchange_token');
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('access_token', shortToken);
  const response = await fetch(url, { cache: 'no-store' });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message || 'Falha ao obter token de longa duração.');
  return json as { access_token: string; token_type: string; expires_in?: number };
}

export async function getInstagramProfile(token: string) {
  const url = new URL(`${graphBase}/me`);
  url.searchParams.set('fields', 'user_id,username,name,profile_picture_url');
  url.searchParams.set('access_token', token);
  const response = await fetch(url, { cache: 'no-store' });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message || 'Não foi possível ler a conta do Instagram.');
  return json as { user_id?: string; id?: string; username: string; name?: string; profile_picture_url?: string };
}

export async function publishImagePost(args: { igUserId: string; token: string; mediaUrl: string; caption: string; altText?: string | null }) {
  const createBody = new URLSearchParams({
    image_url: args.mediaUrl,
    caption: args.caption,
    access_token: args.token
  });
  if (args.altText) createBody.set('alt_text', args.altText);

  const create = await fetch(`${graphBase}/${args.igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: createBody,
    cache: 'no-store'
  });
  const container = await create.json();
  if (!create.ok) throw new Error(container.error?.message || 'Instagram rejeitou a criação do container.');

  const publishBody = new URLSearchParams({ creation_id: container.id, access_token: args.token });
  const publish = await fetch(`${graphBase}/${args.igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: publishBody,
    cache: 'no-store'
  });
  const published = await publish.json();
  if (!publish.ok) throw new Error(published.error?.message || 'Instagram rejeitou a publicação.');
  return { containerId: container.id as string, mediaId: published.id as string };
}
