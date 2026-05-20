import { useMutation, useQueryClient } from "@tanstack/react-query";
import { e2eeAPI, messagesAPI } from "@/services/api";
import { messageSounds } from "@/services/messageSounds";
import type { Message, Chat } from "@/types/messages";
import { messageQueryKeys } from "./queryKeys";
import { isE2EEEnabled, isE2EEStrictMode } from "@/services/e2ee/featureFlags";
import { getE2EEProvider } from "@/services/e2ee/provider";
import { getLocalE2EEDeviceState } from "@/services/e2ee/deviceStore";

export const useSendMessage = (currentUserId?: string) => {
  const queryClient = useQueryClient();

  const trySendE2EE = async (payload: {
    chatId: string;
    text?: string;
  }) => {
    const provider = getE2EEProvider();
    const device = getLocalE2EEDeviceState();
    const plaintext = String(payload.text || "");

    if (!provider || !device || !plaintext) {
      return { sent: false as const };
    }

    const chatsData = queryClient.getQueryData<{ chats: Chat[] }>(messageQueryKeys.chatList());
    const chat = (chatsData?.chats || []).find((item) => String(item.id) === String(payload.chatId));
    const memberIds = (chat?.members || [])
      .map((m) => String(m.id))
      .filter((id) => id && id !== String(device.userId));

    const uniqueMemberIds = Array.from(new Set(memberIds));
    if (uniqueMemberIds.length === 0) {
      return { sent: false as const };
    }

    const recipients: Array<{ userId: string; deviceId: string }> = [];
    for (const memberId of uniqueMemberIds) {
      const bundles = await e2eeAPI.getUserDeviceBundles(memberId, device.deviceId);
      const devices = Array.isArray((bundles as { devices?: unknown[] })?.devices)
        ? ((bundles as { devices?: Array<{ userId?: string; deviceId?: string }> }).devices || [])
        : [];
      devices.forEach((d) => {
        if (d?.userId && d?.deviceId) {
          recipients.push({ userId: String(d.userId), deviceId: String(d.deviceId) });
        }
      });
    }

    if (recipients.length === 0) {
      return { sent: false as const };
    }

    const packets = await provider.encryptMessageForDevices({
      chatId: payload.chatId,
      plaintext,
      senderDeviceId: device.deviceId,
      recipients,
    });

    for (const packet of packets) {
      await e2eeAPI.sendEncryptedEnvelope({
        chatId: payload.chatId,
        senderDeviceId: device.deviceId,
        recipientUserId: packet.recipientUserId,
        recipientDeviceId: packet.recipientDeviceId,
        protocolVersion: packet.protocolVersion || 1,
        clientMessageId: packet.clientMessageId || `msg-${Date.now()}`,
        sentAt: packet.sentAt || new Date().toISOString(),
        envelope: packet.envelope,
      });
    }

    return { sent: true as const, packetsCount: packets.length };
  };

  return useMutation({
    mutationFn: async (payload: {
      chatId: string;
      text?: string;
      attachmentIds?: string[];
      replyToMessageId?: string | null;
      stickerId?: string | null;
    }) => {
      const e2eeOn = isE2EEEnabled();
      const strict = isE2EEStrictMode();

      if (e2eeOn && payload.text && !payload.stickerId && (!payload.attachmentIds || payload.attachmentIds.length === 0)) {
        const result = await trySendE2EE({ chatId: payload.chatId, text: payload.text });
        if (result.sent) {
          return {
            message: "E2EE message sent",
            messageId: `e2ee-${Date.now()}`,
            type: "text",
            e2ee: true,
          };
        }
        if (strict) {
          throw new Error("E2EE strict mode enabled: provider/device state is not ready");
        }
      }

      return messagesAPI.sendMessage(payload);
    },
    onSuccess: async (data, variables) => {
      messageSounds.playSend();
      const now = new Date().toISOString();
      const chatKey = messageQueryKeys.chatMessages(variables.chatId);
      const chatsKey = messageQueryKeys.chatList();
      const isE2EEMessage = Boolean((data as { e2ee?: boolean })?.e2ee);

      queryClient.setQueryData<{ messages: Message[] }>(chatKey, (prev) => {
        const list = prev?.messages || [];
        const optimistic: Message = {
          id: (data as { messageId?: string | number }).messageId?.toString() || `temp-${Date.now()}`,
          senderId: currentUserId ? String(currentUserId) : "self",
          sender: currentUserId
            ? {
                id: String(currentUserId),
                name: undefined,
                username: undefined,
                avatar: undefined,
                verified: false,
              }
            : null,
          text: variables.text || "",
          type: (data as { type?: Message["type"] }).type ?? (variables.stickerId ? "sticker" : "text"),
          sticker: (data as { sticker?: Message["sticker"] }).sticker ?? (variables.stickerId ? { id: variables.stickerId, url: "" } : null),
          timestamp: now,
          own: true,
          attachments: (data as { attachments?: Message["attachments"] }).attachments,
          replyToMessageId: (data as { replyToMessageId?: string | null }).replyToMessageId ?? variables.replyToMessageId ?? null,
          linkPreview: (data as { linkPreview?: Message["linkPreview"] }).linkPreview ?? null,
        };
        if (list.some((m) => m.id === optimistic.id)) return prev ?? { messages: list };
        return { messages: [...list, optimistic] };
      });

      queryClient.setQueryData<{ chats: Chat[] }>(chatsKey, (prev) => {
        if (!prev?.chats) return prev;
        const exists = prev.chats.find((chat) => String(chat.id) === String(variables.chatId));
        const lastMessage =
          variables.stickerId
            ? "[sticker]"
            : variables.text ||
              (variables.attachmentIds?.length
                ? `[${variables.attachmentIds.length} attachment]`
                : exists?.lastMessage || "");

        if (!exists) {
          const userData = queryClient.getQueryData<{ user: { id: string; name?: string; username?: string; avatar?: string; verified?: boolean } }>(
            messageQueryKeys.chatUser(variables.chatId)
          );
          const newChat: Chat = {
            id: `${Date.now()}`,
            type: "private",
            title: userData?.user?.name || userData?.user?.username,
            avatar: userData?.user?.avatar,
            lastMessage,
            timestamp: now,
            unread: 0,
          };
          return { chats: [newChat, ...prev.chats] };
        }

        const updated = prev.chats.map((chat) =>
          String(chat.id) === String(variables.chatId)
            ? {
                ...chat,
                lastMessage,
                timestamp: now,
              }
            : chat
        );
        return { chats: updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) };
      });
    },
  });
};
