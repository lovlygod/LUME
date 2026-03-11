export interface Server {
  id: number;
  username: string | null;
  name: string;
  description: string | null;
  iconUrl: string | null;
  type: 'public' | 'private';
  ownerId: number;
  isMember: boolean;
  role?: {
    id: number;
    name: string;
    rank: number;
    permissions?: Record<string, boolean>;
  } | null;
  channels?: Channel[];
  joinRequest?: {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
  } | null;
}

export interface Channel {
  id: number;
  name: string;
  type: 'text';
  position: number;
}

export interface Member {
  id: number;
  name: string;
  username: string;
  avatar: string;
  verified: boolean;
  role: {
    id: number;
    name: string;
    rank: number;
  };
}

export interface JoinRequest {
  id: number;
  userId: number;
  name: string;
  username: string;
  avatar: string;
  verified: boolean;
  createdAt: string;
}

export interface LinkPreview {
  url: string;
  domain: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  siteName?: string | null;
  faviconUrl?: string | null;
}

export interface ServerMessage {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  createdAt: string;
  editedAt?: string;
  deleted: boolean;
  linkPreview?: LinkPreview | null;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  attachments: Array<{
    id: string;
    type: 'image' | 'file';
    url: string;
    mime: string;
    size: number;
    width?: number;
    height?: number;
  }>;
}

