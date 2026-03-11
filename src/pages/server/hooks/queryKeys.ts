export const serverQueryKeys = {
  servers: () => ["servers"] as const,
  server: (identifier: string | number) => ["servers", identifier] as const,
  channels: (serverId: number) => ["servers", serverId, "channels"] as const,
  members: (serverId: number) => ["servers", serverId, "members"] as const,
  channelMessages: (serverId: number, channelId: number) =>
    ["servers", serverId, "channels", channelId, "messages"] as const,
};
