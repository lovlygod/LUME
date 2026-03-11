import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsService } from "@/services/websocket";
import { serverQueryKeys } from "./queryKeys";

type ChannelMessagePayload = {
  messageId: number | string;
  channelId: number | string;
  serverId: number | string;
  userId: number | string;
  text: string;
  createdAt: string;
};

type ChannelDeletePayload = {
  messageId: number | string;
  channelId: number | string;
  scope: "me" | "all";
  userId?: number | string;
};

export const useChannelWs = (serverId: number | null, channelId: number | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!serverId || !channelId) return;

    const trySubscribe = () => {
      if (wsService.isConnected()) {
        wsService.send({ type: "server:subscribe", serverId });
        return true;
      }
      return false;
    };

    let attempts = 0;
    let intervalId: number | undefined;
    if (!trySubscribe()) {
      intervalId = window.setInterval(() => {
        attempts += 1;
        if (trySubscribe() || attempts >= 10) {
          if (intervalId) window.clearInterval(intervalId);
        }
      }, 500);
    }

    const newMessageUnsub = wsService.on(
      "channel:new_message",
      (data: ChannelMessagePayload) => {
        if (String(data.channelId) !== String(channelId)) return;
        queryClient.invalidateQueries({
          queryKey: serverQueryKeys.channelMessages(serverId, channelId),
        });
      }
    );

    const deleteUnsub = wsService.on(
      "channel:message_deleted",
      (data: ChannelDeletePayload) => {
        if (String(data.channelId) !== String(channelId)) return;
        queryClient.invalidateQueries({
          queryKey: serverQueryKeys.channelMessages(serverId, channelId),
        });
      }
    );

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      newMessageUnsub();
      deleteUnsub();
      if (wsService.isConnected()) {
        wsService.send({ type: "server:unsubscribe", serverId });
      }
    };
  }, [channelId, queryClient, serverId]);
};
