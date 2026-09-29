const BUFFER_API_URL = 'https://api.buffer.com';

type BufferChannel = {
  id: string;
  name?: string | null;
  displayName?: string | null;
  service: string;
  avatar?: string | null;
  isDisconnected?: boolean;
  isLocked?: boolean;
};

async function bufferGraphQL<T>(query: string): Promise<T> {
  const token = process.env.BUFFER_API_KEY;
  if (!token) throw new Error('BUFFER_API_KEY não configurada na Vercel.');

  const response = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) throw new Error(`Buffer API HTTP ${response.status}`);
  if (json.errors?.length) throw new Error(json.errors.map((e: { message?: string }) => e.message).filter(Boolean).join(' | ') || 'Erro na Buffer API.');
  return json.data as T;
}

export async function getInstagramChannel(): Promise<BufferChannel> {
  const configuredId = process.env.BUFFER_CHANNEL_ID?.trim();

  if (configuredId) {
    const data = await bufferGraphQL<{ channel: BufferChannel }>(`
      query GetChannel {
        channel(input: { id: "${configuredId}" }) {
          id name displayName service avatar isDisconnected isLocked
        }
      }
    `);
    if (data.channel.service !== 'instagram') throw new Error('BUFFER_CHANNEL_ID não aponta para um canal do Instagram.');
    if (data.channel.isDisconnected) throw new Error('O canal do Instagram está desconectado no Buffer.');
    if (data.channel.isLocked) throw new Error('O canal do Instagram está bloqueado no Buffer.');
    return data.channel;
  }

  const account = await bufferGraphQL<{ account: { organizations: Array<{ id: string; name: string }> } }>(`
    query GetOrganizations {
      account { organizations { id name } }
    }
  `);

  for (const org of account.account.organizations || []) {
    const data = await bufferGraphQL<{ channels: BufferChannel[] }>(`
      query GetChannels {
        channels(input: { organizationId: "${org.id}" }) {
          id name displayName service avatar isDisconnected isLocked
        }
      }
    `);
    const instagram = (data.channels || []).find(c => c.service === 'instagram' && !c.isDisconnected && !c.isLocked);
    if (instagram) return instagram;
  }

  throw new Error('Nenhum Instagram conectado e ativo foi encontrado no Buffer.');
}

function gqlString(value: string) {
  return JSON.stringify(value);
}

export async function publishInstagramImage(input: {
  mediaUrl: string;
  caption: string;
  altText?: string | null;
}) {
  const channel = await getInstagramChannel();
  const alt = input.altText?.trim();
  const metadata = alt ? `metadata: { altText: ${gqlString(alt)} }` : '';

  const query = `
    mutation CreateInstagramPost {
      createPost(input: {
        text: ${gqlString(input.caption)}
        channelId: ${gqlString(channel.id)}
        schedulingType: automatic
        mode: shareNow
        assets: [{ image: { url: ${gqlString(input.mediaUrl)} ${metadata} } }]
        metadata: { instagram: { type: post, shouldShareToFeed: true } }
      }) {
        ... on PostActionSuccess {
          post { id text dueAt status externalLink }
        }
        ... on MutationError { message }
      }
    }
  `;

  const data = await bufferGraphQL<{ createPost: { post?: { id: string; status?: string; externalLink?: string | null }; message?: string } }>(query);
  const result = data.createPost;
  if (!result?.post?.id) throw new Error(result?.message || 'O Buffer não criou a publicação.');

  return {
    channel,
    postId: result.post.id,
    status: result.post.status || 'buffer',
    externalLink: result.post.externalLink || null,
  };
}
