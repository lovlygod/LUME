/**
 * React Query хуки для сообщений в каналах сервера
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

import { API_BASE_PATH } from "@/lib/config";

const API_BASE = API_BASE_PATH;

// ==================== Types ====================

export interface ServerMessage {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  createdAt: string;
  editedAt?: string;
  deleted: boolean;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  attachments: Array<{
    id: string;
    type: 'image' | 'file';
    url: string;
    mime: string;
    size: number;
    width?: number;
    height?: number;
  }>;
}

// ==================== Fetch Functions ====================

const fetchChannelMessages = async (
  serverId: number,
  channelId: number
): Promise<ServerMessage[]> => {
  const response = await fetch(
    `${API_BASE}/servers/${serverId}/channels/${channelId}/messages`,
    { credentials: 'include' }
  );
  if (!response.ok) throw new Error('Failed to fetch messages');
  const data = await response.json();
  return data.messages;
};

const sendMessage = async (
  serverId: number,
  channelId: number,
  text: string,
  attachmentIds?: string[]
): Promise<{ messageId: number }> => {
  const response = await fetch(
    `${API_BASE}/servers/${serverId}/channels/${channelId}/messages`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, attachmentIds }),
    }
  );
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
};

const deleteMessage = async (
  serverId: number,
  channelId: number,
  messageId: number,
  scope: 'me' | 'all' = 'me'
): Promise<void> => {
  const response = await fetch(
    `${API_BASE}/servers/${serverId}/channels/${channelId}/messages/${messageId}`,
    {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope }),
    }
  );
  if (!response.ok) throw new Error('Failed to delete message');
};

const uploadFile = async (
  serverId: number,
  channelId: number,
  file: File
): Promise<{
  attachmentId: string;
  url: string;
  type: 'image' | 'file';
  mime: string;
  size: number;
}> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_BASE}/servers/${serverId}/channels/${channelId}/upload`,
    {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }
  );
  if (!response.ok) throw new Error('Failed to upload file');
  return response.json();
};

// ==================== Query Hooks ====================

/**
 * Получить сообщения канала
 */
export const useChannelMessages = (serverId: number, channelId: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.messages.channel(serverId, channelId),
    queryFn: () => fetchChannelMessages(serverId, channelId),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 5 * 60 * 1000,    // 5 минут
  });
};

// ==================== Mutation Hooks ====================

/**
 * Отправить сообщение
 */
export const useSendMessage = (serverId: number, channelId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ text, attachmentIds }: { text: string; attachmentIds?: string[] }) =>
      sendMessage(serverId, channelId, text, attachmentIds),
    onSuccess: () => {
      // Инвалидация сообщений канала
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.channel(serverId, channelId),
      });
    },
  });
};

/**
 * Удалить сообщение
 */
export const useDeleteMessage = (serverId: number, channelId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ messageId, scope }: { messageId: number; scope?: 'me' | 'all' }) =>
      deleteMessage(serverId, channelId, messageId, scope),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.channel(serverId, channelId),
      });
    },
  });
};

/**
 * Загрузить файл
 */
export const useUploadFile = (serverId: number, channelId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => uploadFile(serverId, channelId, file),
    onSuccess: () => {
      // Файл готов к использованию, инвалидация не нужна
      // пока не прикрепим к сообщению
    },
  });
};

// ==================== Optimistic Update Hook ====================

/**
 * Отправить сообщение с оптимистичным обновлением
 */
export const useSendMessageOptimistic = (
  serverId: number,
  channelId: number,
  currentUserId: string,
  currentUser: { name: string; username: string; avatar: string; verified: boolean }
) => {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.messages.channel(serverId, channelId);
  
  return useMutation({
    mutationFn: ({ text, attachmentIds }: { text: string; attachmentIds?: string[] }) =>
      sendMessage(serverId, channelId, text, attachmentIds),
    
    // Оптимистичное обновление
    onMutate: async ({ text, attachmentIds }) => {
      // Отменяем исходящие запросы
      await queryClient.cancelQueries({ queryKey });
      
      // Сохраняем предыдущее состояние
      const previousMessages = queryClient.getQueryData<ServerMessage[]>(queryKey);
      
      // Создаём оптимистичное сообщение
      const optimisticMessage: ServerMessage = {
        id: `temp-${Date.now()}`,
        channelId: String(channelId),
        userId: currentUserId,
        text,
        createdAt: new Date().toISOString(),
        deleted: false,
        author: {
          id: currentUserId,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar,
          verified: currentUser.verified,
        },
        attachments: attachmentIds?.map(id => ({
          id,
          type: 'file' as const,
          url: '',
          mime: '',
          size: 0,
        })) || [],
      };
      
      // Обновляем кэш
      if (previousMessages) {
        queryClient.setQueryData(queryKey, [...previousMessages, optimisticMessage]);
      }
      
      return { previousMessages };
    },
    
    // Если ошибка - откатываем
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKey, context.previousMessages);
      }
    },
    
    // В любом случае инвалидируем после завершения
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
