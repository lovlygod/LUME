import { useQuery } from "@tanstack/react-query";
import { messagesAPI } from "@/services/api";
import type { Message } from "@/types/messages";
import { messageQueryKeys } from "./queryKeys";

export const useChatMessages = (userId: string | null) =>
  useQuery<{ messages: Message[] }>({
    queryKey: messageQueryKeys.chatMessages(userId || ""),
    queryFn: () => messagesAPI.getMessages(userId as string),
    enabled: Boolean(userId),
  });
