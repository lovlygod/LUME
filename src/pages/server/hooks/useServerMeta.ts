import { useQuery } from "@tanstack/react-query";
import { API_BASE_PATH } from "@/lib/config";
import type { Server } from "@/types";
import { serverQueryKeys } from "./queryKeys";

const API_BASE = API_BASE_PATH;

const fetchServer = async (identifier: string | number): Promise<Server> => {
  const response = await fetch(`${API_BASE}/servers/${encodeURIComponent(identifier)}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch server");
  }
  const data = await response.json();
  return data.server;
};

export const useServerMeta = (identifier: string | number | undefined) =>
  useQuery({
    queryKey: serverQueryKeys.server(identifier ?? ""),
    queryFn: () => fetchServer(identifier as string | number),
    enabled: Boolean(identifier),
    staleTime: 2 * 60 * 1000,
  });
