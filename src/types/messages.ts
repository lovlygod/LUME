export interface Chat {
  id: string;
  userId: string;
  name?: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
  lastMessage: string;
  timestamp: string;
  unread: number;
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
  text: string;
  type?: "text" | "moment_image" | "voice";
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
