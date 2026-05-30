import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutGroup, AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types";
import type { Attachment, Chat, Message, ChatPinnedMessage } from "@/types/messages";
import type { Sticker, StickerPack } from "@/types/stickers";
import { API_BASE_URL } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProfileRoute } from "@/lib/profileRoute";
import { messagesAPI, profileAPI, uploadsAPI, usersAPI, stickersAPI, projectsAPI, chatsAPI } from "@/services/api";
import { messageSounds } from "@/services/messageSounds";
import { wsService } from "@/services/websocket";
import { messageQueryKeys } from "./hooks/queryKeys";
import { useChats } from "./hooks/useChats";
import { useChatMessages } from "./hooks/useChatMessages";
import { useSendMessage } from "./hooks/useSendMessage";
import { useDeleteMessage } from "./hooks/useDeleteMessage";
import { useMarkRead } from "./hooks/useMarkRead";
import { useChatWs } from "./hooks/useChatWs";
import { useChatListWs } from "./hooks/useChatListWs";
import { useChatBackground } from "@/hooks/useChatBackground";
import ChatList from "./components/ChatList";
import ChatPanel from "./components/ChatPanel";
import MessageList from "./components/MessageList";
import MessageComposer from "./components/MessageComposer";
import { MessageSearch } from "./components/MessageSearch";
import CreateChatModal from "./components/CreateChatModal";
import ChatSettingsModal from "./components/ChatSettingsModal";
import PrivateChatInfoPreview from "./components/chat-info/PrivateChatInfoPreview";
import GroupChatInfoPreview from "./components/chat-info/GroupChatInfoPreview";
import ChannelChatInfoPreview from "./components/chat-info/ChannelChatInfoPreview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  const [replyTo, setReplyTo] = useState<ReplyPreview | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);
  const [scrollToMessageNonce, setScrollToMessageNonce] = useState(0);
  const [scrollToBottomTrigger, setScrollToBottomTrigger] = useState(0);
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
  const [blockedProject, setBlockedProject] = useState<any>(null);
  const [joiningProject, setJoiningProject] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [pendingTargetUser, setPendingTargetUser] = useState<User | null>(null);
  const [chatInfoOpen, setChatInfoOpen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<ChatPinnedMessage[]>([]);
  const [activePinnedIndex, setActivePinnedIndex] = useState(0);
  const [visibleRange, setVisibleRange] = useState<{ startIndex: number; endIndex: number } | null>(null);
  const { backgroundStyle } = useChatBackground();

  useEffect(() => {
    setSelectedMessages([]);
  }, [selectedChatId]);
  const [reactionMap, setReactionMap] = useState<Record<string, boolean>>({});
  const [contextMenuState, setContextMenuState] = useState<{
    message: Message;
    position: { x: number; y: number };
    bounds?: { left: number; top: number; right: number; bottom: number };
  } | null>(null);
  const typingStopTimerRef = useRef<number | null>(null);
  const typingDebounceRef = useRef<number | null>(null);
  const privateChatCreateInFlightRef = useRef<Set<string>>(new Set());
  const manualPinSwitchLockUntilRef = useRef(0);
  const isManualPinPreviewRef = useRef(false);

  const queryClient = useQueryClient();

  const { data: chatsData, isLoading } = useChats();
  const selectedChat = useMemo(
    () =>
      (chatsData?.chats || []).find((chat) =>
        String(chat.id) === String(selectedChatId) || String(chat.routeId) === String(selectedChatId)
      ) || null,
    [chatsData?.chats, selectedChatId]
  );

  const subscribedChatIds = useMemo(
    () => (chatsData?.chats || []).map((chat) => String(chat.id)).filter(Boolean),
    [chatsData?.chats]
  );


  const targetChatPlaceholder = useMemo<Chat | null>(() => {
    if (selectedChat || publicChannel || !pendingTargetUser) return null;
    const placeholderId = selectedChatId || targetUserId || pendingTargetUser.id;
    if (!placeholderId) return null;

    return {
      id: placeholderId,
      type: "private",
      title: pendingTargetUser.name || pendingTargetUser.username || "User",
      avatar: pendingTargetUser.avatar || null,
      isPublic: false,
      isPrivate: true,
      username: pendingTargetUser.username || null,
      lastMessage: "",
      lastMessageType: "text",
      timestamp: new Date().toISOString(),
      unread: 0,
      members: [
        {
          id: pendingTargetUser.id,
          role: "member",
          name: pendingTargetUser.name,
          username: pendingTargetUser.username,
          avatar: pendingTargetUser.avatar,
          verified: pendingTargetUser.verified,
        },
      ],
    };
  }, [selectedChat, publicChannel, pendingTargetUser, selectedChatId, targetUserId]);

  const displayChat = useMemo(() => selectedChat || publicChannel || targetChatPlaceholder, [selectedChat, publicChannel, targetChatPlaceholder]);
  const chatPanelUser = useMemo(() => {
    if (!displayChat) return null;

    if (displayChat.type === "private") {
      const otherMember = displayChat.members?.find((m) => String(m.id) !== String(currentUser?.id));
      if (otherMember) {
        return {
          id: otherMember.id,
          name: otherMember.name || otherMember.username || "User",
          username: otherMember.username || "",
          avatar: otherMember.avatar || undefined,
          verified: Boolean(otherMember.verified),
          email: "",
        };
      }
    }

    if (displayChat.title) {
      return {
        id: displayChat.id,
        name: displayChat.title,
        username: displayChat.username || "",
        avatar: displayChat.avatar || undefined,
        verified: false,
        email: "",
      };
    }

    if (displayChat.type === "group" || displayChat.type === "channel") {
      return {
        id: displayChat.id,
        name: displayChat.title || displayChat.username || "Chat",
        username: displayChat.username || "",
        avatar: displayChat.avatar || undefined,
        verified: false,
        email: "",
      };
    }

    return null;
  }, [displayChat, currentUser?.id]);
  const activeChatId = useMemo(() => {
    if (selectedChat?.id) return selectedChat.id;
    if (publicChannel?.id) return publicChannel.id;
    if (selectedChatId && /^-?\d+$/.test(selectedChatId)) return selectedChatId;
    return null;
  }, [selectedChat, publicChannel, selectedChatId]);
  const { data: messagesData, isLoading: messagesLoading } = useChatMessages(activeChatId);
  const sendMessage = useSendMessage(currentUser?.id);
  const deleteMessage = useDeleteMessage(activeChatId);
  const markRead = useMarkRead(activeChatId);

  const messages = useMemo(() => messagesData?.messages || [], [messagesData?.messages]);
  const visibleMessages = useMemo(
    () => messages.filter((msg) => !msg.deletedForAll && !msg.deletedForMe),
    [messages]
  );
  const visibleMessageIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    visibleMessages.forEach((msg, index) => map.set(String(msg.id), index));
    return map;
  }, [visibleMessages]);
  const sortedPinnedMessages = useMemo(() => {
    return [...pinnedMessages].sort((a, b) => {
      const idxA = visibleMessageIndexMap.get(String(a.messageId)) ?? -1;
      const idxB = visibleMessageIndexMap.get(String(b.messageId)) ?? -1;
      return idxB - idxA;
    });
  }, [pinnedMessages, visibleMessageIndexMap]);
  const activePinnedMessage = useMemo(() => {
    if (sortedPinnedMessages.length === 0) return null;
    const safeIndex = Math.min(activePinnedIndex, sortedPinnedMessages.length - 1);
    return sortedPinnedMessages[safeIndex] || null;
  }, [sortedPinnedMessages, activePinnedIndex]);
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
    if (!activeChatId) {
      setPinnedMessages([]);
      setActivePinnedIndex(0);
      return;
    }

    let cancelled = false;
    messagesAPI
      .getPinnedMessages(activeChatId)
      .then((res) => {
        if (!cancelled) setPinnedMessages(res.pins || []);
      })
      .catch(() => {
        if (!cancelled) setPinnedMessages([]);
      });

    return () => {
      cancelled = true;
    };
  }, [activeChatId, messages]);

  useEffect(() => {
    setActivePinnedIndex(0);
  }, [activeChatId]);

  useEffect(() => {
    setActivePinnedIndex((prev) => {
      if (sortedPinnedMessages.length === 0) return 0;
      return Math.min(prev, sortedPinnedMessages.length - 1);
    });
  }, [sortedPinnedMessages.length]);

  useEffect(() => {
    if (!visibleRange || sortedPinnedMessages.length === 0) return;
    if (isManualPinPreviewRef.current) return;
    if (Date.now() < manualPinSwitchLockUntilRef.current) return;
    const nextIndex = sortedPinnedMessages.findIndex((pin) => {
      const idx = visibleMessageIndexMap.get(String(pin.messageId));
      if (idx === undefined) return false;
      return idx <= visibleRange.endIndex;
    });
    if (nextIndex >= 0 && nextIndex !== activePinnedIndex) {
      setActivePinnedIndex(nextIndex);
    }
  }, [visibleRange, sortedPinnedMessages, visibleMessageIndexMap, activePinnedIndex]);

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

    const targetKey = String(targetUserId);
    if (privateChatCreateInFlightRef.current.has(targetKey)) {
      return;
    }

    privateChatCreateInFlightRef.current.add(targetKey);

    let cancelled = false;
    messagesAPI
      .createChat({ type: "private", userId: targetUserId })
      .then((res) => {
        if (cancelled || !res.chatId) return;
        setSelectedChatId(res.chatId);
        queryClient.invalidateQueries({ queryKey: messageQueryKeys.chatList() });
        navigate(`/messages/${res.chatId}`, { replace: true });
      })
      .catch((error) => {
        console.error("Failed to create private chat", error);
      })
      .finally(() => {
        privateChatCreateInFlightRef.current.delete(targetKey);
        queryClient.invalidateQueries({ queryKey: messageQueryKeys.chatList() });
      });
    return () => {
      cancelled = true;
    };
  }, [chatId, rest, targetUserId, chatsData?.chats, navigate, inviteParam]);

  useEffect(() => {
    const isPublicPreview = Boolean(chatId && chatId.startsWith("@"));
    const isInvitePreview = Boolean(inviteToken || inviteParam);
    const isApprovedInvite = Boolean(publicChannel?.role) || joinStatus === "approved";
    if (blockedProject) {
      setPublicJoinModalOpen(false);
      return;
    }
    if ((isPublicPreview || isInvitePreview) && publicChannel && !selectedChat && !isApprovedInvite) {
      setPublicJoinModalOpen(true);
      return;
    }
    setPublicJoinModalOpen(false);
  }, [chatId, inviteToken, inviteParam, publicChannel, selectedChat, joinStatus, blockedProject]);

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
      setPublicJoinModalOpen(false);
      try {
        if (chatId === "invite" || inviteParam) {
          return;
        }
        if (chatId.startsWith("@")) {
          const username = chatId.slice(1);
          const res = await messagesAPI.getChatByUsername(username);
          if (cancelled) return;
          
          if (res.project && !res.project.member_role) {
            setBlockedProject(res.project);
            setPublicChannel(null);
            setChannelMeta(null);
            setJoinStatus(null);
            return;
          }
          setBlockedProject(null);
          
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

        const matchedChat = (chatsData?.chats || []).find(
          (chat) => String(chat.id) === String(chatId)
        );
        if (!matchedChat) {
          setPublicChannel(null);
          setChannelMeta(null);
          setJoinStatus(null);
          return;
        }

        if (matchedChat.projectId) {
          const projectRes = await chatsAPI.getProject(chatId);
          if (cancelled) return;
          if (!projectRes.project) {
            setPublicChannel(null);
            setChannelMeta(null);
            setBlockedProject(null);
            return;
          }
          if (!projectRes.project.member_role) {
            setBlockedProject(projectRes.project);
            setPublicChannel(null);
            setChannelMeta(null);
            setJoinStatus(null);
            return;
          }
          setBlockedProject(null);
        } else {
          setBlockedProject(null);
        }

        if (matchedChat.type === "group" || matchedChat.type === "channel") {
          setPublicChannel({
            id: matchedChat.id,
            type: matchedChat.type,
            title: matchedChat.title,
            username: matchedChat.username,
            avatar: matchedChat.avatar,
            isPublic: matchedChat.isPublic,
            isPrivate: matchedChat.isPrivate,
            role: matchedChat.role as Chat["role"],
            inviteToken: matchedChat.inviteToken || null,
            publicNumber: matchedChat.publicNumber || null,
            routeId: matchedChat.routeId || null,
            members: matchedChat.members || [],
            lastMessage: matchedChat.lastMessage || "",
            timestamp: matchedChat.timestamp || new Date().toISOString(),
            unread: matchedChat.unread || 0,
          });
          setJoinStatus(null);
          setChannelMeta({ role: matchedChat.role, membersCount: matchedChat.members?.length || 0 });
        } else if (matchedChat.type !== "channel" || !matchedChat.isPublic) {
          setPublicChannel(null);
          setChannelMeta(null);
          setJoinStatus(null);
          return;
        } else {
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
        }
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
  }, [chatId, rest, selectedChat?.id, selectedChat?.type, selectedChat?.role, selectedChat?.isPublic, selectedChat?.projectId, chatsData?.chats, navigate]);

  useEffect(() => {
    if (!targetUserId) {
      if (!selectedChatId) {
        setPendingTargetUser(null);
      }
      return;
    }
    const controller = new AbortController();
    profileAPI.getUserById(targetUserId, controller.signal)
      .then((res) => setPendingTargetUser(res.user))
      .catch(() => null);
    return () => controller.abort();
  }, [targetUserId, selectedChatId]);

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

  useChatListWs({
    currentUserId: currentUser?.id,
    selectedChatId: activeChatId,
    chatIds: subscribedChatIds,
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

  const handleSendMessage = async (overrideText?: string) => {
    const resolvedOverride = typeof overrideText === "string" ? overrideText : undefined;
    const effectiveText = (resolvedOverride ?? msgText).trim();
    if ((!effectiveText && attachments.length === 0) || !activeChatId || !canSendMessages) return;

    const trimmed = effectiveText;
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
    setScrollToBottomTrigger((prev) => prev + 1);
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

  const handleCommandClick = (command: string) => {
    if (!command) return;
    if (!activeChatId || !canSendMessages) return;
    const normalized = command.startsWith("/") ? command : `/${command}`;
    handleSendMessage(normalized);
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

  const handleSelectMessage = (messageId: string) => {
    if (selectedMessages.includes(messageId)) {
      setSelectedMessages(prev => prev.filter(id => id !== messageId));
    } else {
      if (selectedMessages.length >= 100) {
        toast.error(t("messages.maxSelectionError"));
        return;
      }
      setSelectedMessages(prev => [...prev, messageId]);
    }
  };

  const handleClearSelection = () => setSelectedMessages([]);

  const handleBulkDeleteMessages = async (scope: "me" | "all") => {
    if (selectedMessages.length === 0 || !selectedChatId) return;
    try {
      const result = await chatsAPI.bulkDeleteMessages(selectedChatId, {
        messageIds: selectedMessages,
        scope,
      });
      toast.success(`${result.deleted} messages deleted`);
      setSelectedMessages([]);
      queryClient.invalidateQueries({ queryKey: messageQueryKeys.chatMessages(selectedChatId) });
    } catch (error) {
      toast.error("Failed to delete messages");
    }
  };

  const isAllSelectedMessagesMine = useMemo(() => {
    if (selectedMessages.length === 0) return true;
    if (!messages) return true;
    if (displayChat?.type === "private") return true;
    const myMessages = messages.filter(m => m.own);
    return selectedMessages.every(id => myMessages.some(m => m.id === id));
  }, [selectedMessages, messages, displayChat?.type]);

  const setReplyFromMessage = (msg: Message) => {
    const firstAttachment = msg.attachments?.find((att) => att.type === "image");
    const authorName = msg.own ? currentUser?.name || "You" : selectedChat?.title || "User";
    setReplyTo({
      id: msg.id,
      author: authorName,
      text: msg.text,
      imageUrl: firstAttachment?.url,
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

  const handleCloseChat = useCallback(() => {
    // Сбрасываем локальное состояние сразу, чтобы панель гарантированно закрывалась
    // даже если роут/эффекты обновятся с задержкой.
    setSelectedChatId(null);
    setPublicChannel(null);
    setBlockedProject(null);
    setInviteToken(null);
    setJoinStatus(null);
    setChannelMeta(null);
    navigate("/messages", { replace: true });
  }, [navigate]);

  const handleGoToProfile = useCallback(() => {
    if (selectedChat?.type === "private") {
      const otherMember = selectedChat.members?.find((m) => String(m.id) !== String(currentUser?.id));
      if (otherMember?.id) {
        navigate(getProfileRoute({ id: otherMember.id }));
      }
      return;
    }
    if (displayChat?.id) {
      navigate(getProfileRoute({ id: displayChat.id }));
    }
  }, [selectedChat, currentUser?.id, navigate, displayChat?.id]);

  const handleOpenMessageInChat = useCallback((messageId: string) => {
    if (!messageId) return;
    setChatInfoOpen(false);
    setScrollToMessageId(messageId);
    setScrollToMessageNonce((prev) => prev + 1);
    setHighlightedMessageId(messageId);
    setTimeout(() => setHighlightedMessageId(null), 1200);
  }, []);

  const canManagePins = useMemo(() => {
    if (displayChat?.type === "private") return true;
    return displayChat?.role === "owner" || displayChat?.role === "admin";
  }, [displayChat?.type, displayChat?.role]);

  const handlePinMessage = useCallback(async (messageId: string) => {
    if (!activeChatId) return;
    try {
      await messagesAPI.pinMessage(activeChatId, messageId);
      const res = await messagesAPI.getPinnedMessages(activeChatId);
      setPinnedMessages(res.pins || []);
      toast.success(t("messages.pinMessageSuccess") || "Сообщение закреплено");
    } catch {
      toast.error(t("messages.pinMessageError") || "Не удалось закрепить сообщение");
    }
  }, [activeChatId, t]);

  const handleUnpinMessage = useCallback(async (messageId: string) => {
    if (!activeChatId) return;
    try {
      await messagesAPI.unpinMessage(activeChatId, messageId);
      const res = await messagesAPI.getPinnedMessages(activeChatId);
      setPinnedMessages(res.pins || []);
      toast.success(t("messages.unpinMessageSuccess") || "Сообщение откреплено");
    } catch {
      toast.error(t("messages.unpinMessageError") || "Не удалось открепить сообщение");
    }
  }, [activeChatId, t]);

  return (
    <LayoutGroup>
      <div className="flex h-screen overflow-hidden max-sm:h-[calc(100vh-76px)]">
        <ChatList
          chats={chats}
          loading={isLoading}
          selectedChatId={selectedChatId}
          currentUserId={currentUser?.id}
          onSelectChat={(chatIdValue) => navigate(resolveChatRoute(chatIdValue))}
          onCloseChat={handleCloseChat}
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

        <Dialog open={publicJoinModalOpen && !blockedProject} onOpenChange={setPublicJoinModalOpen}>
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

        <AnimatePresence mode="wait" initial={false}>
            {selectedChatId || displayChat || blockedProject ? (
            <motion.div
              key="chat-panel"
              initial={{ opacity: 0, x: 28, scale: 0.985, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 18, scale: 0.992, filter: "blur(3px)" }}
              transition={{
                opacity: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                x: { type: "spring", stiffness: 280, damping: 30, mass: 0.9 },
                scale: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                filter: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
              }}
              className="flex-1 flex flex-col min-w-0 p-3 max-sm:p-0"
            >
              <div className="flex-1 flex flex-col min-h-0 relative">
                  <div className="flex-1 flex flex-col min-h-0 rounded-3xl overflow-hidden border border-white/10 bg-transparent relative max-sm:rounded-none max-sm:border-0" style={backgroundStyle}>
                    <ChatPanel
                    user={chatPanelUser}
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
                      setChatInfoOpen(true);
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

                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    {blockedProject ? (
                      <div className="flex-1 flex items-center justify-center p-6">
                        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-black/40 p-8 text-center">
                          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold mb-4">
                            {blockedProject.name?.charAt(0) || "P"}
                          </div>
                          <h3 className="text-xl font-semibold mb-2">{blockedProject.name}</h3>
                          <p className="text-white/60 text-sm mb-6">{blockedProject.description || "Приватный проект"}</p>
                          <div className="flex items-center justify-center gap-4 text-xs text-white/40 mb-6">
                            <span className="rounded-full bg-white/10 px-3 py-1">{blockedProject.status || "idea"}</span>
                          </div>
                          <button
                            onClick={async () => {
                              if (!blockedProject.id) return;
                              setJoiningProject(true);
                              try {
                                await projectsAPI.join(blockedProject.id);
                                setBlockedProject(null);
                                toast.success('Вы вступили в проект!');
                                navigate(0);
                              } catch {
                                toast.error('Ошибка при вступлении');
                              } finally {
                                setJoiningProject(false);
                              }
                            }}
                            disabled={joiningProject}
                            className="btn-glass w-full py-3"
                          >
                            {joiningProject ? '...' : 'Вступить в проект'}
                          </button>
                          <button
                            onClick={() => navigate('/projects')}
                            className="mt-3 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Назад к проектам</span>
                          </button>
                        </div>
                      </div>
                    ) : messagesLoading ? (
                      <div className="flex-1 flex items-center justify-center text-center px-6">
                        <p className="text-sm text-secondary">Загрузка...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-center px-6 relative">
                        {activePinnedMessage && selectedMessages.length === 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              manualPinSwitchLockUntilRef.current = Date.now() + 900;
                              isManualPinPreviewRef.current = true;
                              handleOpenMessageInChat(activePinnedMessage.messageId);
                              setActivePinnedIndex((prev) =>
                                sortedPinnedMessages.length > 0 ? (prev + 1) % sortedPinnedMessages.length : 0
                              );
                            }}
                            className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-[min(92%,860px)] grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2 rounded-xl bg-white/12 border border-white/15 backdrop-blur-md hover:bg-white/16 transition-colors"
                            title={activePinnedMessage.message.text || (t("messages.pinnedMessageFallback") || "Закрепленное сообщение")}
                          >
                            <span className="shrink-0 min-w-[108px] text-xs text-white/70 uppercase tracking-wide text-left">
                              {t("messages.pinned") || "Закреплено"}
                            </span>
                            <span className="min-w-0 w-full truncate text-sm text-white/90 text-center">
                              {activePinnedMessage.message.text || (t("messages.pinnedMessageFallback") || "Закрепленное сообщение")}
                            </span>
                            <span className="shrink-0 min-w-[108px] text-right text-xs text-white/65">
                              {sortedPinnedMessages.length}
                            </span>
                          </button>
                        )}
                        {selectedMessages.length > 0 && (
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md">
                            <span className="text-xs text-white/70">{selectedMessages.length} {t("messages.selected")}</span>
                            {displayChat?.type !== "channel" && (
                              <button type="button" onClick={() => handleBulkDeleteMessages("me")} className="flex items-center gap-1 px-2 py-1 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors ml-5">
                                <Trash2 className="h-3 w-3" />{t("messages.deleteSelectedForMe")}
                              </button>
                            )}
                            {isAllSelectedMessagesMine && (
                              <button type="button" onClick={() => handleBulkDeleteMessages("all")} className="flex items-center gap-1 px-2 py-1 text-xs text-red-300 hover:text-red-200 hover:bg-white/10 rounded-md transition-colors">
                                <Trash2 className="h-3 w-3" />{t("messages.deleteSelectedForAll")}
                              </button>
                            )}
                            <button type="button" onClick={handleClearSelection} className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-sm text-secondary">
                          {t("messages.noMessages")}
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col min-h-0 relative">
                        {activePinnedMessage && selectedMessages.length === 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              manualPinSwitchLockUntilRef.current = Date.now() + 900;
                              isManualPinPreviewRef.current = true;
                              handleOpenMessageInChat(activePinnedMessage.messageId);
                              setActivePinnedIndex((prev) =>
                                sortedPinnedMessages.length > 0 ? (prev + 1) % sortedPinnedMessages.length : 0
                              );
                            }}
                            className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-[min(92%,860px)] grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2 rounded-xl bg-white/12 border border-white/15 backdrop-blur-md hover:bg-white/16 transition-colors"
                            title={activePinnedMessage.message.text || (t("messages.pinnedMessageFallback") || "Закрепленное сообщение")}
                          >
                            <span className="shrink-0 min-w-[108px] text-xs text-white/70 uppercase tracking-wide text-left">
                              {t("messages.pinned") || "Закреплено"}
                            </span>
                            <span className="min-w-0 w-full truncate text-sm text-white/90 text-center">
                              {activePinnedMessage.message.text || (t("messages.pinnedMessageFallback") || "Закрепленное сообщение")}
                            </span>
                            <span className="shrink-0 min-w-[108px] text-right text-xs text-white/65">
                              {sortedPinnedMessages.length}
                            </span>
                          </button>
                        )}
                        {selectedMessages.length > 0 && (
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md z-10">
                            <span className="text-xs text-white/70">{selectedMessages.length} {t("messages.selected")}</span>
                            {displayChat?.type !== "channel" && (
                              <button type="button" onClick={() => handleBulkDeleteMessages("me")} className="flex items-center gap-1 px-2 py-1 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors ml-5">
                                <Trash2 className="h-3 w-3" />{t("messages.deleteSelectedForMe")}
                              </button>
                            )}
                            {isAllSelectedMessagesMine && (
                              <button type="button" onClick={() => handleBulkDeleteMessages("all")} className="flex items-center gap-1 px-2 py-1 text-xs text-red-300 hover:text-red-200 hover:bg-white/10 rounded-md transition-colors">
                                <Trash2 className="h-3 w-3" />{t("messages.deleteSelectedForAll")}
                              </button>
                            )}
                            <button type="button" onClick={handleClearSelection} className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      <MessageList
                        messages={messages}
                        currentUser={currentUser}
                        selectedChatUser={null}
                        chatType={displayChat?.type}
                        highlightedMessageId={highlightedMessageId}
                        scrollToMessageId={scrollToMessageId}
                        scrollToMessageNonce={scrollToMessageNonce}
                        scrollToBottomTrigger={scrollToBottomTrigger}
                        onReply={setReplyFromMessage}
                        onToggleHeart={handleToggleHeart}
                        doubleClickAction={doubleClickAction}
                        reactionMap={reactionMap}
                        onOpenContextMenu={(message, position, bounds) =>
                          setContextMenuState({ message, position, bounds })
                        }
                        onReplyJump={handleReplyJump}
                        onDeleteRequest={(msgId, x, y) => setShowDeleteMenu({ msgId, x, y })}
                        onOpenSticker={handleOpenStickerModal}
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
                        onCommand={handleCommandClick}
                        selectedMessages={selectedMessages}
                        onSelectMessage={handleSelectMessage}
                        onVisibleRangeChange={setVisibleRange}
                        onUserScroll={() => {
                          isManualPinPreviewRef.current = false;
                        }}
                      />
                      </div>
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
                        {blockedProject ? null : !channelRole ? (
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
                        ) : channelRole !== "owner" && displayChat?.type === "channel" ? (
                          <Button
                            size="sm"
                            variant="outline"
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

              <Sheet open={chatInfoOpen} onOpenChange={setChatInfoOpen}>
                <SheetContent side="right" className="w-full max-w-[860px] overflow-y-auto border-white/10 bg-[#0b0b0f] px-5 py-6 text-white sm:bottom-4 sm:top-4 sm:h-auto sm:rounded-l-3xl sm:rounded-r-none sm:px-6 sm:py-7">
                  <SheetHeader>
                    <SheetTitle className="text-white">{t("messages.chatInfo.title")}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-5 space-y-4 pb-4 pt-2">
                    {displayChat?.type === "private" ? (
                      <PrivateChatInfoPreview
                        chatId={activeChatId || selectedChatId || ""}
                        user={chatPanelUser}
                        isOnline={isOnline}
                        lastSeen={lastSeen}
                        onGoToProfile={handleGoToProfile}
                        onOpenInChat={handleOpenMessageInChat}
                        t={t}
                      />
                    ) : displayChat?.type === "group" ? (
                      <GroupChatInfoPreview
                        chatId={activeChatId || selectedChatId || ""}
                        title={displayChat?.title}
                        membersCount={displayChat?.members?.length || channelMeta?.membersCount}
                        onGoToProfile={handleGoToProfile}
                        onOpenInChat={handleOpenMessageInChat}
                        t={t}
                      />
                    ) : (
                      <ChannelChatInfoPreview
                        chatId={activeChatId || selectedChatId || ""}
                        title={displayChat?.title}
                        membersCount={channelMeta?.membersCount || displayChat?.members?.length}
                        onGoToProfile={handleGoToProfile}
                        onOpenInChat={handleOpenMessageInChat}
                        t={t}
                      />
                    )}
                  </div>
                </SheetContent>
              </Sheet>

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
                      bounds={contextMenuState.bounds}
                      onClose={() => setContextMenuState(null)}
                    onReply={setReplyFromMessage}
                    onCopyText={handleCopyMessageText}
                    onDeleteForMe={(messageId) => handleDeleteMessage(messageId, "me")}
                    onDeleteForAll={
                      contextMenuState.message.own
                        ? (messageId) => handleDeleteMessage(messageId, "all")
                        : undefined
                    }
                    onSelect={handleSelectMessage}
                    isSelected={selectedMessages.includes(contextMenuState.message.id)}
                    chatType={displayChat?.type || "private"}
                    chatRole={displayChat?.role}
                    isPinned={pinnedMessages.some((pin) => String(pin.messageId) === String(contextMenuState.message.id))}
                    onPin={canManagePins ? handlePinMessage : undefined}
                    onUnpin={canManagePins ? handleUnpinMessage : undefined}
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
                      className="fixed z-50 rounded-2xl border border-white/10 bg-white/10"
                      style={{ left: showDeleteMenu.x, top: showDeleteMenu.y - 10 }}
                    >
                      <button
                        onClick={() => handleDeleteMessage(showDeleteMenu.msgId, "me")}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/5 transition-smooth border-b border-white/10"
                      >
                        {t("messages.deleteForMe")}
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(showDeleteMenu.msgId, "all")}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-200 hover:bg-white/5 transition-smooth"
                      >
                        {t("messages.deleteForEveryone")}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.99, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.995, y: 6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-center">
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
