export type PostStatus = 'draft' | 'approved' | 'publishing' | 'published' | 'failed';

export interface PostRecord {
  id: string;
  caption: string;
  media_url: string;
  alt_text?: string | null;
  status: PostStatus;
  created_at: string;
  published_at?: string | null;
  ig_media_id?: string | null;
  error_message?: string | null;
}

export interface InstagramConnection {
  id: string;
  ig_user_id: string;
  username: string;
  access_token_enc: string;
  token_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}
