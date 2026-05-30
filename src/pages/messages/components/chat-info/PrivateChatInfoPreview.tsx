import { Button } from "@/components/ui/button";
import type { User } from "@/types";
import ChatInfoShared from "./ChatInfoShared";
import { normalizeImageUrl } from "@/lib/utils";

type Props = {
  chatId: string;
  user: User | null;
  isOnline: boolean;
  lastSeen: string | null;
  onGoToProfile: () => void;
  onOpenInChat?: (messageId: string) => void;
  t: (key: string, options?: Record<string, string>) => string;
};

export default function PrivateChatInfoPreview({ chatId, user, isOnline, lastSeen, onGoToProfile, onOpenInChat, t }: Props) {
  const formattedLastSeen = lastSeen
    ? new Date(lastSeen).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="relative">
          <div className="h-32 w-full bg-gradient-to-r from-indigo-500/40 via-purple-500/30 to-sky-500/40" />
          <div className="absolute -bottom-7 left-6 h-20 w-20 overflow-hidden rounded-2xl border-2 border-black/60 bg-white/10 shadow-lg">
            {user?.avatar ? (
              <img src={normalizeImageUrl(user.avatar) || ""} alt={user?.name || "User"} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
                {(user?.name || "U").charAt(0)}
              </div>
            )}
          </div>
        </div>
        <div className="px-4 pb-4 pt-10">
        <p className="text-lg font-semibold text-white">{user?.name || "User"}</p>
        <p className="text-sm text-white/60">@{user?.username || "unknown"}</p>
        <p className="mt-2 text-xs text-white/60">
          {isOnline ? t("time.online") : formattedLastSeen ? t("time.lastSeen", { time: formattedLastSeen }) : ""}
        </p>
        <Button type="button" className="mt-3" onClick={onGoToProfile}>{t("messages.chatInfo.goToProfile")}</Button>
        </div>
      </div>
      <ChatInfoShared chatId={chatId} t={t} onOpenInChat={onOpenInChat} />
    </div>
  );
}

