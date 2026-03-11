import type { ServerMessage } from "@/types";

export interface ReplyPreview {
  id: string;
  author: string;
  text?: string;
  imageUrl?: string;
}

export const getReplyPreview = (
  msg: ServerMessage,
  authorName: string
): ReplyPreview => {
  const firstAttachment = msg.attachments?.find((att) => att.type === "image");
  return {
    id: msg.id,
    author: authorName,
    text: msg.text,
    imageUrl: firstAttachment?.url,
  };
};
