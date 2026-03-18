import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { messagesAPI, uploadsAPI } from "@/services/api";
import { messageQueryKeys } from "../hooks/queryKeys";
import type { Chat } from "@/types/messages";
import { normalizeImageUrl } from "@/lib/utils";

interface ChatSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat | null;
  t: (key: string) => string;
}

const ChatSettingsModal = ({ open, onOpenChange, chat, t }: ChatSettingsModalProps) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [memberId, setMemberId] = useState("");
  const [memberUsername, setMemberUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [joinRequests, setJoinRequests] = useState<Array<{ id: string; userId: string; createdAt: string; user: { id: string; name?: string | null; username?: string | null; avatar?: string | null; verified?: boolean } }>>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const canManage = useMemo(() => {
    if (!chat) return false;
    return chat.type !== "private" && (chat.role === "owner" || chat.role === "admin");
  }, [chat]);

  const resetState = () => {
    setTitle(chat?.title || "");
    setUsername(chat?.username || "");
    setIsPublic(Boolean(chat?.isPublic));
    setAvatarPreview(null);
    setAvatarUrl(chat?.avatar || null);
    setInviteToken(chat?.inviteToken || null);
    setMemberId("");
    setMemberUsername("");
  };

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open, chat?.id]);

  useEffect(() => {
    if (!open || !chat?.id || !canManage || chat.type === "private" || chat.isPublic) {
      setJoinRequests([]);
      return;
    }
    setLoadingRequests(true);
    messagesAPI
      .listJoinRequests(chat.id)
      .then((res) => {
        setJoinRequests(res.requests || []);
      })
      .catch(() => {
        setJoinRequests([]);
      })
      .finally(() => setLoadingRequests(false));
  }, [open, chat?.id, chat?.isPublic, chat?.type, canManage]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !chat) return;
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    try {
      const uploaded = await uploadsAPI.uploadFile(file);
      setAvatarUrl(uploaded.url || null);
      toast.success(t("messages.chatAvatarUploaded") || "Аватар обновлён");
    } catch (error) {
      toast.error(t("messages.chatAvatarUploadError") || "Не удалось загрузить аватар");
    }
  };

  const handleSave = async () => {
    if (!chat) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast.error(t("messages.chatTitleRequired") || "Введите название");
      return;
    }
    const trimmedUsername = username.trim();
    if (isPublic && !trimmedUsername) {
      toast.error(t("messages.createChatUsernameRequired") || "Введите юзернейм");
      return;
    }
    if (trimmedUsername && !/^[a-z0-9]{5,}$/i.test(trimmedUsername)) {
      toast.error(t("messages.chatUsernameInvalid") || "Юзернейм может содержать только латиницу и цифры и быть от 5 символов");
      return;
    }
    setSaving(true);
    try {
      const nextUsername = trimmedUsername || null;
      const response = await messagesAPI.updateChat(chat.id, {
        title: cleanTitle,
        username: nextUsername,
        isPublic,
        isPrivate: !isPublic,
        avatar: avatarUrl || chat.avatar || null,
      });
      if (response.chat?.inviteToken) {
        setInviteToken(response.chat.inviteToken);
      }
      await queryClient.invalidateQueries({ queryKey: messageQueryKeys.chatList() });
      toast.success(t("messages.chatSaved") || "Изменения сохранены");
      if (isPublic && nextUsername) {
        window.location.assign(`/messages/@${nextUsername}`);
        return;
      }
      onOpenChange(false);
    } catch (error) {
      const err = error as { error?: { code?: string; message?: string } } | null;
      if (err?.error?.code === "USERNAME_TAKEN") {
        toast.error(t("messages.chatUsernameTaken") || "Юзернейм уже занят");
        return;
      }
      if (err?.error?.code === "CHAT_USERNAME_INVALID") {
        toast.error(t("messages.chatUsernameInvalid") || "Юзернейм может содержать только латиницу и цифры");
        return;
      }
      toast.error(t("messages.chatSaveError") || "Не удалось сохранить чат");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!chat) return;
    const cleanId = memberId.trim();
    const cleanUsername = memberUsername.trim().replace(/^@+/, "");
    if (!cleanId && !cleanUsername) {
      toast.error(t("messages.chatMemberIdRequired") || "Введите ID пользователя или юзернейм");
      return;
    }
    setAddingMember(true);
    try {
      await messagesAPI.addChatMember(chat.id, {
        ...(cleanId ? { userId: cleanId } : {}),
        ...(cleanUsername ? { username: cleanUsername } : {}),
      });
      await queryClient.invalidateQueries({ queryKey: messageQueryKeys.chatList() });
      toast.success(t("messages.chatMemberAdded") || "Участник добавлен");
      setMemberId("");
      setMemberUsername("");
    } catch (error) {
      toast.error(t("messages.chatMemberAddError") || "Не удалось добавить участника");
    } finally {
      setAddingMember(false);
    }
  };

  const handleReviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!chat) return;
    try {
      await messagesAPI.reviewJoinRequest(chat.id, requestId, action);
      setJoinRequests((prev) => prev.filter((req) => req.id !== requestId));
      await queryClient.invalidateQueries({ queryKey: messageQueryKeys.chatList() });
      toast.success(action === 'approve' ? t("messages.joinRequestApproved") : t("messages.joinRequestRejected"));
    } catch (error) {
      toast.error(t("messages.joinRequestReviewError") || "Не удалось обновить заявку");
    }
  };

  const settingsDisabled = !canManage;
  const canDeleteChat = Boolean(chat && chat.type !== "private" && chat.role === "owner");

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">{t("messages.chatSettingsTitle") || "Настройки чата"}</DialogTitle>
          <DialogDescription className="text-white/60">
            {t("messages.chatSettingsDescription") || "Управляйте названием, аватаром и участниками"}
          </DialogDescription>
        </DialogHeader>

        {!chat ? (
          <div className="text-sm text-white/50">{t("messages.chatSettingsEmpty") || "Чат не выбран"}</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs text-white/70">
                {avatarPreview || avatarUrl || chat.avatar ? (
                  <img
                    src={normalizeImageUrl(avatarPreview || avatarUrl || chat.avatar || "") || ""}
                    alt={chat.title || "chat"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (chat.title || "C").charAt(0)
                )}
              </div>
              <div className="space-y-3">
                <Label className="text-white/80">{t("messages.chatAvatar") || "Аватар"}</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="chat-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={settingsDisabled}
                    className="hidden"
                  />
                  <Button asChild type="button" variant="outline" disabled={settingsDisabled}>
                    <label htmlFor="chat-avatar-upload" className="cursor-pointer rounded-full px-5">
                      {t("messages.chatAvatarChoose") || "Выбрать файл"}
                    </label>
                  </Button>
                  <span className="text-xs text-white/40">
                    {t("messages.chatAvatarHint") || "PNG/JPG до 5MB"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-white/80">{t("messages.chatTitle") || "Название"}</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2" disabled={settingsDisabled} />
            </div>

            <div>
              <Label className="text-white/80">{t("messages.chatUsername") || "Юзернейм"}</Label>
              <Input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2" disabled={settingsDisabled || !isPublic} />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-sm text-white">{t("messages.chatPublic") || "Публичный чат"}</p>
                <p className="text-xs text-white/40">{t("messages.chatPublicHint") || "Доступен по юзернейму"}</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} disabled={settingsDisabled} />
            </div>

            {chat.isPrivate && (
              <div>
                <Label className="text-white/80">{t("messages.chatInviteLink") || "Ссылка для приглашения"}</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={`${window.location.origin}/invite/${inviteToken || ''}`}
                    readOnly
                    onClick={(event) => {
                      const value = event.currentTarget.value;
                      navigator.clipboard.writeText(value).then(() => {
                        toast.success(t("messages.inviteCopied") || "Ссылка скопирована");
                      }).catch(() => null);
                    }}
                  />
                    <Button
                      type="button"
                      variant="secondary"
                    onClick={async () => {
                      if (!chat) return;
                      try {
                        const response = await messagesAPI.updateChat(chat.id, {
                          regenerateInvite: true,
                          isPublic,
                          isPrivate: !isPublic,
                        });
                        if (response.chat?.inviteToken) {
                          setInviteToken(response.chat.inviteToken);
                        }
                        await queryClient.invalidateQueries({ queryKey: messageQueryKeys.chatList() });
                      } catch (error) {
                        toast.error(t("messages.chatInviteRegenerateError") || "Не удалось обновить ссылку");
                      }
                    }}
                      disabled={settingsDisabled || saving}
                    >
                    {t("messages.chatInviteRegenerate") || "Обновить"}
                  </Button>
                </div>
              </div>
            )}

            {chat.isPublic && chat.username && (
              <div>
                <Label className="text-white/80">{t("messages.chatPublicLink") || "Публичная ссылка"}</Label>
                <Input
                  value={`${window.location.origin}/messages/@${chat.username}`}
                  readOnly
                  className="mt-2"
                  onClick={(event) => {
                    const value = event.currentTarget.value;
                    navigator.clipboard.writeText(value).then(() => {
                      toast.success(t("messages.inviteCopied") || "Ссылка скопирована");
                    }).catch(() => null);
                  }}
                />
              </div>
            )}

            {canManage && !chat.isPublic && (
              <div>
                <Label className="text-white/80">{t("messages.joinRequests") || "Заявки на вступление"}</Label>
                <div className="mt-2 space-y-2">
                  {loadingRequests ? (
                    <div className="text-xs text-white/40">{t("common.loading") || "Загрузка..."}</div>
                  ) : joinRequests.length === 0 ? (
                    <div className="text-xs text-white/40">{t("messages.joinRequestsEmpty") || "Нет заявок"}</div>
                  ) : (
                    joinRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                        <div className="text-sm text-white/80">
                          {request.user?.name || request.user?.username || request.userId}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => handleReviewRequest(request.id, 'approve')}>
                            {t("messages.joinRequestApprove") || "Принять"}
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => handleReviewRequest(request.id, 'reject')}>
                            {t("messages.joinRequestReject") || "Отклонить"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div>
              <Label className="text-white/80">{t("messages.chatAddMember") || "Добавить участника"}</Label>
              <div className="mt-2 grid gap-2">
                <div className="flex gap-2">
                  <Input
                    value={memberId}
                    onChange={(event) => setMemberId(event.target.value)}
                    placeholder={t("messages.chatMemberIdPlaceholder") || "ID пользователя"}
                  />
                  <Input
                    value={memberUsername}
                    onChange={(event) => setMemberUsername(event.target.value)}
                    placeholder={t("messages.chatMemberUsernamePlaceholder") || "username"}
                  />
                </div>
                <div className="flex justify-center">
                  <Button type="button" variant="secondary" onClick={handleAddMember} disabled={!canManage || addingMember}>
                    {addingMember ? t("common.loading") || "Загрузка..." : t("messages.chatAddMemberAction") || "Добавить"}
                  </Button>
                </div>
              </div>
              {!canManage && (
                <p className="mt-2 text-xs text-white/40">{t("messages.chatManageOnlyAdmins") || "Добавлять участников могут только админы"}</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          {canDeleteChat && (
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(true)}>
              {t("messages.chatDeleteButton") || "Удалить"}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
            {t("common.cancel") || "Отмена"}
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canManage || saving}>
            {saving ? t("common.loading") || "Сохранение..." : t("common.save") || "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("messages.chatDeleteTitle") || "Удалить чат?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("messages.chatDeleteDescription") || "Все сообщения и данные будут удалены. Это действие нельзя отменить."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel") || "Отмена"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!chat?.id) return;
                messagesAPI
                  .deleteChat(chat.id)
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: messageQueryKeys.chatList() });
                    onOpenChange(false);
                    window.location.assign("/messages");
                  })
                  .catch(() => null);
              }}
            >
              {t("messages.chatDeleteConfirm") || "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatSettingsModal;
