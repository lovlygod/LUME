import { Button } from "@/components/ui/button";
import ChatInfoShared from "./ChatInfoShared";

type Props = {
  chatId: string;
  title?: string | null;
  membersCount?: number;
  onGoToProfile?: () => void;
  onOpenInChat?: (messageId: string) => void;
  t: (key: string, options?: Record<string, string>) => string;
};

export default function GroupChatInfoPreview({ chatId, title, membersCount, onGoToProfile, onOpenInChat, t }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-lg font-semibold text-white">{title || t("messages.chatTypeGroup")}</p>
        <p className="text-sm text-white/60">{t("messages.chatMembersCount", { count: String(membersCount || 0) })}</p>
        {onGoToProfile && (
          <Button type="button" className="mt-3" onClick={onGoToProfile}>{t("messages.chatInfo.goToProfile")}</Button>
        )}
      </div>
      <ChatInfoShared chatId={chatId} t={t} onOpenInChat={onOpenInChat} />
    </div>
  );
}

