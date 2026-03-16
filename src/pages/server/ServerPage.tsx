import { useEffect, useMemo, useState } from "react";
import { LayoutGroup, AnimatePresence, motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Channel, Server, ServerMessage } from "@/types";
import type { Attachment } from "@/types/messages";
import { apiRequest } from "@/services/api";
import { API_BASE_PATH } from "@/lib/config";
import { ImageViewer } from "@/components/media/ImageViewer";
import { errorHandler } from "@/services/errorHandler";
import { ServerLayout } from "./components/ServerLayout";
import { ChannelHeader } from "./components/ChannelHeader";
import { useChatBackground } from "@/hooks/useChatBackground";
import { ChannelMessageList } from "./components/ChannelMessageList";
import { ChannelComposer } from "./components/ChannelComposer";
import { useQueryClient } from "@tanstack/react-query";
import { useServerMeta } from "./hooks/useServerMeta";
import { useServerChannels } from "./hooks/useServerChannels";
import { useChannelMessages } from "./hooks/useChannelMessages";
import { useSendChannelMessage } from "./hooks/useSendChannelMessage";
import { useDeleteChannelMessage } from "./hooks/useDeleteChannelMessage";
import { useChannelWs } from "./hooks/useChannelWs";
import { serverQueryKeys } from "./hooks/queryKeys";
import { getReplyPreview, ReplyPreview } from "./hooks/useReply";
import { Loader } from "@/components/ui/Loader";

