import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { Server, Channel, ServerMessage } from '@/types';

interface ServerContextType {
  currentServer: Server | null;
  currentChannel: Channel | null;
  servers: Server[];
  isLoading: boolean;
  joinRequests: Array<{
    id: number;
    userId: number;
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    createdAt: string;
  }>;
  fetchServer: (identifier: string) => Promise<Server | null>;
  fetchServerChannels: (serverId: number) => Promise<Channel[]>;
  joinServer: (serverId: number) => Promise<boolean>;
  leaveServer: (serverId: number) => Promise<boolean>;
  requestJoin: (serverId: number) => Promise<boolean>;
  approveJoinRequest: (serverId: number, requestId: number) => Promise<boolean>;
  rejectJoinRequest: (serverId: number, requestId: number) => Promise<boolean>;
  fetchJoinRequests: (serverId: number) => Promise<void>;
  createChannel: (serverId: number, name: string) => Promise<Channel | null>;
  fetchChannelMessages: (serverId: number, channelId: number) => Promise<ServerMessage[]>;
  sendMessage: (serverId: number, channelId: number, text: string) => Promise<boolean>;
  setCurrentChannel: (channel: Channel | null) => void;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

import { API_BASE_PATH } from "@/lib/config";

const API_BASE = API_BASE_PATH;

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [currentServer, setCurrentServer] = useState<Server | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joinRequests, setJoinRequests] = useState<Array<{
    id: number;
    userId: number;
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    createdAt: string;
  }>>([]);

  // При использовании cookies заголовки Authorization не нужны
  // credentials: 'include' автоматически отправляет cookies

  const fetchServer = useCallback(async (identifier: string): Promise<Server | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/servers/${encodeURIComponent(identifier)}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        if (response.status === 401) {
          console.error('Unauthorized - please login');
          return null;
        }
        throw new Error('Failed to fetch server');
      }

      const data = await response.json();
      setCurrentServer(data.server);
      return data.server;
    } catch (error) {
      console.error('Error fetching server:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchServerChannels = useCallback(async (serverId: number): Promise<Channel[]> => {
    try {
      const response = await fetch(`${API_BASE}/servers/${serverId}`, {
        credentials: 'include',
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.server.channels || [];
    } catch (error) {
      console.error('Error fetching channels:', error);
      return [];
    }
  }, []);

  const joinServer = useCallback(async (serverId: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/servers/${serverId}/join`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join');
      }

      if (currentServer) {
        setCurrentServer({ ...currentServer, isMember: true });
      }

      return true;
    } catch (error) {
      console.error('Error joining server:', error);
      return false;
    }
  }, [currentServer]);

  const leaveServer = useCallback(async (serverId: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/servers/${serverId}/leave`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to leave');
      }

      if (currentServer) {
        setCurrentServer({ ...currentServer, isMember: false, role: null });
      }

      return true;
    } catch (error) {
      console.error('Error leaving server:', error);
      return false;
    }
  }, [currentServer]);

  const requestJoin = useCallback(async (serverId: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/servers/${serverId}/request-join`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request join');
      }

      if (currentServer) {
        setCurrentServer({
          ...currentServer,
          joinRequest: { id: (await response.json()).requestId, status: 'pending' },
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting join:', error);
      return false;
    }
  }, [currentServer]);

  const approveJoinRequest = useCallback(async (serverId: number, requestId: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/servers/${serverId}/requests/${requestId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve');
      }

      setJoinRequests(prev => prev.filter(r => r.id !== requestId));

      return true;
    } catch (error) {
      console.error('Error approving request:', error);
      return false;
    }
  }, []);

  const rejectJoinRequest = useCallback(async (serverId: number, requestId: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/servers/${serverId}/requests/${requestId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject');
      }

      setJoinRequests(prev => prev.filter(r => r.id !== requestId));

      return true;
    } catch (error) {
      console.error('Error rejecting request:', error);
      return false;
    }
  }, []);

  const fetchJoinRequests = useCallback(async (serverId: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/servers/${serverId}/requests`, {
        credentials: 'include',
      });

      if (!response.ok) return;

      const data = await response.json();
      setJoinRequests(data.requests);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    }
  }, []);

  const createChannel = useCallback(async (serverId: number, name: string): Promise<Channel | null> => {
    try {
      const response = await fetch(`${API_BASE}/servers/${serverId}/channels`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create channel');
      }

      const data = await response.json();

      if (currentServer?.channels) {
        setCurrentServer({
          ...currentServer,
          channels: [...currentServer.channels, data.channel],
        });
      }

      return data.channel;
    } catch (error) {
      console.error('Error creating channel:', error);
      return null;
    }
  }, [currentServer]);

  const fetchChannelMessages = useCallback(async (serverId: number, channelId: number): Promise<ServerMessage[]> => {
    try {
      const response = await fetch(`${API_BASE}/servers/${serverId}/channels/${channelId}/messages`, {
        credentials: 'include',
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }, []);

  const sendMessage = useCallback(async (serverId: number, channelId: number, text: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/servers/${serverId}/channels/${channelId}/messages`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ text }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, []);

  return (
    <ServerContext.Provider
      value={{
        currentServer,
        currentChannel,
        servers,
        isLoading,
        joinRequests,
        fetchServer,
        fetchServerChannels,
        joinServer,
        leaveServer,
        requestJoin,
        approveJoinRequest,
        rejectJoinRequest,
        fetchJoinRequests,
        createChannel,
        fetchChannelMessages,
        sendMessage,
        setCurrentChannel,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => {
  const context = useContext(ServerContext);
  if (context === undefined) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
};
