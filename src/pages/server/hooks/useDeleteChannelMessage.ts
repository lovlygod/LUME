import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_PATH } from "@/lib/config";
import { serverQueryKeys } from "./queryKeys";

const API_BASE = API_BASE_PATH;

const deleteMessage = async (
  serverId: number,
  channelId: number,
  messageId: string,
  scope: "me" | "all"
) => {
  const response = await fetch(
    `${API_BASE}/servers/${serverId}/channels/${channelId}/messages/${messageId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope }),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to delete message");
  }
};

export const useDeleteChannelMessage = (serverId: number, channelId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, scope }: { messageId: string; scope: "me" | "all" }) =>
      deleteMessage(serverId, channelId, messageId, scope),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serverQueryKeys.channelMessages(serverId, channelId),
      });
    },
  });
};