const ServerPage = () => {
  const { identifier, channelName } = useParams<{ identifier: string; channelName: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();

  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [msgText, setMsgText] = useState("");
  const { backgroundStyle } = useChatBackground();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [replyTo, setReplyTo] = useState<ReplyPreview | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);
  const [scrollToMessageNonce, setScrollToMessageNonce] = useState(0);

  const queryClient = useQueryClient();
  const { data: serverData, isLoading: serverLoading } = useServerMeta(identifier);
  const server: Server | null = serverData || null;
  const { data: channelsData } = useServerChannels(server?.id);
  const channels = channelsData || server?.channels || [];

  useEffect(() => {
    if (!server || !channels.length) return;
    if (!channelName) {
      const defaultChannel = channels[0];
      navigate(`/server/${identifier}/channel/${defaultChannel.name}`, { replace: true });
      return;
    }
    const found = channels.find((ch) => ch.name === channelName) || channels[0];
    setCurrentChannel(found);
  }, [channels, channelName, identifier, navigate, server]);

  const channelId = currentChannel?.id || null;
  const serverId = server?.id || null;

  const {
    data: messagesData,
    isFetching: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChannelMessages(serverId, channelId);

  const messages = useMemo(
    () => messagesData?.pages.flatMap((page) => page.messages) || [],
    [messagesData]
  );

  const sendMessage = useSendChannelMessage(serverId || 0, channelId || 0);
  const deleteMessage = useDeleteChannelMessage(serverId || 0, channelId || 0);

  useChannelWs(serverId, channelId);

  const handleJoin = async () => {
    if (!server) return;
    try {
      if (server.type === "public") {
        await apiRequest(`/servers/${server.id}/join`, { method: "POST" });
      } else {
        await apiRequest(`/servers/${server.id}/request-join`, { method: "POST" });
      }
      toast.success(t("servers.join"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: serverQueryKeys.server(identifier ?? "") }),
        queryClient.invalidateQueries({ queryKey: serverQueryKeys.server(server.id) }),
        queryClient.invalidateQueries({ queryKey: serverQueryKeys.channels(server.id) }),
      ]);
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
    }
  };

  const handleFileSelect = async (files: File[]) => {
    if (!serverId || !channelId) return;

    const tasks = files.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${API_BASE_PATH}/servers/uploads`, {
          method: "POST",
          body: formData,
          credentials: "include",
          headers: {
            ...(document.cookie.includes("csrfToken=")
              ? { "X-CSRF-Token": (document.cookie.split("csrfToken=")[1] || "").split(";")[0] }
              : {}),
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || errorData.error || "Upload failed");
        }
        const uploaded = (await response.json()) as {
          attachmentId: string;
          type: "image" | "file";
          url: string;
          mime: string;
          size: number;
        };
        setAttachments((prev) => [
          ...prev,
          {
            id: String(uploaded.attachmentId),
            type: uploaded.type,
            url: uploaded.url,
            mime: uploaded.mime,
            size: uploaded.size,
          },
        ]);
        toast.success(t("servers.fileUploaded"));
      } catch (error) {
        errorHandler.handleApiError(error, { showToast: true });
        const message = error instanceof Error ? error.message : t("servers.fileUploadError");
        toast.error(message);
      }
    });

    await Promise.all(tasks);
  };

  const handleSend = async () => {
    if ((!msgText.trim() && attachments.length === 0) || !serverId || !channelId) return;
    try {
      const trimmed = msgText.trim();
      const attachmentIds = attachments.map((att) => att.id).filter(Boolean);
      await sendMessage.mutateAsync({
        ...(trimmed ? { text: trimmed } : {}),
        ...(attachmentIds.length ? { attachmentIds } : {}),
        ...(replyTo?.id ? { replyToMessageId: replyTo.id } : {}),
      });
      setMsgText("");
      setAttachments([]);
      setReplyTo(null);
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      const message = error instanceof Error ? error.message : t("servers.messageSendError");
      toast.error(message);
    }
  };

  const handleDeleteMessage = async (messageId: string, scope: "me" | "all" = "me") => {
    try {
      await deleteMessage.mutateAsync({ messageId, scope });
      setShowDeleteMenu(null);
      toast.success(t("servers.messageDeleted"));
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      const message = error instanceof Error ? error.message : t("servers.messageDeleteError");
      toast.error(message);
    }
  };

  const setReplyFromMessage = (msg: ServerMessage) => {
    const authorName = msg.author?.name || msg.author?.username || "User";
    setReplyTo(getReplyPreview(msg, authorName));
  };

  const handleReplyJump = (messageId: string) => {
    setScrollToMessageId(messageId);
    setScrollToMessageNonce((prev) => prev + 1);
    setHighlightedMessageId(messageId);
    setTimeout(() => setHighlightedMessageId(null), 1200);
  };

  if (!server && serverLoading) {
    return (
      <ServerLayout
        server={server}
        currentChannelId={channelId}
        onSelectChannel={(channel) => setCurrentChannel(channel)}
      >
        <div className="flex items-center justify-center h-full">
          <Loader size={64} />
        </div>
      </ServerLayout>
    );
  }

  if (!server) {
    return (
      <ServerLayout
        server={server}
        currentChannelId={channelId}
        onSelectChannel={(channel) => setCurrentChannel(channel)}
      >
        <div className="flex items-center justify-center h-full">
          <Loader size={64} />
        </div>
      </ServerLayout>
    );
  }

  if (!server.isMember && !server.joinRequest) {
    return (
      <ServerLayout
        server={server}
        currentChannelId={channelId}
        onSelectChannel={(channel) => setCurrentChannel(channel)}
      >
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-6 text-center">
            {server.iconUrl ? (
              <img src={server.iconUrl} alt={server.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold text-3xl mx-auto mb-4">
                {server.name[0].toUpperCase()}
              </div>
            )}
            <div className="text-2xl text-white font-semibold">{server.name}</div>
            <div className="text-secondary mt-2">{server.description || t("servers.descriptionEmpty")}</div>
            <button
              onClick={handleJoin}
              className="mt-6 w-full rounded-full bg-white/10 px-4 py-2 text-white hover:bg-white/15 transition-smooth"
            >
              {server.type === "public" ? t("servers.join") : t("servers.requestAccess")}
            </button>
          </div>
        </div>
      </ServerLayout>
    );
  }

  if (!server.isMember && server.joinRequest?.status === "pending") {
    return (
      <ServerLayout
        server={server}
        currentChannelId={channelId}
        onSelectChannel={(channel) => setCurrentChannel(channel)}
      >
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-6 text-center">
            <div className="text-lg font-semibold text-white">{t("servers.requestPending")}</div>
            <div className="text-secondary mt-2">{t("servers.requestPendingDesc", { server: server.name })}</div>
          </div>
        </div>
      </ServerLayout>
    );
  }

  if (!server.isMember && server.joinRequest?.status === "rejected") {
    return (
      <ServerLayout
        server={server}
        currentChannelId={channelId}
        onSelectChannel={(channel) => setCurrentChannel(channel)}
      >
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-6 text-center">
            <div className="text-lg font-semibold text-white">{t("servers.requestRejected")}</div>
            <div className="text-secondary mt-2">{t("servers.requestRejectedDesc", { server: server.name })}</div>
          </div>
        </div>
      </ServerLayout>
    );
  }

  return (
    <LayoutGroup>
      <ServerLayout
        server={server}
        currentChannelId={channelId}
        onSelectChannel={(channel) => {
          setCurrentChannel(channel);
          navigate(`/server/${identifier}/channel/${channel.name}`);
        }}
      >
        <div className="flex h-full flex-col p-4">
            <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-transparent">
            <ChannelHeader channelName={currentChannel?.name || channelName || "general"} />
            <div className="flex-1 min-h-0 bg-white/5 backdrop-blur-[24px] overflow-hidden flex flex-col" style={backgroundStyle}>
              <ChannelMessageList
                messages={messages}
                currentUser={currentUser}
                highlightedMessageId={highlightedMessageId}
                scrollToMessageId={scrollToMessageId}
                scrollToMessageNonce={scrollToMessageNonce}
                onReply={setReplyFromMessage}
                onReplyJump={handleReplyJump}
                onDeleteRequest={(msgId, x, y) => setShowDeleteMenu({ msgId, x, y })}
                onOpenImage={(imageId, src) => {
                  setActiveImageId(imageId);
                  setActiveImageSrc(src);
                }}
                onLoadMore={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                  }
                }}
                loading={messagesLoading}
                emptyLabel={t("servers.noMessages")}
                emptySubLabel={t("servers.firstMessage")}
              />
            </div>
          </div>

          <ChannelComposer
            msgText={msgText}
            isSending={sendMessage.isPending}
            attachments={attachments}
            replyTo={replyTo}
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
            onSend={handleSend}
            placeholder={t("servers.messagePlaceholder", { channel: currentChannel?.name || "" })}
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
                  {t("servers.deleteForMe")}
                </button>
                <button
                  onClick={() => handleDeleteMessage(showDeleteMenu.msgId, "all")}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-200 hover:bg-white/5 transition-smooth"
                >
                  {t("servers.deleteForEveryone")}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </ServerLayout>
    </LayoutGroup>
  );
};

export default ServerPage;
