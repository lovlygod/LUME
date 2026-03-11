/**
 * React Query хуки для серверов (Communities)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateServers } from '@/lib/queryClient';
import type { Server, Channel, Member, JoinRequest } from '@/types';

import { API_BASE_PATH } from "@/lib/config";

const API_BASE = API_BASE_PATH;

// ==================== Fetch Functions ====================

const fetchServers = async (type: 'my' | 'public'): Promise<Server[]> => {
  const response = await fetch(`${API_BASE}/servers/${type}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch servers');
  const data = await response.json();
  return data.servers;
};

const fetchServer = async (identifier: string | number): Promise<Server> => {
  const response = await fetch(`${API_BASE}/servers/${encodeURIComponent(identifier)}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch server');
  const data = await response.json();
  return data.server;
};

const createServer = async (data: FormData): Promise<Server> => {
  const response = await fetch(`${API_BASE}/servers`, {
    method: 'POST',
    credentials: 'include',
    body: data,
  });
  if (!response.ok) throw new Error('Failed to create server');
  return response.json();
};

const updateServer = async (serverId: number, data: Partial<Server>): Promise<Server> => {
  const response = await fetch(`${API_BASE}/servers/${serverId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update server');
  return response.json();
};

const deleteServer = async (serverId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/servers/${serverId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete server');
};

const joinServer = async (serverId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/servers/${serverId}/join`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to join server');
};

const leaveServer = async (serverId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/servers/${serverId}/leave`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to leave server');
};

const requestJoin = async (serverId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/servers/${serverId}/request-join`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to request join');
};

const approveJoinRequest = async (serverId: number, requestId: number): Promise<void> => {
  const response = await fetch(
    `${API_BASE}/servers/${serverId}/requests/${requestId}/approve`,
    { method: 'POST', credentials: 'include' }
  );
  if (!response.ok) throw new Error('Failed to approve request');
};

const rejectJoinRequest = async (serverId: number, requestId: number): Promise<void> => {
  const response = await fetch(
    `${API_BASE}/servers/${serverId}/requests/${requestId}/reject`,
    { method: 'POST', credentials: 'include' }
  );
  if (!response.ok) throw new Error('Failed to reject request');
};

const fetchJoinRequests = async (serverId: number): Promise<JoinRequest[]> => {
  const response = await fetch(`${API_BASE}/servers/${serverId}/requests`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch join requests');
  const data = await response.json();
  return data.requests;
};

const createChannel = async (serverId: number, name: string): Promise<Channel> => {
  const response = await fetch(`${API_BASE}/servers/${serverId}/channels`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to create channel');
  return response.json();
};

const fetchMembers = async (serverId: number): Promise<Member[]> => {
  const response = await fetch(`${API_BASE}/servers/${serverId}/members`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch members');
  const data = await response.json();
  return data.members;
};

const updateMemberRole = async (serverId: number, memberId: number, roleId: number): Promise<void> => {
  const response = await fetch(
    `${API_BASE}/servers/${serverId}/members/${memberId}/role`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId }),
    }
  );
  if (!response.ok) throw new Error('Failed to update role');
};

const kickMember = async (serverId: number, memberId: number): Promise<void> => {
  const response = await fetch(
    `${API_BASE}/servers/${serverId}/members/${memberId}`,
    { method: 'DELETE', credentials: 'include' }
  );
  if (!response.ok) throw new Error('Failed to kick member');
};

// ==================== Query Hooks ====================

/**
 * Получить мои серверы
 */
export const useMyServers = () => {
  return useQuery({
    queryKey: queryKeys.servers.list('my'),
    queryFn: () => fetchServers('my'),
    staleTime: 10 * 60 * 1000, // 10 минут
  });
};

/**
 * Получить публичные серверы
 */
export const usePublicServers = () => {
  return useQuery({
    queryKey: queryKeys.servers.list('public'),
    queryFn: () => fetchServers('public'),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

/**
 * Получить сервер по identifier
 */
export const useServer = (identifier: string | number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.servers.detail(identifier),
    queryFn: () => fetchServer(identifier),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Получить заявки на вступление (для Owner)
 */
export const useJoinRequests = (serverId: number) => {
  return useQuery({
    queryKey: queryKeys.servers.joinRequests(serverId),
    queryFn: () => fetchJoinRequests(serverId),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Получить участников сервера
 */
export const useServerMembers = (serverId: number) => {
  return useQuery({
    queryKey: queryKeys.servers.members(serverId),
    queryFn: () => fetchMembers(serverId),
    staleTime: 5 * 60 * 1000,
  });
};

// ==================== Mutation Hooks ====================

/**
 * Создать сервер
 */
export const useCreateServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createServer,
    onSuccess: (data) => {
      // Инвалидация списка серверов
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.list('my') });
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.list('public') });
      // Добавляем новый сервер в кэш
      queryClient.setQueryData(
        queryKeys.servers.detail(data.id),
        data
      );
    },
  });
};

/**
 * Обновить сервер
 */
export const useUpdateServer = (serverId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Server>) => updateServer(serverId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.servers.detail(serverId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.list('my') });
    },
  });
};

/**
 * Удалить сервер
 */
export const useDeleteServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.all() });
    },
  });
};

/**
 * Вступить в сервер
 */
export const useJoinServer = (serverId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => joinServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.detail(serverId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.list('my') });
    },
  });
};

/**
 * Покинуть сервер
 */
export const useLeaveServer = (serverId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => leaveServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.detail(serverId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.list('my') });
    },
  });
};

/**
 * Подать заявку на вступление
 */
export const useRequestJoin = (serverId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => requestJoin(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.detail(serverId) });
    },
  });
};

/**
 * Одобрить заявку
 */
export const useApproveJoinRequest = (serverId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (requestId: number) => approveJoinRequest(serverId, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.joinRequests(serverId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.detail(serverId) });
    },
  });
};

/**
 * Отклонить заявку
 */
export const useRejectJoinRequest = (serverId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (requestId: number) => rejectJoinRequest(serverId, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.joinRequests(serverId) });
    },
  });
};

/**
 * Создать канал
 */
export const useCreateChannel = (serverId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (name: string) => createChannel(serverId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.detail(serverId) });
    },
  });
};

/**
 * Изменить роль участника
 */
export const useUpdateMemberRole = (serverId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: number; roleId: number }) =>
      updateMemberRole(serverId, memberId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.members(serverId) });
    },
  });
};

/**
 * Кикнуть участника
 */
export const useKickMember = (serverId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (memberId: number) => kickMember(serverId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.members(serverId) });
    },
  });
};
