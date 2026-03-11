export const messageQueryKeys = {
  chats: () => ["chats"] as const,
  chatList: () => [...messageQueryKeys.chats(), "list"] as const,
  chatMessages: (userId: string) => [...messageQueryKeys.chats(), "messages", userId] as const,
  chatUser: (userId: string) => [...messageQueryKeys.chats(), "user", userId] as const,
  presence: (userId: string) => [...messageQueryKeys.chats(), "presence", userId] as const,
  typing: (userId: string) => [...messageQueryKeys.chats(), "typing", userId] as const,
  readStatus: (userId: string) => [...messageQueryKeys.chats(), "read-status", userId] as const,
};
