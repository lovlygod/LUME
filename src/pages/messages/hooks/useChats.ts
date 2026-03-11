import { useQuery } from "@tanstack/react-query";
import { messagesAPI } from "@/services/api";
import type { Chat } from "@/types/messages";
import { messageQueryKeys } from "./queryKeys";

export const useChats = () =>
  useQuery<{ chats: Chat[] }>({
    queryKey: messageQueryKeys.chatList(),
    queryFn: () => messagesAPI.getChats(),
    staleTime: 60_000,
  });
