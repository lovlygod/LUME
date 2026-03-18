import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { messagesAPI } from "@/services/api";
import { messageQueryKeys } from "../hooks/queryKeys";

type ChatType = "group" | "channel";

interface CreateChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (chatId: string) => void;
  t: (key: string) => string;
}

const CreateChatModal = ({ open, onOpenChange, onCreated, t }: CreateChatModalProps) => {
  const queryClient = useQueryClient();
  const [type, setType] = useState<ChatType>("group");
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setType("group");
    setTitle("");
    setUsername("");
    setIsPublic(false);
  };

  const handleSubmit = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast.error(t("messages.createChatTitleRequired") || "Введите название группы или канала");
      return;
    }

    const cleanUsername = username.trim();
    if (isPublic && !cleanUsername) {
      toast.error(t("messages.createChatUsernameRequired") || "Введите юзернейм");
      return;
    }
    if (cleanUsername && !/^[a-z0-9]{5,}$/i.test(cleanUsername)) {
      toast.error(t("messages.chatUsernameInvalid") || "Юзернейм может содержать только латиницу и цифры и быть от 5 символов");
      return;
    }
    setSubmitting(true);
    try {
        const response = await messagesAPI.createChat({
          type,
          title: cleanTitle,
          isPublic,
          isPrivate: !isPublic,
          ...(cleanUsername ? { username: cleanUsername } : {}),
        });

      await queryClient.invalidateQueries({
        queryKey: messageQueryKeys.chatList(),
      });

      if (response.chatId) {
        onCreated(response.chatId);
      }
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("messages.createChatError") || "Не удалось создать чат";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">{t("messages.createChatTitle") || "Создать чат"}</DialogTitle>
          <DialogDescription className="text-white/60">
            {t("messages.createChatDescription") || "Создайте группу или канал. Участников можно добавить позже."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-white/80">{t("messages.createChatType") || "Тип"}</Label>
            <div className="mt-2 inline-flex rounded-full bg-white/5 p-1">
              <Button
                type="button"
                size="sm"
                variant={type === "group" ? "default" : "ghost"}
                onClick={() => setType("group")}
              >
                {t("messages.chatTypeGroup") || "Группа"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={type === "channel" ? "default" : "ghost"}
                onClick={() => setType("channel")}
              >
                {t("messages.chatTypeChannel") || "Канал"}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-white/80">{t("messages.createChatName") || "Название"}</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("messages.createChatNamePlaceholder") || "Например, Команда"}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-white/80">{t("messages.createChatUsername") || "Юзернейм"}</Label>
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={t("messages.createChatUsernamePlaceholder") || "например, lume_team"}
              className="mt-2"
              disabled={!isPublic}
            />
            {!isPublic && (
              <p className="mt-1 text-xs text-white/40">{t("messages.createChatUsernamePrivateHint") || "Для приватных чат/каналов юзернейм недоступен"}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm text-white">{t("messages.createChatPublic") || "Публичный чат"}</p>
              <p className="text-xs text-white/40">
                {t("messages.createChatPublicHint") || "Публичные чаты видны по юзернейму"}
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            {t("common.cancel") || "Отмена"}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t("common.loading") || "Создание..." : t("messages.createChatSubmit") || "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChatModal;
