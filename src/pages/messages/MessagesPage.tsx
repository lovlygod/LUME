import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutGroup, AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types";
import type { Attachment, Message } from "@/types/messages";
import type { Sticker, StickerPack } from "@/types/stickers";
import { API_BASE_URL } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { messagesAPI, profileAPI, uploadsAPI, usersAPI, stickersAPI } from "@/services/api";
import { messageSounds } from "@/services/messageSounds";
import { wsService } from "@/services/websocket";
import { messageQueryKeys } from "./hooks/queryKeys";
import { useChats } from "./hooks/useChats";
import { useChat } from "./hooks/useChat";
import { useChatMessages } from "./hooks/useChatMessages";
import { useSendMessage } from "./hooks/useSendMessage";
import { useDeleteMessage } from "./hooks/useDeleteMessage";
import { useMarkRead } from "./hooks/useMarkRead";
import { useChatWs } from "./hooks/useChatWs";
import ChatList from "./components/ChatList";
import ChatPanel from "./components/ChatPanel";
import MessageList from "./components/MessageList";
import MessageComposer from "./components/MessageComposer";
import { MessageSearch } from "./components/MessageSearch";
import { ImageViewer } from "@/components/media/ImageViewer";
import StickerModal from "@/components/stickers/StickerModal";
import TypingIndicator from "@/components/chat/TypingIndicator";
import MessageContextMenu from "@/components/chat/MessageContextMenu";

interface ReplyPreview {
  id: string;
  author: string;
  text?: string;
  imageUrl?: string;
}

