import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutGroup, AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types";
import type { Attachment, Chat, Message } from "@/types/messages";
import type { Sticker, StickerPack } from "@/types/stickers";
import { API_BASE_URL } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProfileRoute } from "@/lib/profileRoute";
import { messagesAPI, profileAPI, uploadsAPI, usersAPI, stickersAPI } from "@/services/api";
import { messageSounds } from "@/services/messageSounds";
import { wsService } from "@/services/websocket";
import { messageQueryKeys } from "./hooks/queryKeys";
import { useChats } from "./hooks/useChats";
import { useChatMessages } from "./hooks/useChatMessages";
import { useSendMessage } from "./hooks/useSendMessage";
import { useDeleteMessage } from "./hooks/useDeleteMessage";
import { useMarkRead } from "./hooks/useMarkRead";
import { useChatWs } from "./hooks/useChatWs";
import { useChatBackground } from "@/hooks/useChatBackground";
import ChatList from "./components/ChatList";
import ChatPanel from "./components/ChatPanel";
import MessageList from "./components/MessageList";
import MessageComposer from "./components/MessageComposer";
import { MessageSearch } from "./components/MessageSearch";
import CreateChatModal from "./components/CreateChatModal";
import ChatSettingsModal from "./components/ChatSettingsModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageViewer } from "@/components/media/ImageViewer";
import StickerModal from "@/components/stickers/StickerModal";
import StickerBotPanel from "@/pages/stickers/StickerBotPanel";
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
  const params = useParams();
  const chatId = params.chatId;
  const rest = params.rest;
  const inviteParam = params.token;
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const addStickerPackId = searchParams.get("addStickerPack");

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
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);
  const [scrollToMessageNonce, setScrollToMessageNonce] = useState(0);
  const [stickersOpen, setStickersOpen] = useState(false);
  const [myStickerPacks, setMyStickerPacks] = useState<StickerPack[]>([]);
  const [lumeStickerPacks, setLumeStickerPacks] = useState<StickerPack[]>([]);
  const [stickersByPack, setStickersByPack] = useState<Record<string, Sticker[]>>({});
  const [activeStickerPackId, setActiveStickerPackId] = useState<string | null>(null);
  const [stickerModalOpen, setStickerModalOpen] = useState(false);
  const [activeSticker, setActiveSticker] = useState<Sticker | null>(null);
  const [activeStickerPack, setActiveStickerPack] = useState<StickerPack | null>(null);
  const [doubleClickAction, setDoubleClickAction] = useState<"reply" | "heart">("reply");
  const [createChatOpen, setCreateChatOpen] = useState(false);
  const [chatSettingsOpen, setChatSettingsOpen] = useState(false);
  const [channelMeta, setChannelMeta] = useState<{ role?: string | null; membersCount?: number } | null>(null);
  const [publicChannel, setPublicChannel] = useState<Chat | null>(null);
  const [joinStatus, setJoinStatus] = useState<string | null>(null);
  const [channelLoading, setChannelLoading] = useState(false);
  const [publicJoinModalOpen, setPublicJoinModalOpen] = useState(false);
  const { backgroundStyle } = useChatBackground();
  const [reactionMap, setReactionMap] = useState<Record<string, boolean>>({});
  const [contextMenuState, setContextMenuState] = useState<{
    message: Message;
    position: { x: number; y: number };
  } | null>(null);
  const typingStopTimerRef = useRef<number | null>(null);
  const typingDebounceRef = useRef<number | null>(null);

  const queryClient = useQueryClient();

  const { data: chatsData, isLoading } = useChats();
  const selectedChat = useMemo(
    () =>
      (chatsData?.chats || []).find((chat) =>
        String(chat.id) === String(selectedChatId) || String(chat.routeId) === String(selectedChatId)
      ) || null,
    [chatsData?.chats, selectedChatId]
  );
  const displayChat = useMemo(() => selectedChat || publicChannel, [selectedChat, publicChannel]);
  const activeChatId = useMemo(() => selectedChat?.id || null, [selectedChat]);
  const { data: messagesData, isLoading: messagesLoading } = useChatMessages(activeChatId);
  const sendMessage = useSendMessage(currentUser?.id);
  const deleteMessage = useDeleteMessage(activeChatId);
  const markRead = useMarkRead(activeChatId);

  const messages = useMemo(() => messagesData?.messages || [], [messagesData?.messages]);
  const channelRole = useMemo(
    () => selectedChat?.role || channelMeta?.role || publicChannel?.role || null,
    [selectedChat?.role, channelMeta?.role, publicChannel?.role]
  );

  const canSendMessages = useMemo(() => {
    if (selectedChat) {
      if (selectedChat.type !== "channel") return true;
      return selectedChat.role === "owner" || selectedChat.role === "admin";
    }
    if (displayChat?.type === "channel") return false;
    return true;
  }, [selectedChat, displayChat]);

  useEffect(() => {
    const routeId = chatId && rest ? `${chatId}/${rest}` : chatId;
    setInviteToken(null);
    if (inviteParam) {
      setSelectedChatId(null);
      return;
    }
    if (routeId) {
      if (routeId.startsWith("@")) {
        const username = routeId.slice(1).toLowerCase();
        const matchedChat = (chatsData?.chats || []).find(
          (chat) => chat.username && chat.isPublic && chat.username.toLowerCase() === username
        );
        setSelectedChatId(matchedChat?.id || null);
        return;
      }
      setSelectedChatId(routeId);
      return;
    }
    if (!targetUserId) {
      setSelectedChatId(null);
      setIsTyping(false);
      setIsOnline(false);
      setLastSeen(null);
      return;
    }

    const chats = chatsData?.chats || [];
    const existingChat = chats.find((chat) => chat.type === "private" && chat.members?.some((m) => String(m.id) === String(targetUserId)));
    if (existingChat) {
      setSelectedChatId(existingChat.id);
      if (chatId !== existingChat.id) {
        navigate(`/messages/${existingChat.id}`, { replace: true });
      }
      return;
    }

    let cancelled = false;
    messagesAPI
      .createChat({ type: "private", userId: targetUserId })
      .then((res) => {
        if (cancelled || !res.chatId) return;
        setSelectedChatId(res.chatId);
        navigate(`/messages/${res.chatId}`, { replace: true });
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [chatId, rest, targetUserId, chatsData?.chats, navigate, inviteParam]);

  useEffect(() => {
    const isPublicPreview = Boolean(chatId && chatId.startsWith("@"));
    const isInvitePreview = Boolean(inviteToken || inviteParam);
    const isApprovedInvite = Boolean(publicChannel?.role) || joinStatus === "approved";
    if ((isPublicPreview || isInvitePreview) && publicChannel && !selectedChat && !isApprovedInvite) {
      setPublicJoinModalOpen(true);
      return;
    }
    setPublicJoinModalOpen(false);
  }, [chatId, inviteToken, inviteParam, publicChannel, selectedChat, joinStatus]);

  useEffect(() => {
    if (inviteParam) {
      setInviteToken(inviteParam);
      setSelectedChatId(null);
      return;
    }
    if (!chatId || chatId !== "invite" || !rest) {
      return;
    }
    setInviteToken(rest);
    setSelectedChatId(null);
  }, [chatId, rest, inviteParam]);

  useEffect(() => {
    const shouldFetchSelected = selectedChat?.type === "channel" && selectedChat?.isPublic && !selectedChat?.role;
    if (selectedChat) {
      setPublicChannel(null);
      if (!shouldFetchSelected || !selectedChat?.id) {
        setChannelMeta(null);
        return;
      }
      let cancelled = false;
      setChannelLoading(true);
      messagesAPI
        .getPublicChannel(selectedChat.id)
        .then((res) => {
          if (cancelled) return;
          setChannelMeta({ role: res.channel.role, membersCount: res.channel.membersCount });
          setJoinStatus(null);
        })
        .catch(() => null)
        .finally(() => {
          if (!cancelled) setChannelLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    if (inviteToken) {
      setPublicChannel(null);
      setChannelMeta(null);
      setChannelLoading(true);

      let cancelled = false;
      messagesAPI
        .getChatInvite(inviteToken)
        .then((res) => {
          if (cancelled) return;
          const isMember = Boolean(res.chat.role) || res.chat.joinStatus === "approved";
          setPublicChannel({
            id: res.chat.id,
            type: res.chat.type,
            title: res.chat.title,
            username: res.chat.username,
            avatar: res.chat.avatar,
            isPublic: res.chat.isPublic,
            isPrivate: res.chat.isPrivate,
            role: (res.chat.role || undefined) as Chat["role"],
            inviteToken: res.chat.inviteToken || null,
            publicNumber: res.chat.publicNumber || null,
            routeId: res.chat.routeId || null,
            members: [],
            lastMessage: "",
            timestamp: new Date().toISOString(),
            unread: 0,
          });
          setJoinStatus(res.chat.joinStatus || null);
          setChannelMeta({ role: res.chat.role, membersCount: res.chat.membersCount });
          if (isMember) {
            if (res.chat.username && res.chat.isPublic) {
              navigate(`/messages/@${res.chat.username}`, { replace: true });
            } else if (res.chat.routeId) {
              navigate(`/messages/${res.chat.routeId}`, { replace: true });
            } else {
              navigate(`/messages/${res.chat.id}`, { replace: true });
            }
          }
          setPublicJoinModalOpen(!isMember);
        })
        .catch(() => {
          if (!cancelled) {
            setPublicChannel(null);
            setChannelMeta(null);
            setJoinStatus(null);
          }
        })
        .finally(() => {
          if (!cancelled) setChannelLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }

    if (!chatId) {
      setPublicChannel(null);
      setChannelMeta(null);
      return;
    }

    let cancelled = false;
    setChannelLoading(true);

    const loadChat = async () => {
      try {
        if (chatId === "invite" || inviteParam) {
          return;
        }
        if (chatId.startsWith("@")) {
          const res = await messagesAPI.getChatByUsername(chatId.slice(1));
          if (cancelled) return;
          setPublicChannel({
            id: res.chat.id,
            type: res.chat.type,
            title: res.chat.title,
            username: res.chat.username,
            avatar: res.chat.avatar,
            isPublic: res.chat.isPublic,
            isPrivate: res.chat.isPrivate,
            role: (res.chat.role || undefined) as Chat["role"],
            inviteToken: res.chat.inviteToken || null,
            publicNumber: res.chat.publicNumber || null,
            routeId: res.chat.routeId || null,
            members: [],
            lastMessage: "",
            timestamp: new Date().toISOString(),
            unread: 0,
          });
          setJoinStatus(res.chat.joinStatus || null);
          setChannelMeta({ role: res.chat.role, membersCount: res.chat.membersCount });
          return;
        }

        if (chatId.startsWith("-100") || chatId.startsWith("-200")) {
          const matchedChat = (chatsData?.chats || []).find(
            (chat) => String(chat.routeId) === String(chatId)
          );
          if (matchedChat?.isPublic && matchedChat.username) {
            navigate(`/messages/@${matchedChat.username}`, { replace: true });
            return;
          }
          if (!matchedChat) {
            setPublicChannel(null);
            setChannelMeta(null);
            setJoinStatus(null);
          }
          return;
        }

        const res = await messagesAPI.getPublicChannel(chatId);
        if (cancelled) return;
        setPublicChannel({
          id: res.channel.id,
          type: "channel",
          title: res.channel.title,
          username: res.channel.username,
          avatar: res.channel.avatar,
          isPublic: res.channel.isPublic,
          role: (res.channel.role || undefined) as Chat["role"],
          members: [],
          lastMessage: "",
          timestamp: new Date().toISOString(),
          unread: 0,
        });
        setJoinStatus(null);
        setChannelMeta({ role: res.channel.role, membersCount: res.channel.membersCount });
      } catch (error) {
        if (!cancelled) {
          setPublicChannel(null);
          setChannelMeta(null);
          setJoinStatus(null);
        }
      } finally {
        if (!cancelled) setChannelLoading(false);
      }
    };

    loadChat();

    return () => {
      cancelled = true;
    };
  }, [chatId, rest, selectedChat?.id, selectedChat?.type, selectedChat?.role, selectedChat?.isPublic, chatsData?.chats, navigate]);

  useEffect(() => {
    if (!targetUserId) return;
    const controller = new AbortController();
    profileAPI.getUserById(targetUserId, controller.signal).catch(() => null);
    return () => controller.abort();
  }, [targetUserId]);

  useEffect(() => {
    if (!selectedChatId || !selectedChat || selectedChat.type !== "private") return;
    const otherMember = selectedChat.members?.find((m) => String(m.id) !== String(currentUser?.id));
    if (!otherMember?.id) return;
    const controller = new AbortController();
    usersAPI
      .getPresence(otherMember.id, controller.signal)
      .then((res: { online: boolean; lastSeenAt: string | null }) => {
        setIsOnline(res.online);
        setLastSeen(res.lastSeenAt);
      })
      .catch(() => null);
    return () => controller.abort();
  }, [selectedChatId, selectedChat, currentUser?.id]);

  useChatWs({
    currentUserId: currentUser?.id,
    selectedChatId: activeChatId,
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
    if (!activeChatId) return;
    if (typingDebounceRef.current) {
      window.clearTimeout(typingDebounceRef.current);
    }
    typingDebounceRef.current = window.setTimeout(() => {
      if (msgText.trim()) {
        wsService.sendTypingStart(activeChatId);
      } else {
        wsService.sendTypingStop(activeChatId);
      }
    }, 500);

    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
    }
    if (msgText.trim()) {
      typingStopTimerRef.current = window.setTimeout(() => {
        wsService.sendTypingStop(activeChatId);
      }, 2000);
    }

    return () => {
      if (typingDebounceRef.current) {
        window.clearTimeout(typingDebounceRef.current);
      }
    };
  }, [msgText, activeChatId]);

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
      if (activeChatId) {
        wsService.sendTypingStop(activeChatId);
      }
    };
  }, [activeChatId]);

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
    if (!addStickerPackId) return;
    const openFromQuery = async () => {
      try {
        const res = await stickersAPI.getPack(addStickerPackId);
        setActiveStickerPack(res.pack || null);
        const first = res.stickers?.[0] || null;
        if (first) {
          setActiveSticker(first);
          setStickerModalOpen(true);
        }
      } catch (_error) {
        toast.error(t("stickers.packLoadError"));
      }
    };
    openFromQuery();
  }, [addStickerPackId, t]);

  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && !lastMsg.own) {
        markRead.mutate({ lastReadMessageId: lastMsg.id.toString() });
      }
    }
  }, [messages, markRead, activeChatId]);

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
    if ((!msgText.trim() && attachments.length === 0 && !momentFile) || !activeChatId || !canSendMessages) return;

    if (momentFile) {
      try {
        await messagesAPI.sendMoment({
          chatId: activeChatId,
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
        toast.error(t("messages.momentSendError"));
      }
      return;
    }

    const trimmed = msgText.trim();
    const attachmentIds = attachments.map((att) => att.id).filter(Boolean);
    sendMessage.mutate({
      chatId: activeChatId,
      ...(trimmed ? { text: trimmed } : {}),
      ...(attachmentIds.length ? { attachmentIds } : {}),
      ...(replyTo?.id ? { replyToMessageId: replyTo.id } : {}),
    });
    wsService.sendTypingStop(activeChatId);
    setMsgText("");
    setAttachments([]);
    setReplyTo(null);
  };

  const handleSendSticker = async (sticker: Sticker) => {
    if (!activeChatId || !canSendMessages) return;
    sendMessage.mutate({
      chatId: activeChatId,
      stickerId: sticker.id,
      ...(replyTo?.id ? { replyToMessageId: replyTo.id } : {}),
    });
    setStickersOpen(false);
  };

  const handleOpenStickerModal = async (sticker: Sticker) => {
    setActiveSticker(sticker);
    let pack = [...myStickerPacks, ...lumeStickerPacks].find((p) => p.id === sticker.packId) || null;
    if (!pack && sticker.packId) {
      try {
        const res = await stickersAPI.getPack(sticker.packId);
        pack = res.pack || null;
      } catch (_error) {
        pack = null;
      }
    }
    setActiveStickerPack(pack);
    setStickerModalOpen(true);
  };

  const handleAddStickerPack = async () => {
    if (!activeStickerPack?.id) return;
    try {
      await stickersAPI.addPack(activeStickerPack.id);
      toast.success(t("stickers.packAdded"));
    } catch (_error) {
      console.error("Sticker pack add failed", _error);
      toast.error(t("stickers.packAddError"));
      return;
    }

    try {
      const refreshed = await stickersAPI.getMyPacks();
      setMyStickerPacks(refreshed.packs || []);
      if (activeStickerPack?.id) {
        setActiveStickerPackId(activeStickerPack.id);
      }
      setStickersOpen(true);
    } catch (_error) {
      console.error("Sticker pack refresh failed", _error);
      toast.error(t("stickers.packRefreshError"));
    }
  };

  const loadPackStickers = useCallback(async (packId: string) => {
    if (stickersByPack[packId]) {
      setActiveStickerPackId(packId);
      return;
    }
    try {
      const res = await stickersAPI.getPack(packId);
      setStickersByPack((prev) => ({ ...prev, [packId]: res.stickers || [] }));
      setActiveStickerPackId(packId);
    } catch (_error) {
      toast.error(t("stickers.packLoadError"));
    }
  }, [stickersByPack, t]);

  useEffect(() => {
    if (!stickersOpen) return;
    const pickDefault = myStickerPacks[0]?.id || lumeStickerPacks[0]?.id || null;
    if (pickDefault && !activeStickerPackId) {
      loadPackStickers(pickDefault);
    }
  }, [stickersOpen, myStickerPacks, lumeStickerPacks, activeStickerPackId, loadPackStickers]);

  const handleSendVoice = async (blob: Blob, duration: number): Promise<void> => {
    if (!activeChatId) {
      toast.error(t("messages.voiceNoChat"));
      throw new Error("No chat selected");
    }

    try {
        await messagesAPI.sendVoice({
          chatId: activeChatId,
          audio: blob,
          duration,
          replyToMessageId: replyTo?.id || null,
        });

        queryClient.invalidateQueries({
          queryKey: messageQueryKeys.chatMessages(activeChatId),
        });

      messageSounds.playSend();
      setReplyTo(null);
      toast.success(t("messages.voiceSent"));
    } catch (error) {
      toast.error(t("messages.voiceSendError"));
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

  const closeMomentViewer = useCallback((messageId: string) => {
    setMomentOpenMap((prev) => {
      const copy = { ...prev };
      delete copy[messageId];
      return copy;
    });
    const target = messages.find((m) => m.id === messageId);
    if (target?.moment?.id) {
      messagesAPI.markMomentViewed(target.moment.id).catch(() => null);
    }
  }, [messages]);

  const setReplyFromMessage = (msg: Message) => {
    const firstAttachment = msg.attachments?.find((att) => att.type === "image");
    const authorName = msg.own ? currentUser?.name || "You" : selectedChat?.title || "User";
    setReplyTo({
      id: msg.id,
      author: authorName,
      text: msg.type === "moment_image" ? t("messages.momentReplyLabel") : msg.text,
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
    setScrollToMessageId(messageId);
    setScrollToMessageNonce((prev) => prev + 1);
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
  }, [momentOpenMap, closeMomentViewer]);

  const chats = useMemo(() => chatsData?.chats || [], [chatsData]);
  const resolveChatRoute = useCallback((chatIdValue: string) => {
    const chat = chats.find((item) => String(item.id) === String(chatIdValue));
    if (chat?.username && chat.isPublic) {
      return `/messages/@${chat.username}`;
    }
    if (chat?.routeId) {
      return `/messages/${chat.routeId}`;
    }
    return `/messages/${chatIdValue}`;
  }, [chats]);

  return (
    <LayoutGroup>
      <div className="flex h-screen overflow-hidden">
        <ChatList
          chats={chats}
          loading={isLoading}
          selectedChatId={selectedChatId}
          onSelectChat={(chatIdValue) => navigate(resolveChatRoute(chatIdValue))}
          onCloseChat={() => navigate("/messages")}
          onCreateChat={() => setCreateChatOpen(true)}
          t={t}
        />

        <CreateChatModal
          open={createChatOpen}
          onOpenChange={setCreateChatOpen}
          onCreated={(chatIdValue) => navigate(resolveChatRoute(chatIdValue))}
          t={t}
        />

        <ChatSettingsModal
          open={chatSettingsOpen}
          onOpenChange={setChatSettingsOpen}
          chat={selectedChat}
          t={t}
        />

        <Dialog open={publicJoinModalOpen} onOpenChange={setPublicJoinModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">
                {publicChannel?.title || t("messages.publicJoinTitle")}
              </DialogTitle>
              <DialogDescription className="text-white/60">
                {publicChannel?.type === "channel"
                  ? t("messages.publicChannelJoinDescription")
                  : t("messages.publicGroupJoinDescription")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              {joinStatus === "pending" ? (
                <span className="text-sm text-white/70">{t("messages.joinRequestSent")}</span>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={channelLoading}
                  onClick={() => {
                    if (!publicChannel?.id) return;
                    setChannelLoading(true);
                    const action =
                      publicChannel.type === "channel"
                        ? messagesAPI.subscribeChannel(publicChannel.id)
                        : messagesAPI.requestJoin(publicChannel.id);
                    action
                      .then((res: { status?: string }) => {
                        queryClient.invalidateQueries({ queryKey: messageQueryKeys.chatList() });
                        const nextStatus = res?.status;
                        if (nextStatus) {
                          setJoinStatus(nextStatus);
                        }
                        if (!nextStatus || nextStatus === "approved") {
                          if (publicChannel?.username && publicChannel?.isPublic) {
                            navigate(`/messages/@${publicChannel.username}`, { replace: true });
                          } else if (publicChannel?.routeId) {
                            navigate(`/messages/${publicChannel.routeId}`, { replace: true });
                          } else if (publicChannel?.id) {
                            navigate(`/messages/${publicChannel.id}`, { replace: true });
                          }
                        }
                        setPublicJoinModalOpen(false);
                      })
                      .catch(() => null)
                      .finally(() => setChannelLoading(false));
                  }}
                >
                  {publicChannel?.type === "channel"
                    ? t("messages.channelSubscribe")
                    : t("messages.groupJoin")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AnimatePresence>
            {selectedChatId || displayChat ? (
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
                    user={displayChat?.title ? { id: displayChat.id, name: displayChat.title, username: displayChat.username || "", avatar: displayChat.avatar || undefined, verified: false, email: "" } : null}
                    chatType={displayChat?.type}
                    memberCount={displayChat?.members?.length || channelMeta?.membersCount}
                    memberCountLabel={
                      displayChat?.type === "channel"
                        ? t("messages.channelMembers", {
                            count: String(channelMeta?.membersCount ?? selectedChat?.members?.length ?? 0),
                          })
                        : undefined
                    }
                    isOnline={isOnline}
                    isTyping={isTyping}
                    lastSeen={lastSeen}
                    onOpenProfile={() => {
                      if (selectedChat?.type === "private") {
                        const otherMember = selectedChat.members?.find((m) => String(m.id) !== String(currentUser?.id));
                        if (otherMember?.id) {
                          navigate(getProfileRoute({ id: otherMember.id }));
                        }
                      }
                    }}
                    onOpenSettings={
                      selectedChat?.type !== "private" && (selectedChat?.role === "owner" || selectedChat?.role === "admin")
                        ? () => setChatSettingsOpen(true)
                        : undefined
                    }
                    onLeave={
                      selectedChat?.type !== "private" && selectedChat?.role !== "owner"
                        ? () => {
                            if (!selectedChat?.id || !currentUser?.id) return;
                            messagesAPI
                              .leaveChat(selectedChat.id, currentUser.id)
                              .then(() => {
                                queryClient.invalidateQueries({ queryKey: messageQueryKeys.chatList() });
                                navigate("/messages");
                              })
                              .catch(() => null);
                          }
                        : undefined
                    }
                      t={t}
                    />

                  <div className="flex-1 min-h-0 bg-white/5 backdrop-blur-[24px] overflow-hidden flex flex-col" style={backgroundStyle}>
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
                        selectedChatUser={null}
                        chatType={displayChat?.type}
                        highlightedMessageId={highlightedMessageId}
                        scrollToMessageId={scrollToMessageId}
                        scrollToMessageNonce={scrollToMessageNonce}
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
                          if (messages.length > 0 && activeChatId) {
                            messagesAPI
                              .getMessages(activeChatId)
                              .then((response) => {
                                queryClient.setQueryData(
                                  messageQueryKeys.chatMessages(activeChatId),
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

                {isTyping && typingUserId && selectedChat && (
                  <TypingIndicator label={t("messages.typingIndicator", { name: selectedChat.title || "User" })} />
                )}

                <MessageComposer
                  msgText={msgText}
                  isSending={sendMessage.isPending}
                  canSend={canSendMessages}
                  readOnlyMessage={
                    displayChat?.type === "channel" || displayChat?.type === "group" ? (
                      <div className="flex justify-center">
                        {!channelRole ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              if (!displayChat?.id) return;
                              if (displayChat?.isPublic) {
                                messagesAPI
                                  .subscribeChannel(displayChat.id)
                                  .then(() => {
                                    queryClient.invalidateQueries({ queryKey: messageQueryKeys.chatList() });
                                    setChannelMeta((prev) => ({
                                      ...prev,
                                      role: "member",
                                      membersCount: (prev?.membersCount ?? 0) + 1,
                                    }));
                                    if (displayChat?.id) {
                                      messagesAPI
                                        .getPublicChannel(displayChat.id)
                                        .then((res) => {
                                          setChannelMeta({ role: res.channel.role, membersCount: res.channel.membersCount });
                                        })
                                        .catch(() => null);
                                    }
                                  })
                                  .catch(() => null);
                              } else {
                                messagesAPI
                                  .requestJoin(displayChat.id)
                                  .then((res) => {
                                    setJoinStatus(res.status || "pending");
                                    toast.success(t("messages.joinRequestSent"));
                                  })
                                  .catch(() => null);
                              }
                            }}
                            disabled={channelLoading || joinStatus === "pending"}
                          >
                            {displayChat?.type === "group" ? t("messages.groupJoin") : t("messages.channelSubscribe")}
                          </Button>
                        ) : joinStatus === "pending" ? (
                          <span>{t("messages.joinRequestSent")}</span>
                        ) : channelRole !== "owner" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (!displayChat?.id) return;
                              messagesAPI
                                .unsubscribeChannel(displayChat.id)
                              .then(() => {
                                queryClient.invalidateQueries({ queryKey: messageQueryKeys.chatList() });
                                setChannelMeta((prev) => ({
                                  ...prev,
                                  role: null,
                                  membersCount: Math.max(0, (prev?.membersCount ?? 1) - 1),
                                }));
                                if (displayChat?.id) {
                                  messagesAPI
                                    .getPublicChannel(displayChat.id)
                                    .then((res) => {
                                      setChannelMeta({ role: res.channel.role, membersCount: res.channel.membersCount });
                                    })
                                    .catch(() => null);
                                }
                                navigate("/messages");
                              })
                                .catch(() => null);
                            }}
                            disabled={channelLoading}
                          >
                            {t("messages.channelUnsubscribe")}
                          </Button>
                        ) : (
                          <span>{t("messages.channelReadOnly") || "Только админы могут писать в канале."}</span>
                        )}
                      </div>
                    ) : (
                      t("messages.channelReadOnly") || "Только админы могут писать в канале."
                    )
                  }
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
                {String(selectedChatId) === "999" && (
                  <StickerBotPanel onUploaded={() => void 0} />
                )}
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
