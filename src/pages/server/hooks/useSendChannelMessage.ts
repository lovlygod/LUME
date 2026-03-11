import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_PATH } from "@/lib/config";
import { serverQueryKeys } from "./queryKeys";

const API_BASE = API_BASE_PATH;

type SendMessagePayload = {
  text?: string;
  attachmentIds?: string[];
  replyToMessageId?: string | null;
};

const sendMessage = async (
  serverId: number,
  channelId: number,
  payload: SendMessagePayload
): Promise<{ messageId: number }> => {
  const csrfToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrfToken='))
    ?.split('=')[1];

  const response = await fetch(`${API_BASE}/servers/${serverId}/channels/${channelId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to send message");
  }
  return response.json();
};

export const useSendChannelMessage = (serverId: number, channelId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => sendMessage(serverId, channelId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serverQueryKeys.channelMessages(serverId, channelId),
      });
      queryClient.invalidateQueries({
        queryKey: serverQueryKeys.channels(serverId),
      });
      queryClient.invalidateQueries({
        queryKey: serverQueryKeys.server(serverId),
      });
    },
  });
};
