export interface Chat {
  id: string;
  type: "private" | "group" | "channel";
  title?: string | null;
  avatar?: string | null;
  ownerId?: string | null;
  isPublic?: boolean;
  isPrivate?: boolean;
  username?: string | null;
  inviteToken?: string | null;
  publicNumber?: string | null;
  routeId?: string | null;
  role?: "owner" | "admin" | "member";
  members?: Array<{
    id: string;
    role: "owner" | "admin" | "member";
    name?: string | null;
    username?: string | null;
    avatar?: string | null;
    verified?: boolean;
  }>;
  verified?: boolean;
  lastMessage: string;
  lastMessageType?: "text" | "image" | "sticker" | "voice" | "moment_image";
  timestamp: string;
  unread?: number;
}

export interface Attachment {
  id: string;
  messageId?: string | null;
  type: "image" | "file" | "voice";
  url: string;
  mime: string;
  size: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  createdAt?: string;
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

export interface Message {
  id: string;
  senderId: string;
  sender?: {
    id?: string;
    name?: string | null;
    username?: string | null;
    avatar?: string | null;
    verified?: boolean;
  } | null;
  text: string;
  type?: "text" | "moment_image" | "voice" | "sticker";
  sticker?: {
    id: string;
    packId?: string | null;
    name?: string | null;
    filePath?: string | null;
    url?: string | null;
  } | null;
  moment?: {
    id: string;
    thumbDataUrl?: string | null;
    ttlSeconds?: number | null;
    expiresAt?: string | null;
    viewedAt?: string | null;
  } | null;
  timestamp: string;
  own: boolean;
  attachments?: Attachment[];
  deletedForMe?: boolean;
  deletedForAll?: boolean;
  replyToMessageId?: string | null;
  linkPreview?: LinkPreview | null;
}
