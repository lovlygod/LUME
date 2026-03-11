import { useQuery } from "@tanstack/react-query";
import { profileAPI } from "@/services/api";
import type { User } from "@/types";
import { messageQueryKeys } from "./queryKeys";

export const useChat = (userId: string | null) =>
  useQuery<{ user: User }>({
    queryKey: messageQueryKeys.chatUser(userId || ""),
    queryFn: () => profileAPI.getUserById(userId as string),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
