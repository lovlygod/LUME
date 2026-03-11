import { useInfiniteQuery } from "@tanstack/react-query";
import { API_BASE_PATH } from "@/lib/config";
import type { ServerMessage } from "@/types";
import { serverQueryKeys } from "./queryKeys";

const API_BASE = API_BASE_PATH;

type ServerMessageResponse = {
  messages: Array<ServerMessage & { deleted_for_me?: boolean; deleted_for_all?: boolean } & { replyToMessageId?: string | null }>;
};

const fetchChannelMessages = async (
  serverId: number,
  channelId: number,
  before?: string | number
): Promise<ServerMessageResponse> => {
  const params = new URLSearchParams();
  params.set("limit", "50");
  if (before) params.set("before", String(before));
  const response = await fetch(
    `${API_BASE}/servers/${serverId}/channels/${channelId}/messages?${params.toString()}`,
    { credentials: "include" }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }
  return response.json();
};

const normalizeMessage = (
  msg: ServerMessageResponse["messages"][number]
): ServerMessage & { deletedForMe?: boolean; deletedForAll?: boolean; replyToMessageId?: string | null } => ({
  ...msg,
  deletedForMe: msg.deleted_for_me === true,
  deletedForAll: msg.deleted_for_all === true,
  replyToMessageId: msg.replyToMessageId || null,
  linkPreview: msg.linkPreview ?? null,
});

export const useChannelMessages = (serverId: number | null, channelId: number | null) =>
  useInfiniteQuery({
    queryKey: serverQueryKeys.channelMessages(serverId || 0, channelId || 0),
    queryFn: ({ pageParam }) =>
      fetchChannelMessages(serverId as number, channelId as number, pageParam),
    enabled: Boolean(serverId && channelId),
    initialPageParam: undefined as string | number | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.messages?.length < 50) return undefined;
      const first = lastPage.messages?.[0];
      return first ? first.id : undefined;
    },
    select: (data) => ({
      pageParams: data.pageParams,
      pages: data.pages.map((page) => ({
        ...page,
        messages: page.messages.map(normalizeMessage),
      })),
    }),
  });