const MessagesPage = () => {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");

  const [selectedChatId, setSelectedChatId] = useState<string | null>(chatId || null);
  const [msgText, setMsgText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [momentFile, setMomentFile] = useState<File | null>(null);
  const [momentPreview, setMomentPreview] = useState<string | null>(null);
  const [momentToggle, setMomentToggle] = useState(false);
  const [momentOpenMap, setMomentOpenMap] = useState<Record<string, string>>({});
  const [momentLoadingMap, setMomentLoadingMap] = useState<Record<string, boolean>>({});
  const [momentBlockedMap, setMomentBlockedMap] = useState<Record<string, boolean>>({});
  const [replyTo, setReplyTo] = useState<ReplyPreview | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [stickersOpen, setStickersOpen] = useState(false);
  const [myStickerPacks, setMyStickerPacks] = useState<StickerPack[]>([]);
  const [lumeStickerPacks, setLumeStickerPacks] = useState<StickerPack[]>([]);
  const [stickersByPack, setStickersByPack] = useState<Record<string, Sticker[]>>({});
  const [activeStickerPackId, setActiveStickerPackId] = useState<string | null>(null);
  const [stickerModalOpen, setStickerModalOpen] = useState(false);
  const [activeSticker, setActiveSticker] = useState<Sticker | null>(null);
  const [activeStickerPack, setActiveStickerPack] = useState<StickerPack | null>(null);
  const [doubleClickAction, setDoubleClickAction] = useState<"reply" | "heart">("reply");
  const [reactionMap, setReactionMap] = useState<Record<string, boolean>>({});
  const [contextMenuState, setContextMenuState] = useState<{
    message: Message;
    position: { x: number; y: number };
  } | null>(null);
  const typingStopTimerRef = useRef<number | null>(null);
  const typingDebounceRef = useRef<number | null>(null);

  const queryClient = useQueryClient();

  const { data: chatsData, isLoading } = useChats();
  const { data: chatUserData } = useChat(selectedChatId);
  const { data: messagesData, isLoading: messagesLoading } = useChatMessages(selectedChatId);
  const sendMessage = useSendMessage(currentUser?.id);
  const deleteMessage = useDeleteMessage(selectedChatId);
  const markRead = useMarkRead(selectedChatId);

  const messages = messagesData?.messages || [];
  const selectedChatUser = chatUserData?.user || null;

  useEffect(() => {
    if (chatId) {
      setSelectedChatId(chatId);
      return;
    }
    if (targetUserId) {
      setSelectedChatId(targetUserId);
      return;
    }
    setSelectedChatId(null);
    setIsTyping(false);
    setIsOnline(false);
    setLastSeen(null);
  }, [chatId, targetUserId]);

  useEffect(() => {
    if (!targetUserId) return;
    const controller = new AbortController();
    const chats = chatsData?.chats || [];
    const existingChat = chats.find((chat) => String(chat.userId) === String(targetUserId));

    if (existingChat) {
      if (chatId !== existingChat.userId) {
        navigate(`/messages/${existingChat.userId}`, { replace: true });
      }
      return;
    }
    profileAPI.getUserById(targetUserId, controller.signal).catch(() => null);
    return () => controller.abort();
  }, [chatId, chatsData, navigate, targetUserId]);

  useEffect(() => {
    if (!selectedChatId) return;
    const controller = new AbortController();
    usersAPI
      .getPresence(selectedChatId, controller.signal)
      .then((res: { online: boolean; lastSeenAt: string | null }) => {
        setIsOnline(res.online);
        setLastSeen(res.lastSeenAt);
      })
      .catch(() => null);
    return () => controller.abort();
  }, [selectedChatId]);

  useChatWs({
    currentUserId: currentUser?.id,
    selectedChatId,
    onTyping: (typing, userId) => {
      setIsTyping(typing);
      setTypingUserId(typing ? userId || null : null);
    },
    onPresence: (online, lastSeenAt) => {
      setIsOnline(online);
      if (lastSeenAt) setLastSeen(lastSeenAt);
    },
  });

  useEffect(() => {
    if (!selectedChatId) return;
    if (typingDebounceRef.current) {
      window.clearTimeout(typingDebounceRef.current);
    }
    typingDebounceRef.current = window.setTimeout(() => {
      if (msgText.trim()) {
        wsService.sendTypingStart(selectedChatId);
      } else {
        wsService.sendTypingStop(selectedChatId);
      }
    }, 500);

    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
    }
    if (msgText.trim()) {
      typingStopTimerRef.current = window.setTimeout(() => {
        wsService.sendTypingStop(selectedChatId);
      }, 2000);
    }

    return () => {
      if (typingDebounceRef.current) {
        window.clearTimeout(typingDebounceRef.current);
      }
    };
  }, [msgText, selectedChatId]);

  useEffect(() => {
    const storedAction = localStorage.getItem("doubleClickAction") as "reply" | "heart" | null;
    if (storedAction === "heart" || storedAction === "reply") {
      setDoubleClickAction(storedAction);
    } else {
      localStorage.setItem("doubleClickAction", "reply");
    }

    const storedReactions = localStorage.getItem("messageHeartReactions");
    if (storedReactions) {
      try {
        const parsed = JSON.parse(storedReactions) as Record<string, boolean>;
        setReactionMap(parsed || {});
      } catch {
        setReactionMap({});
      }
    }
    const handleDoubleClickSetting = () => {
      const updated = localStorage.getItem("doubleClickAction") as "reply" | "heart" | null;
      if (updated === "heart" || updated === "reply") {
        setDoubleClickAction(updated);
      }
    };

    window.addEventListener("doubleClickActionChange", handleDoubleClickSetting);
    return () => window.removeEventListener("doubleClickActionChange", handleDoubleClickSetting);
  }, []);

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
      }
      if (typingDebounceRef.current) {
        window.clearTimeout(typingDebounceRef.current);
      }
      if (selectedChatId) {
        wsService.sendTypingStop(selectedChatId);
      }
    };
  }, [selectedChatId]);

  useEffect(() => {
    let mounted = true;
    stickersAPI.getPacks().then((res) => {
      if (!mounted) return;
      setLumeStickerPacks(res.packs || []);
    }).catch(() => null);
    stickersAPI.getMyPacks().then((res) => {
      if (!mounted) return;
      setMyStickerPacks(res.packs || []);
    }).catch(() => null);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!stickersOpen) return;
    const pickDefault = myStickerPacks[0]?.id || lumeStickerPacks[0]?.id || null;
    if (pickDefault && !activeStickerPackId) {
      loadPackStickers(pickDefault);
    }
  }, [stickersOpen, myStickerPacks, lumeStickerPacks, activeStickerPackId]);

  useEffect(() => {
    if (selectedChatId && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && !lastMsg.own) {
        markRead.mutate({ lastReadMessageId: lastMsg.id.toString() });
      }
    }
  }, [messages, markRead, selectedChatId]);

  const handleFileSelect = async (files: File[]) => {
    if (momentToggle) {
      const first = files[0];
      if (!first) return;
      setMomentFile(first);
      const reader = new FileReader();
      reader.onloadend = () => setMomentPreview(reader.result as string);
      reader.readAsDataURL(first);
      return;
    }

    const tasks = files.map(async (file) => {
      try {
        const uploaded = await uploadsAPI.uploadFile(file);
        setAttachments((prev) => [...prev, uploaded]);
        toast.success(t("messages.fileUploaded"));
      } catch (error) {
        const message = error instanceof Error ? error.message : t("messages.fileUploadError");
        toast.error(message);
      }
    });

    await Promise.all(tasks);
  };

  const handleSendMessage = async () => {
    if ((!msgText.trim() && attachments.length === 0 && !momentFile) || !selectedChatId) return;

    if (momentFile) {
      try {
        await messagesAPI.sendMoment({
          receiverId: selectedChatId,
          file: momentFile,
          ttlSeconds: 86400,
        });
        messageSounds.playSend();
        setMomentFile(null);
        setMomentPreview(null);
        setMomentToggle(false);
        setReplyTo(null);
        setMsgText("");
        setAttachments([]);
      } catch (error) {
        toast.error("?????????? ???? ??????????");
      }
      return;
    }

    const trimmed = msgText.trim();
    const attachmentIds = attachments.map((att) => att.id).filter(Boolean);
    sendMessage.mutate({
      receiverId: selectedChatId,
      ...(trimmed ? { text: trimmed } : {}),
      ...(attachmentIds.length ? { attachmentIds } : {}),
      ...(replyTo?.id ? { replyToMessageId: replyTo.id } : {}),
    });
    wsService.sendTypingStop(selectedChatId);
    setMsgText("");
    setAttachments([]);
    setReplyTo(null);
  };

  const handleSendSticker = async (sticker: Sticker) => {
    if (!selectedChatId) return;
    sendMessage.mutate({
      receiverId: selectedChatId,
      stickerId: sticker.id,
      ...(replyTo?.id ? { replyToMessageId: replyTo.id } : {}),
    });
    setStickersOpen(false);
  };

  const handleOpenStickerModal = (sticker: Sticker) => {
    setActiveSticker(sticker);
    const pack = [...myStickerPacks, ...lumeStickerPacks].find((p) => p.id === sticker.packId) || null;
    setActiveStickerPack(pack);
    setStickerModalOpen(true);
  };

  const handleAddStickerPack = async () => {
    if (!activeStickerPack?.id) return;
    try {
      await stickersAPI.addPack(activeStickerPack.id);
      toast.success("Sticker pack added");
    } catch (_error) {
      console.error("Sticker pack add failed", _error);
      toast.error("Failed to add sticker pack");
      return;
    }

    try {
      const refreshed = await stickersAPI.getMyPacks();
      setMyStickerPacks(refreshed.packs || []);
    } catch (_error) {
      console.error("Sticker pack refresh failed", _error);
      toast.error("Failed to refresh sticker packs");
    }
  };

  const loadPackStickers = async (packId: string) => {
    if (stickersByPack[packId]) {
      setActiveStickerPackId(packId);
      return;
    }
    try {
      const res = await stickersAPI.getPack(packId);
      setStickersByPack((prev) => ({ ...prev, [packId]: res.stickers || [] }));
      setActiveStickerPackId(packId);
    } catch (_error) {
      toast.error("Failed to load sticker pack");
    }
  };

  const handleSendVoice = async (blob: Blob, duration: number): Promise<void> => {
    if (!selectedChatId) {
      toast.error("??? ?? ??????");
      throw new Error("No chat selected");
    }

    try {
      await messagesAPI.sendVoice({
        receiverId: selectedChatId,
        audio: blob,
        duration,
        replyToMessageId: replyTo?.id || null,
      });

      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.chatMessages(selectedChatId),
      });

      messageSounds.playSend();
      setReplyTo(null);
      toast.success("????????? ????????? ??????????");
    } catch (error) {
      toast.error("?? ??????? ????????? ????????? ?????????");
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId: string, scope: "me" | "all" = "me") => {
    try {
      await deleteMessage.mutateAsync({ messageId, scope });
      setShowDeleteMenu(null);
      toast.success(t("messages.messageDeleted"));
    } catch (error: unknown) {
      const err = error as { error?: { code?: string; message?: string } } | null;
      let message = t("messages.messageDeleteError");

      if (err?.error?.code === "UNKNOWN") {
        if (err?.error?.message?.includes("15 minutes")) {
          message = t("messages.deleteTooLate");
        } else if (err?.error?.message?.includes("Only the sender")) {
          message = t("messages.deleteNotAuthor");
        } else if (err?.error?.message) {
          message = err.error.message;
        }
      }

      toast.error(message);
    }
  };

  const handleOpenMoment = async (msg: Message) => {
    if (!msg.moment?.id) return;
    if (msg.moment?.viewedAt || momentBlockedMap[msg.id] || momentLoadingMap[msg.id]) return;

    try {
      setMomentLoadingMap((prev) => ({ ...prev, [msg.id]: true }));
      const res = await messagesAPI.openMoment(msg.moment.id);
      const url = `${API_BASE_URL}/api/moments/${msg.moment.id}/content?token=${res.token}`;
      setMomentOpenMap((prev) => ({ ...prev, [msg.id]: url }));
    } catch (e) {
      const statusCode = (e as { error?: { statusCode?: number } })?.error?.statusCode;
      if (statusCode === 410) {
        setMomentBlockedMap((prev) => ({ ...prev, [msg.id]: true }));
        toast.error("Фото уже просмотрено или истекло");
      } else {
        toast.error("Исчезающее фото недоступно");
      }
    } finally {
      setMomentLoadingMap((prev) => ({ ...prev, [msg.id]: false }));
    }
  };

  const closeMomentViewer = (messageId: string) => {
    setMomentOpenMap((prev) => {
      const copy = { ...prev };
      delete copy[messageId];
      return copy;
    });
    const target = messages.find((m) => m.id === messageId);
    if (target?.moment?.id) {
      messagesAPI.markMomentViewed(target.moment.id).catch(() => null);
    }
  };

  const setReplyFromMessage = (msg: Message) => {
    const firstAttachment = msg.attachments?.find((att) => att.type === "image");
    const authorName = msg.own ? currentUser?.name || "You" : selectedChatUser?.name || "User";
    setReplyTo({
      id: msg.id,
      author: authorName,
      text: msg.type === "moment_image" ? "?????????? ????" : msg.text,
      imageUrl: msg.type === "moment_image" ? undefined : firstAttachment?.url,
    });
  };

  const handleToggleHeart = (msg: Message) => {
    console.log("[Heart] toggle", {
      messageId: msg.id,
      doubleClickAction,
      previous: Boolean(reactionMap[msg.id]),
    });
    setReactionMap((prev) => {
      const next = { ...prev, [msg.id]: !prev[msg.id] };
      if (!next[msg.id]) {
        delete next[msg.id];
      }
      localStorage.setItem("messageHeartReactions", JSON.stringify(next));
      return next;
    });
  };

  const handleCopyMessageText = async (msg: Message) => {
    const text = msg.text?.trim();
    if (!text) {
      toast.error(t("messages.copyEmpty"));
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("messages.copySuccess"));
    } catch (error) {
      console.error("Copy text failed", error);
      toast.error(t("messages.copyError"));
    }
  };


  const handleReplyJump = (messageId: string) => {
    setHighlightedMessageId(messageId);
    setTimeout(() => setHighlightedMessageId(null), 1200);
  };

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) return;
      Object.keys(momentOpenMap).forEach((messageId) => closeMomentViewer(messageId));
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [momentOpenMap, messages]);

  const chats = useMemo(() => chatsData?.chats || [], [chatsData]);

  return (
    <LayoutGroup>
      <div className="flex h-screen overflow-hidden">
        <ChatList
          chats={chats}
          loading={isLoading}
          selectedChatId={selectedChatId}
          onSelectChat={(userId) => navigate(`/messages/${userId}`)}
          onCloseChat={() => navigate("/messages")}
          t={t}
        />

        <AnimatePresence>
          {selectedChatId ? (
            <motion.div
              key="chat-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="flex-1 flex flex-col min-w-0 p-3"
            >
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex flex-col min-h-0 rounded-[28px] overflow-hidden border border-white/10 bg-transparent">
                  <ChatPanel
                    user={selectedChatUser}
                    isOnline={isOnline}
                    isTyping={isTyping}
                    lastSeen={lastSeen}
                    onOpenProfile={(userId) => navigate(`/profile/${userId}`)}
                    t={t}
                  />

                  <div className="flex-1 min-h-0 bg-white/5 backdrop-blur-[24px] overflow-hidden flex flex-col">
                    {messagesLoading ? (
                      <div className="flex-1 flex items-center justify-center text-center px-6">
                        <p className="text-sm text-secondary">Загрузка...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-center px-6">
                        <p className="text-sm text-secondary">
                          No messages yet. Start the conversation.
                        </p>
                      </div>
                    ) : (
                      <MessageList
                        messages={messages}
                        currentUser={currentUser}
                        selectedChatUser={selectedChatUser}
                        highlightedMessageId={highlightedMessageId}
                        onReply={setReplyFromMessage}
                        onToggleHeart={handleToggleHeart}
                        doubleClickAction={doubleClickAction}
                        reactionMap={reactionMap}
                        onOpenContextMenu={(message, position) =>
                          setContextMenuState({ message, position })
                        }
                        onReplyJump={handleReplyJump}
                        onDeleteRequest={(msgId, x, y) => setShowDeleteMenu({ msgId, x, y })}
                        onOpenMoment={handleOpenMoment}
                        onOpenSticker={handleOpenStickerModal}
                        momentOpenMap={momentOpenMap}
                        momentLoadingMap={momentLoadingMap}
                        momentBlockedMap={momentBlockedMap}
                        onCloseMoment={closeMomentViewer}
                        onOpenImage={(imageId, src) => {
                          setActiveImageId(imageId);
                          setActiveImageSrc(src);
                        }}
                        activeImageId={activeImageId}
                        activeImageSrc={activeImageSrc}
                        onCloseImage={() => {
                          setActiveImageId(null);
                          setActiveImageSrc(null);
                        }}
                        onLoadMore={() => {
                          if (messages.length > 0 && selectedChatId) {
                            messagesAPI
                              .getMessages(selectedChatId)
                              .then((response) => {
                                queryClient.setQueryData(
                                  messageQueryKeys.chatMessages(selectedChatId),
                                  response
                                );
                              })
                              .catch(() => null);
                          }
                        }}
                      />
                    )}
                  </div>
                </div>

                {isTyping && typingUserId && selectedChatUser && (
                  <TypingIndicator label={t("messages.typingIndicator", { name: selectedChatUser.name })} />
                )}

                <MessageComposer
                  msgText={msgText}
                  isSending={sendMessage.isPending}
                  momentToggle={momentToggle}
                  momentPreview={momentPreview}
                  attachments={attachments}
                  replyTo={replyTo ? { author: replyTo.author, text: replyTo.text, imageUrl: replyTo.imageUrl } : null}
                  stickersOpen={stickersOpen}
                  myStickerPacks={myStickerPacks}
                  lumeStickerPacks={lumeStickerPacks}
                  stickersByPack={stickersByPack}
                  activeStickerPackId={activeStickerPackId}
                  onFileSelect={handleFileSelect}
                  onRemoveAttachment={(index) =>
                    setAttachments((prev) => prev.filter((_, i) => i !== index))
                  }
                  onOpenImage={(imageId, src) => {
                    setActiveImageId(imageId);
                    setActiveImageSrc(src);
                  }}
                  onClearReply={() => setReplyTo(null)}
                  onToggleMoment={() => {
                    setMomentToggle((prev) => !prev);
                    if (!momentToggle) {
                      setAttachments([]);
                      setMsgText("");
                    } else {
                      setMomentFile(null);
                      setMomentPreview(null);
                    }
                  }}
                  onSetMsgText={setMsgText}
                  onSend={handleSendMessage}
                  onSendVoice={handleSendVoice}
                  onToggleStickers={() => setStickersOpen((prev) => !prev)}
                  onSelectSticker={handleSendSticker}
                  onPickStickerPack={loadPackStickers}
                  onBrowseStickerPacks={() => setStickersOpen(true)}
                  t={t}
                />
              </div>

              <ImageViewer
                activeImageId={activeImageId}
                src={activeImageSrc}
                onClose={() => {
                  setActiveImageId(null);
                  setActiveImageSrc(null);
                }}
              />

              <StickerModal
                open={stickerModalOpen}
                onOpenChange={setStickerModalOpen}
                sticker={activeSticker}
                pack={activeStickerPack}
                onAddPack={handleAddStickerPack}
              />

              {contextMenuState && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setContextMenuState(null)}
                />
              )}

              <AnimatePresence>
                {contextMenuState && (
                  <MessageContextMenu
                    message={contextMenuState.message}
                    position={contextMenuState.position}
                    onClose={() => setContextMenuState(null)}
                    onReply={setReplyFromMessage}
                    onCopyText={handleCopyMessageText}
                    onDeleteForMe={(messageId) => handleDeleteMessage(messageId, "me")}
                    onDeleteForAll={
                      contextMenuState.message.own
                        ? (messageId) => handleDeleteMessage(messageId, "all")
                        : undefined
                    }
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showDeleteMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDeleteMenu(null)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="fixed z-50 rounded-[22px] border border-white/10 bg-white/10 backdrop-blur-[24px]"
                      style={{ left: showDeleteMenu.x, top: showDeleteMenu.y - 10 }}
                    >
                      <button
                        onClick={() => handleDeleteMessage(showDeleteMenu.msgId, "me")}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/5 transition-smooth border-b border-white/10"
                      >
                        Delete for me
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(showDeleteMenu.msgId, "all")}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-200 hover:bg-white/5 transition-smooth"
                      >
                        Delete for everyone
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-6 py-5 text-center backdrop-blur-[24px]">
                <div className="h-14 w-14 rounded-full bg-white/8 flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="h-6 w-6 text-white/50" />
                </div>
                <p className="text-lg font-medium text-white mb-1">{t("messages.selectChat")}</p>
                <p className="text-sm text-secondary">{t("messages.chooseConversation")}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
};

export default MessagesPage;
