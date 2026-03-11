import { useQuery } from "@tanstack/react-query";
import { API_BASE_PATH } from "@/lib/config";
import type { Channel } from "@/types";
import { serverQueryKeys } from "./queryKeys";

const API_BASE = API_BASE_PATH;

const fetchChannels = async (serverId: number): Promise<Channel[]> => {
  const response = await fetch(`${API_BASE}/servers/${serverId}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch channels");
  }
  const data = await response.json();
  return data.server?.channels || [];
};

export const useServerChannels = (serverId: number | null | undefined) =>
  useQuery({
    queryKey: serverQueryKeys.channels(serverId || 0),
    queryFn: () => fetchChannels(serverId as number),
    enabled: Boolean(serverId),
    staleTime: 60 * 1000,
  });
