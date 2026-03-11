import { ReplyBar } from "@/components/chat/ReplyBar";
import type { ReplyPreview } from "../hooks/useReply";

interface ChannelReplyBarProps {
  replyTo: ReplyPreview | null;
  onClear: () => void;
}

export const ChannelReplyBar = ({ replyTo, onClear }: ChannelReplyBarProps) => {
  if (!replyTo) return null;
  return (
    <ReplyBar
      author={replyTo.author}
      text={replyTo.text}
      imageUrl={replyTo.imageUrl}
      onClose={onClear}
    />
  );
};
