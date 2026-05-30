import { API_BASE_PATH } from "@/lib/config";
import type { User, VerificationRequest, VerificationStatus, Post, Comment } from "@/types";
import type { Chat, Attachment, Message, ChatAttachmentFeedType, ChatAttachmentFeedItem, ChatPinnedMessage } from "@/types/messages";
import type { StickerPack, StickerPackWithStickers } from "@/types/stickers";

const API_BASE_URL = API_BASE_PATH;

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let refreshSubscribers: Array<{ resolve: () => void; reject: (error: unknown) => void }> = [];

const subscribeToTokenRefresh = () => {
  return new Promise<void>((resolve, reject) => {
    refreshSubscribers.push({ resolve, reject });
  });
};

// Call all subscribers after token refresh
const onTokenRefreshed = () => {
  refreshSubscribers.forEach(({ resolve }) => resolve());
  refreshSubscribers = [];
};

const onTokenRefreshFailed = (error: unknown) => {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
};

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const getCsrfToken = (): string | null => getCookie('csrfToken');

// Import error handler
import { errorHandler, ApiError } from './errorHandler';

type ApiPost = Post & {
  user_id?: string | number;
  image_url?: string;
  image_urls?: string[];
  created_at?: string;
  createdAt?: string;
};

const normalizePost = (post: ApiPost): Post => {
  return {
    id: post.id?.toString(),
    userId: (post.userId ?? post.user_id ?? "").toString(),
    text: post.text,
    imageUrl: post.imageUrl ?? post.image_url,
    imageUrls: post.imageUrls ?? post.image_urls,
    timestamp: post.timestamp ?? post.createdAt ?? post.created_at ?? new Date().toISOString(),
    replies: post.replies ?? 0,
    reposts: post.reposts ?? 0,
    resonance: post.resonance ?? 0,
    name: post.name,
    username: post.username,
    avatar: post.avatar,
    verified: post.verified,
  };
};

export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retry = true,
  signal?: AbortSignal
): Promise<T> => {
  // Получаем CSRF токен из cookie
  const csrfToken = getCsrfToken();
  const isFormData = options.body instanceof FormData;
  
  try {
    const mergedHeaders: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };
    if (isFormData) {
      delete mergedHeaders['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // Включаем cookies
      signal,
      headers: mergedHeaders,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError: ApiError = {
        error: {
          message: errorData.error?.message || errorData.message || `HTTP error! status: ${response.status}`,
          code: errorData.error?.code || 'UNKNOWN',
          statusCode: response.status,
          details: errorData.error?.details,
        },
      };

      const shouldTryRefresh = response.status === 401 || response.status === 403;
      if (shouldTryRefresh && retry && !isRefreshing) {
        isRefreshing = true;

        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/refresh`, {
            method: 'POST',
            credentials: 'include', // Отправляем refresh token cookie
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (refreshResponse.ok) {
            // Notify all waiting requests
            onTokenRefreshed();
            isRefreshing = false;

            // Retry original request with new token
            return apiRequest(endpoint, options, false, signal);
          } else {
            // Refresh failed
            isRefreshing = false;
            errorHandler.handleApiError(apiError, { showToast: false });
            const refreshError = new Error('Session expired. Please login again.');
            onTokenRefreshFailed(refreshError);
            throw refreshError;
          }
        } catch (refreshError) {
          isRefreshing = false;
          onTokenRefreshFailed(refreshError);
          throw refreshError;
        }
      } else if (isRefreshing) {
        // Wait for the refresh to complete
        await subscribeToTokenRefresh();
        return apiRequest(endpoint, options, false, signal);
      }

      // Throw structured error
      throw apiError;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorHandler.handleNetworkError(error, { showToast: false });
    }
    throw error;
  }
};

export const authAPI = {
  register: async (userData: { email: string; password: string; name?: string; username: string }) => {
    return apiRequest<{ token: string; user: User }>('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: { email: string; password: string }) => {
    return apiRequest<{ token: string; user: User }>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};

export const onboardingAPI = {
  getStatus: async () => apiRequest<{ onboarding: User }>('/onboarding/status', { method: 'GET' }),
  saveProfile: async (payload: Record<string, unknown>) => apiRequest('/onboarding/profile', { method: 'POST', body: JSON.stringify(payload) }),
  saveSkills: async (skills: string[]) => apiRequest('/onboarding/skills', { method: 'POST', body: JSON.stringify({ skills }) }),
  saveGoals: async (goals: string[]) => apiRequest('/onboarding/goals', { method: 'POST', body: JSON.stringify({ goals }) }),
  saveWorkspace: async (payload: Record<string, unknown>) => apiRequest('/onboarding/workspace', { method: 'POST', body: JSON.stringify(payload) }),
  complete: async () => apiRequest('/onboarding/complete', { method: 'POST' }),

  // Backward-compatible social graph methods (used by Profile/UserProfile/Verified pages)
  getSuggestions: async (): Promise<{ users: User[] }> => {
    return apiRequest('/onboarding/suggestions', {
      method: 'GET',
    });
  },

  batchFollow: async (userIds: string[]) => {
    return apiRequest('/follow/batch', {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  },

  unfollow: async (userId: string) => {
    return apiRequest(`/follow/${userId}`, {
      method: 'DELETE',
    });
  },

  checkFollowing: async (userId: string): Promise<{ following: boolean }> => {
    return apiRequest(`/follow/status/${userId}`, {
      method: 'GET',
    });
  },

  getFollowers: async (userId: string): Promise<{ followers: User[]; total: number }> => {
    return apiRequest(`/users/${userId}/followers`, {
      method: 'GET',
    });
  },

  getFollowing: async (userId: string): Promise<{ following: User[]; total: number }> => {
    return apiRequest(`/users/${userId}/following`, {
      method: 'GET',
    });
  },
};

export const profileAPI = {
  getCurrentUser: async (): Promise<{ user: User }> => {
    return apiRequest('/profile', {
      method: 'GET',
    });
  },

  getUserById: async (userId: string, signal?: AbortSignal): Promise<{ user: User }> => {
    return apiRequest(`/profile/${userId}`, {
      method: 'GET',
    }, true, signal);
  },

  updateProfile: async (profileData: Partial<User>) => {
    return apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  deleteAccount: async (password: string): Promise<{ message: string }> => {
    return apiRequest('/profile', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  },

  uploadAvatar: async (file: File): Promise<{ message: string; avatar: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Включаем cookies
      headers: {
        ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() as string } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();
    if (!data?.avatar || typeof data.avatar !== 'string' || data.avatar.trim().length === 0) {
      throw new Error('Avatar upload did not return a valid URL');
    }
    return data;
  },

  uploadBanner: async (file: File): Promise<{ message: string; banner: string }> => {
    const formData = new FormData();
    formData.append('banner', file);

    const response = await fetch(`${API_BASE_URL}/profile/banner`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Включаем cookies
      headers: {
        ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() as string } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();
    if (!data?.banner || typeof data.banner !== 'string' || data.banner.trim().length === 0) {
      throw new Error('Banner upload did not return a valid URL');
    }
    return data;
  },
};

export type SessionInfo = {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  city?: string | null;
  country?: string | null;
  region?: string | null;
  provider?: string | null;
  location?: string | null;
  lastActive: string;
  current: boolean;
};

export const sessionsAPI = {
  getSessions: async (): Promise<{ sessions: SessionInfo[] }> => {
    return apiRequest('/sessions', {
      method: 'GET',
    });
  },
  deleteSession: async (sessionId: string): Promise<{ message: string }> => {
    return apiRequest(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },
  logoutAllOther: async (): Promise<{ message: string }> => {
    return apiRequest('/sessions/logout-all', {
      method: 'POST',
    });
  },
};

export const economyAPI = {
  getWallet: async (): Promise<{ wallet: Record<string, unknown> }> => {
    return apiRequest('/economy/wallet', { method: 'GET' });
  },
  getWalletStats: async (): Promise<{ stats: Record<string, unknown> }> => {
    return apiRequest('/economy/wallet/stats', { method: 'GET' });
  },
  transfer: async (payload: { to: string; amount_coin: string; idempotency_key: string; encrypted?: Record<string, unknown> | null }) => {
    return apiRequest('/economy/coin/transfers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getWalletE2EESync: async (params: { deviceId: string; afterId?: string | number; limit?: number }) => {
    const q = new URLSearchParams();
    q.set('deviceId', String(params.deviceId || ''));
    if (params.afterId !== undefined) q.set('afterId', String(params.afterId));
    if (params.limit !== undefined) q.set('limit', String(params.limit));
    return apiRequest<{ items: Array<Record<string, unknown>>; nextCursor: string }>(`/economy/wallet/e2ee/sync?${q.toString()}`, { method: 'GET' });
  },
  ackWalletE2EEEnvelope: async (envelopeId: number | string, payload: { deviceId: string; status: 'delivered' | 'decrypted' }) => {
    return apiRequest<{ ok: boolean }>(`/economy/wallet/e2ee/envelopes/${encodeURIComponent(String(envelopeId))}/ack`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getRecipientPreview: async (to: string): Promise<{ recipient: { wallet_id: number; address: string; user_id: number | null; username: string | null; name: string | null; avatar: string | null } }> => {
    return apiRequest(`/economy/coin/recipient-preview?to=${encodeURIComponent(to)}`, { method: 'GET' });
  },
  createCoinOrder: async (payload: { amount_coin: string; provider?: string }) => {
    return apiRequest('/economy/coin/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getWalletTransactions: async (): Promise<{ transactions: Array<Record<string, unknown>> }> => {
    return apiRequest('/economy/wallet/transactions', { method: 'GET' });
  },
  getExplorerPublic: async (): Promise<{ transactions: Array<Record<string, unknown>> }> => {
    return apiRequest('/economy/wallet/explorer/public', { method: 'GET' });
  },
  getMarketListings: async (params?: {
    cursor?: number;
    limit?: number;
    q?: string;
    sort?: 'new' | 'price_asc' | 'price_desc' | 'expiring';
    min_price_coin?: string;
    max_price_coin?: string;
    only_new?: boolean;
  }): Promise<{ listings: Array<Record<string, unknown>> }> => {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', String(params.cursor));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.q) query.set('q', params.q);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.min_price_coin) query.set('min_price_coin', params.min_price_coin);
    if (params?.max_price_coin) query.set('max_price_coin', params.max_price_coin);
    if (typeof params?.only_new === 'boolean') query.set('only_new', String(params.only_new));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/economy/usernames/listings${suffix}`, { method: 'GET' });
  },
  getMyUsernames: async (): Promise<{ usernames: Array<Record<string, unknown>> }> => {
    return apiRequest('/economy/usernames/my', { method: 'GET' });
  },
  getUserUsernames: async (userId: string | number): Promise<{ usernames: Array<Record<string, unknown>> }> => {
    return apiRequest(`/economy/users/${encodeURIComponent(String(userId))}/usernames`, { method: 'GET' });
  },
  setUsernameVisibility: async (usernameId: number, isVisible: boolean): Promise<{ username: Record<string, unknown> }> => {
    return apiRequest(`/economy/usernames/${usernameId}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ is_visible: isVisible }),
    });
  },
  setUsernameDisplayOrder: async (usernameId: number, displayOrder: number): Promise<{ username: Record<string, unknown> }> => {
    return apiRequest(`/economy/usernames/${usernameId}/display-order`, {
      method: 'PATCH',
      body: JSON.stringify({ display_order: displayOrder }),
    });
  },
  clearUsernameDisplayOrder: async (usernameId: number): Promise<{ username: Record<string, unknown> }> => {
    return apiRequest(`/economy/usernames/${usernameId}/display-order`, {
      method: 'DELETE',
    });
  },
  createMarketListing: async (payload: { username_id: number; price_coin: string }) => {
    return apiRequest('/economy/usernames/listings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  cancelMarketListing: async (listingId: number) => {
    return apiRequest(`/economy/usernames/listings/${listingId}/cancel`, {
      method: 'POST',
    });
  },
  getMarketListingById: async (listingId: number): Promise<{ listing: Record<string, unknown> }> => {
    return apiRequest(`/economy/usernames/listings/${listingId}`, { method: 'GET' });
  },
  buyMarketListing: async (listingId: number, idempotencyKey: string, clientRequestMs?: number) => {
    return apiRequest(`/economy/usernames/listings/${listingId}/buy`, {
      method: 'POST',
      body: JSON.stringify({ idempotency_key: idempotencyKey, ...(clientRequestMs ? { client_request_ms: clientRequestMs } : {}) }),
    });
  },
};

export const postsAPI = {
  getUserPosts: async (userId: string, signal?: AbortSignal): Promise<{ posts: Post[] }> => {
    if (userId === 'home') {
      const response = await apiRequest<{ posts: ApiPost[] }>('/posts', {
        method: 'GET',
      }, true, signal);
      return { posts: response.posts.map(normalizePost) };
    }
    const response = await apiRequest<{ posts: ApiPost[] }>(`/users/${userId}/posts`, {
      method: 'GET',
    }, true, signal);
    return { posts: response.posts.map(normalizePost) };
  },

  getRecommendedPosts: async (signal?: AbortSignal): Promise<{ posts: Post[] }> => {
    const response = await apiRequest<{ posts: ApiPost[] }>('/posts/recommended', {
      method: 'GET',
    }, true, signal);
    return { posts: response.posts.map(normalizePost) };
  },

  getFollowingPosts: async (signal?: AbortSignal): Promise<{ posts: Post[] }> => {
    const response = await apiRequest<{ posts: ApiPost[] }>('/posts/following', {
      method: 'GET',
    }, true, signal);
    return { posts: response.posts.map(normalizePost) };
  },

  createPost: async (postData: { text?: string; images?: File[] }): Promise<{ message: string; postId: number; post?: Post }> => {
    if (postData.images && postData.images.length > 0) {
      const formData = new FormData();
      if (postData.text) {
        formData.append('text', postData.text);
      }
      postData.images.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Включаем cookies
        headers: {
          ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() as string } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    }

    return apiRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  deletePost: async (postId: string): Promise<{ message: string }> => {
    return apiRequest(`/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  reportPost: async (postId: string, reason: string): Promise<{ message: string; reportId: number }> => {
    return apiRequest(`/posts/${postId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  resonance: async (postId: string): Promise<{ message: string; resonance: number; liked: boolean }> => {
    return apiRequest(`/posts/${postId}/resonance`, {
      method: 'POST',
    });
  },

  getResonanceStatus: async (postId: string): Promise<{ resonance: number; liked: boolean }> => {
    return apiRequest(`/posts/${postId}/resonance`, {
      method: 'GET',
    });
  },

  getComments: async (postId: string): Promise<{ comments: Comment[] }> => {
    return apiRequest(`/posts/${postId}/comments`, {
      method: 'GET',
    });
  },

  addComment: async (postId: string, text: string): Promise<{ message: string; commentId: number; comment: Comment }> => {
    return apiRequest(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },
};

export const messagesAPI = {
  getChats: async (signal?: AbortSignal): Promise<{ chats: Chat[] }> => {
    return apiRequest('/chats', {
      method: 'GET',
    }, true, signal);
  },

  createChat: async (payload: {
    type: 'private' | 'group' | 'channel';
    userId?: string;
    userIds?: string[];
    title?: string;
    avatar?: string | null;
    isPublic?: boolean;
    isPrivate?: boolean;
    username?: string | null;
  }): Promise<{ chatId: string; existing?: boolean }> => {
    const { userId, userIds, ...rest } = payload;
    return apiRequest('/chats', {
      method: 'POST',
      body: JSON.stringify({
        ...rest,
        ...(userId ? { userIds: [userId] } : {}),
        ...(userIds && userIds.length ? { userIds } : {}),
      }),
    });
  },

  updateChat: async (
    chatId: string,
    payload: {
      title?: string | null;
      avatar?: string | null;
      isPublic?: boolean;
      isPrivate?: boolean;
      username?: string | null;
      regenerateInvite?: boolean;
    }
  ): Promise<{ chat: Chat | null }> => {
    return apiRequest(`/chats/${chatId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  addChatMember: async (chatId: string, payload: { userId?: string; username?: string; role?: 'owner' | 'admin' | 'member' }) => {
    return apiRequest(`/chats/${chatId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  removeChatMember: async (chatId: string, userId: string) => {
    return apiRequest(`/chats/${chatId}/members/${userId}`, {
      method: 'DELETE',
    });
  },
  deleteChat: async (chatId: string): Promise<{ message: string }> => {
    return apiRequest(`/chats/${chatId}`, {
      method: 'DELETE',
    });
  },
  leaveChat: async (chatId: string, userId: string) => {
    return apiRequest(`/chats/${chatId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  getPublicChannels: async (query: string): Promise<{ channels: Array<{ id: string; title?: string | null; username?: string | null; avatar?: string | null; membersCount?: number }> }> => {
    const endpoint = `/chats/public?q=${encodeURIComponent(query || '')}`;
    return apiRequest(endpoint, { method: 'GET' });
  },

  getPublicChannel: async (chatId: string): Promise<{ channel: { id: string; title?: string | null; username?: string | null; avatar?: string | null; isPublic?: boolean; membersCount?: number; role?: string | null } }> => {
    return apiRequest(`/chats/${chatId}/public`, { method: 'GET' });
  },

  getChatByUsername: async (username: string): Promise<{ chat: Chat & { membersCount?: number; joinStatus?: string | null; project_id?: number }; project?: any }> => {
    return apiRequest(`/chats/username/${encodeURIComponent(username)}`, { method: 'GET' });
  },


  getChatByPublicNumber: async (publicNumber: string): Promise<{ chat: Chat & { membersCount?: number; joinStatus?: string | null } }> => {
    return apiRequest(`/chats/public-number/${encodeURIComponent(publicNumber)}`, { method: 'GET' });
  },

  getChatInvite: async (token: string): Promise<{ chat: Chat & { membersCount?: number; joinStatus?: string | null } }> => {
    return apiRequest(`/chats/invite/${encodeURIComponent(token)}`, { method: 'GET' });
  },

  requestJoin: async (chatId: string): Promise<{ status: string }> => {
    return apiRequest(`/chats/${chatId}/join-requests`, { method: 'POST' });
  },

  listJoinRequests: async (chatId: string): Promise<{ requests: Array<{ id: string; userId: string; status: string; createdAt: string; user: User }> }> => {
    return apiRequest(`/chats/${chatId}/join-requests`, { method: 'GET' });
  },

  reviewJoinRequest: async (chatId: string, requestId: string, action: 'approve' | 'reject'): Promise<{ status: string }> => {
    return apiRequest(`/chats/${chatId}/join-requests/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  subscribeChannel: async (chatId: string) => {
    return apiRequest(`/chats/${chatId}/subscribe`, { method: 'POST' });
  },

  unsubscribeChannel: async (chatId: string) => {
    return apiRequest(`/chats/${chatId}/subscribe`, { method: 'DELETE' });
  },

  getMessages: async (chatId: string, signal?: AbortSignal): Promise<{ messages: Message[] }> => {
    return apiRequest(`/chats/${chatId}/messages`, {
      method: 'GET',
    }, true, signal);
  },

  getChatAttachments: async (
    chatId: string,
    params: { type: ChatAttachmentFeedType; limit?: number; before?: string | null }
  ): Promise<{ items: ChatAttachmentFeedItem[]; hasMore: boolean; nextCursor: string | null }> => {
    const query = new URLSearchParams();
    query.set('type', params.type);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.before) query.set('before', params.before);
    return apiRequest(`/chats/${chatId}/attachments?${query.toString()}`, { method: 'GET' });
  },

  sendMessage: async (messageData: { chatId: string; text?: string; attachmentIds?: string[]; replyToMessageId?: string | null; stickerId?: string | null }) => {
    return apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  sendVoice: async (data: { chatId: string; audio: Blob; duration: number; replyToMessageId?: string | null }) => {
    const formData = new FormData();
    formData.append('audio', data.audio, `voice-${Date.now()}.webm`);
    formData.append('chatId', data.chatId);
    formData.append('duration', String(data.duration));
    if (data.replyToMessageId) {
      formData.append('replyToMessageId', data.replyToMessageId);
    }

    const response = await fetch(`${API_BASE_URL}/messages/voice`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() as string } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        error: {
          message: errorData.error?.message || errorData.error || errorData.message || `HTTP error! status: ${response.status}`,
          code: errorData.error?.code || 'UNKNOWN',
          statusCode: response.status,
          details: errorData.error?.details,
        },
      };
    }

    return response.json() as Promise<{ message: string; messageId: string; attachment: Attachment }>;
  },

  sendMoment: async (data: { chatId: string; file: File; ttlSeconds?: number }) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('chatId', data.chatId);
    if (data.ttlSeconds) {
      formData.append('ttlSeconds', String(data.ttlSeconds));
    }

    const response = await fetch(`${API_BASE_URL}/media`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() as string } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<{ messageId: string | number; momentId: string | number; thumbDataUrl?: string | null; ttlSeconds?: number; expiresAt?: string | null }>;
  },

  openMedia: async (momentId: string) => {
    return apiRequest<{ token: string; expiresAt: string }>(`/media/${momentId}/open`, {
      method: 'POST',
    });
  },

  getMomentContent: async (momentId: string, token: string): Promise<{ url: string; mime?: string; expiresAt?: string | null }> => {
    const params = new URLSearchParams({ token });
    return apiRequest(`/media/${momentId}/content?${params.toString()}`, {
      method: 'GET',
    });
  },

  markMediaViewed: async (momentId: string) => {
    return apiRequest(`/media/${momentId}/viewed`, {
      method: 'POST',
    });
  },

  markAsRead: async (chatId: string, lastReadMessageId: string) => {
    return apiRequest(`/chats/${chatId}/read`, {
      method: 'POST',
      body: JSON.stringify({ lastReadMessageId }),
    });
  },

  getReadStatus: async (chatId: string) => {
    return apiRequest(`/chats/${chatId}/read-status`, {
      method: 'GET',
    });
  },

  deleteMessage: async (messageId: string, scope: 'me' | 'all' = 'me') => {
    return apiRequest(`/messages/${messageId}?scope=${scope}`, {
      method: 'DELETE',
    });
  },

  searchMessages: async (query: string, limit?: number) => {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', String(limit));
    return apiRequest(`/messages/search?${params}`, {
      method: 'GET',
    });
  },

  getPinnedMessages: async (chatId: string): Promise<{ pins: ChatPinnedMessage[] }> => {
    return apiRequest(`/chats/${chatId}/pins`, {
      method: 'GET',
    });
  },

  pinMessage: async (chatId: string, messageId: string): Promise<{
    pinned: boolean;
    alreadyPinned: boolean;
    chatId: string;
    messageId: string;
    pinId: string | null;
    pinnedAt: string | null;
  }> => {
    return apiRequest(`/chats/${chatId}/pins/${messageId}`, {
      method: 'POST',
    });
  },

  unpinMessage: async (chatId: string, messageId: string): Promise<{
    unpinned: boolean;
    chatId: string;
    messageId: string;
    existed: boolean;
  }> => {
    return apiRequest(`/chats/${chatId}/pins/${messageId}`, {
      method: 'DELETE',
    });
  },
};

export const stickersAPI = {
  getPacks: async (): Promise<{ packs: StickerPack[] }> => {
    return apiRequest('/stickers/packs', {
      method: 'GET',
    });
  },
  getPack: async (packId: string): Promise<StickerPackWithStickers> => {
    return apiRequest(`/stickers/packs/${packId}`, {
      method: 'GET',
    });
  },
  getPackBySlug: async (slug: string): Promise<StickerPackWithStickers> => {
    return apiRequest(`/stickers/slug/${slug}`, {
      method: 'GET',
    });
  },
  getPublicPackBySlug: async (slug: string): Promise<StickerPackWithStickers> => {
    return apiRequest(`/stickers/public/slug/${slug}`, {
      method: 'GET',
    });
  },
  getMyPacks: async (): Promise<{ packs: StickerPack[] }> => {
    return apiRequest('/stickers/mine', {
      method: 'GET',
    });
  },
  addPack: async (packId: string): Promise<{ message: string }> => {
    return apiRequest('/stickers/add-pack', {
      method: 'POST',
      body: JSON.stringify({ packId }),
    });
  },
};

export const searchAPI = {
  searchUsers: async (query: string): Promise<{ users: User[] }> => {
    const endpoint = query ? `/users?q=${encodeURIComponent(query)}` : '/users';
    return apiRequest(endpoint, {
      method: 'GET',
    });
  },
};

export const verificationAPI = {
  getVerificationStatus: async (userId: string): Promise<{ verificationStatus: VerificationStatus | null }> => {
    return apiRequest(`/profile/${userId}/verification-status`, {
      method: 'GET',
    });
  },

  submitVerificationRequest: async (data: { reason: string; tiktokVideoUrl: string }): Promise<{ message: string; requestId: number }> => {
    return apiRequest('/profile/verification-request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getVerificationRequests: async (): Promise<{ requests: VerificationRequest[] }> => {
    return apiRequest('/admin/verification-requests', {
      method: 'GET',
    });
  },

  reviewVerificationRequest: async (requestId: number, data: { status: 'approved' | 'rejected'; reviewNotes?: string }): Promise<{ message: string }> => {
    return apiRequest(`/admin/review-verification-request/${requestId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAllUsers: async (): Promise<{ users: User[] }> => {
    return apiRequest('/admin/users', {
      method: 'GET',
    });
  },

  // Admin: Post reports
  getPostReports: async (): Promise<{ reports: unknown[] }> => {
    return apiRequest('/admin/post-reports', {
      method: 'GET',
    });
  },

  reviewPostReport: async (reportId: number, data: { action: 'delete_post' | 'dismiss'; reviewNotes?: string }): Promise<{ message: string }> => {
    return apiRequest(`/admin/post-reports/${reportId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ==================== SOCIAL GRAPH ====================

export const socialGraphAPI = {
  getSuggestions: async (): Promise<{ users: User[] }> => {
    return apiRequest('/onboarding/suggestions', {
      method: 'GET',
    });
  },

  batchFollow: async (userIds: string[]) => {
    return apiRequest('/follow/batch', {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  },

  unfollow: async (userId: string) => {
    return apiRequest(`/follow/${userId}`, {
      method: 'DELETE',
    });
  },

  checkFollowing: async (userId: string): Promise<{ following: boolean }> => {
    return apiRequest(`/follow/status/${userId}`, {
      method: 'GET',
    });
  },

  getFollowers: async (userId: string): Promise<{ followers: User[]; total: number }> => {
    return apiRequest(`/users/${userId}/followers`, {
      method: 'GET',
    });
  },

  getFollowing: async (userId: string): Promise<{ following: User[]; total: number }> => {
    return apiRequest(`/users/${userId}/following`, {
      method: 'GET',
    });
  },
};

// ==================== USER PROFILE ====================

export const usersAPI = {
  getUserById: async (userId: string, signal?: AbortSignal): Promise<{ user: User }> => {
    return apiRequest(`/users/${userId}`, {
      method: 'GET',
    }, true, signal);
  },

  updateProfile: async (data: { 
    name?: string;
    username?: string;
    bio?: string; 
    city?: string; 
    website?: string;
    primaryRole?: string;
    skills?: string[];
    availability?: string;
    githubUrl?: string;
    telegramUsername?: string;
  }) => {
    return apiRequest('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  checkUsernameAvailability: async (username: string): Promise<{ available: boolean }> => {
    return apiRequest(`/usernames/availability?username=${encodeURIComponent(username)}`, {
      method: 'GET',
    });
  },

  pinPost: async (postId: string) => {
    return apiRequest(`/users/me/pin/${postId}`, {
      method: 'POST',
    });
  },

  unpinPost: async () => {
    return apiRequest('/users/me/pin', {
      method: 'DELETE',
    });
  },

  getPresence: async (userId: string, signal?: AbortSignal) => {
    return apiRequest(`/users/${userId}/presence`, {
      method: 'GET',
    }, true, signal);
  },
};

export interface WorkspaceItem {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  description?: string | null;
  type: 'public' | 'private';
  focus_tags?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectItem {
  id: number;
  owner_id: number;
  workspace_id?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  status: 'idea' | 'building' | 'testing' | 'launched' | 'paused' | 'archived';
  visibility: 'public' | 'private';
  stack?: string[] | null;
  tags?: string[] | null;
  github_url?: string | null;
  demo_url?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  looking_for_members?: boolean;
  is_open_source?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TaskItem {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assignee_id?: number | null;
  creator_id?: number | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: number;
  workspace_id: number;
  user_id: number;
  role: 'owner' | 'admin' | 'lead' | 'developer' | 'designer' | 'member' | 'guest';
  title?: string | null;
  joined_at: string;
  user?: {
    id: number;
    username: string;
    name: string;
    avatar?: string | null;
  };
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: string;
  joined_at: string;
  user?: {
    id: number;
    username: string;
    name: string;
    avatar?: string | null;
  };
}

export interface BuilderProfile {
  id: number;
  username: string;
  name: string;
  avatar?: string | null;
  bio?: string | null;
  primary_role?: string | null;
  skills?: string[] | null;
  availability?: string | null;
  github_url?: string | null;
  telegram_username?: string | null;
  website?: string | null;
  created_at?: string;
}

export const workspacesAPI = {
  getMy: async (): Promise<{ workspaces: WorkspaceItem[] }> => {
    return apiRequest('/workspaces/my', { method: 'GET' });
  },
  getPublic: async (): Promise<{ workspaces: WorkspaceItem[] }> => {
    return apiRequest('/workspaces/public', { method: 'GET' });
  },
  create: async (payload: {
    name: string;
    slug: string;
    description?: string;
    type?: 'public' | 'private';
    focusTags?: string[];
  }): Promise<{ workspace: WorkspaceItem }> => {
    return apiRequest('/workspaces', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  joinByInvite: async (inviteCode: string): Promise<{ message: string; workspaceId: number }> => {
    return apiRequest(`/workspaces/join/${encodeURIComponent(inviteCode)}`, {
      method: 'POST',
    });
  },
  getBySlug: async (slug: string): Promise<{ workspace: WorkspaceItem }> => {
    return apiRequest(`/workspaces/${encodeURIComponent(slug)}`, { method: 'GET' });
  },
};

export const projectsAPI = {
  getMy: async (): Promise<{ projects: ProjectItem[] }> => {
    return apiRequest('/projects/my', { method: 'GET' });
  },
  getPublic: async (): Promise<{ projects: ProjectItem[] }> => {
    return apiRequest('/projects/public', { method: 'GET' });
  },
  create: async (payload: {
    workspaceId?: number;
    name: string;
    slug: string;
    description?: string;
    status?: ProjectItem['status'];
    visibility?: ProjectItem['visibility'];
    stack?: string[];
    tags?: string[];
    githubUrl?: string;
    demoUrl?: string;
    lookingForMembers?: boolean;
    isOpenSource?: boolean;
  }): Promise<{ project: ProjectItem }> => {
    return apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getBySlug: async (slug: string): Promise<{ project: ProjectItem }> => {
    return apiRequest(`/projects/${encodeURIComponent(slug)}`, { method: 'GET' });
  },
  update: async (id: number, payload: Partial<ProjectItem>): Promise<{ project: ProjectItem }> => {
    return apiRequest(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  delete: async (id: number): Promise<{ message: string }> => {
    return apiRequest(`/projects/${id}`, { method: 'DELETE' });
  },
  linkChat: async (projectId: number, chatId: string): Promise<{ message: string }> => {
    return apiRequest(`/projects/${projectId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ chatId }),
    });
  },
  unlinkChat: async (projectId: number): Promise<{ message: string }> => {
    return apiRequest(`/projects/${projectId}/chat`, { method: 'DELETE' });
  },
  getChat: async (projectId: number): Promise<{ chat: any }> => {
    return apiRequest(`/projects/${projectId}/chat`, { method: 'GET' });
  },
  join: async (projectId: number): Promise<{ message: string }> => {
    return apiRequest(`/projects/${projectId}/join`, { method: 'POST' });
  },
  leave: async (projectId: number): Promise<{ message: string }> => {
    return apiRequest(`/projects/${projectId}/leave`, { method: 'POST' });
  },
};

export const chatsAPI = {
  getProject: async (chatId: string): Promise<{ project: any }> => {
    return apiRequest(`/chats/${chatId}/project`, { method: 'GET' });
  },
  bulkDeleteMessages: async (
    chatId: string,
    payload: { messageIds: string[]; scope: 'me' | 'all' }
  ): Promise<{ deleted: number; scope: 'me' | 'all' }> => {
    return apiRequest(`/chats/${chatId}/messages/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const tasksAPI = {
  getByProject: async (projectId: number): Promise<{ tasks: TaskItem[] }> => {
    return apiRequest(`/projects/${projectId}/tasks`, { method: 'GET' });
  },
  create: async (projectId: number, payload: {
    title: string;
    description?: string;
    status?: TaskItem['status'];
    priority?: TaskItem['priority'];
    assigneeId?: number;
    dueDate?: string;
  }): Promise<{ task: TaskItem }> => {
    return apiRequest(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update: async (taskId: number, payload: Partial<TaskItem>): Promise<{ task: TaskItem }> => {
    return apiRequest(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  delete: async (taskId: number): Promise<{ message: string }> => {
    return apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
  },
  createFromMessage: async (projectId: number, payload: {
    title: string;
    sourceMessageId?: number;
  }): Promise<{ task: TaskItem }> => {
    return apiRequest(`/projects/${projectId}/tasks/from-message`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const exploreAPI = {
  getBuilders: async (params?: {
    role?: string;
    skill?: string;
    availability?: string;
  }): Promise<{ builders: BuilderProfile[] }> => {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.skill) query.append('skill', params.skill);
    if (params?.availability) query.append('availability', params.availability);
    return apiRequest(`/explore/builders?${query}`, { method: 'GET' });
  },
  getProjects: async (params?: {
    status?: string;
    stack?: string;
    tags?: string;
    needsMembers?: boolean;
  }): Promise<{ projects: ProjectItem[] }> => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.stack) query.append('stack', params.stack);
    if (params?.tags) query.append('tags', params.tags);
    if (params?.needsMembers) query.append('needsMembers', 'true');
    return apiRequest(`/explore/projects?${query}`, { method: 'GET' });
  },
  getWorkspaces: async (): Promise<{ workspaces: WorkspaceItem[] }> => {
    return apiRequest('/explore/workspaces', { method: 'GET' });
  },
  getLookingForTeam: async (): Promise<{ projects: ProjectItem[] }> => {
    return apiRequest('/explore/looking-for-team', { method: 'GET' });
  },
};

export const workspaceMembersAPI = {
  getMembers: async (workspaceId: number): Promise<{ members: WorkspaceMember[] }> => {
    return apiRequest(`/workspaces/${workspaceId}/members`, { method: 'GET' });
  },
  addMember: async (workspaceId: number, payload: {
    userId: number;
    role?: string;
    title?: string;
  }): Promise<{ message: string }> => {
    return apiRequest(`/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateMember: async (workspaceId: number, userId: number, payload: {
    role?: string;
    title?: string;
  }): Promise<{ message: string }> => {
    return apiRequest(`/workspaces/${workspaceId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  removeMember: async (workspaceId: number, userId: number): Promise<{ message: string }> => {
    return apiRequest(`/workspaces/${workspaceId}/members/${userId}`, { method: 'DELETE' });
  },
  generateInvite: async (workspaceId: number, expiresInHours?: number): Promise<{ invite: { code: string; expires_at: string } }> => {
    return apiRequest(`/workspaces/${workspaceId}/invites`, {
      method: 'POST',
      body: JSON.stringify({ expiresInHours }),
    });
  },
};

export const projectMembersAPI = {
  getMembers: async (projectId: number): Promise<{ members: ProjectMember[] }> => {
    return apiRequest(`/projects/${projectId}/members`, { method: 'GET' });
  },
  addMember: async (projectId: number, payload: {
    userId: number;
    role: string;
  }): Promise<{ message: string }> => {
    return apiRequest(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  removeMember: async (projectId: number, userId: number): Promise<{ message: string }> => {
    return apiRequest(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
  },
  searchUsers: async (projectId: number, query: string): Promise<{ users: Array<{ id: number; username: string; name: string; avatar: string | null }> }> => {
    return apiRequest(`/projects/${projectId}/search-users?q=${encodeURIComponent(query)}`, { method: 'GET' });
  },
  generateInvite: async (projectId: number): Promise<{ invite: { code: string } }> => {
    return apiRequest(`/projects/${projectId}/invite`, { method: 'POST' });
  },
};

// ==================== UPLOADS ====================

export const uploadsAPI = {
  uploadFile: async (file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Включаем cookies
      headers: {
        ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() as string } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Map attachmentId to id for consistency
    return {
      id: data.attachmentId,
      messageId: null,
      type: data.type,
      url: data.url,
      mime: data.mime,
      size: data.size,
      width: data.width,
      height: data.height,
      createdAt: new Date().toISOString()
    };
  },

  getAttachment: async (attachmentId: string): Promise<{ attachment: Attachment }> => {
    return apiRequest(`/attachments/${attachmentId}`, {
      method: 'GET',
    });
  },
};

export const e2eeAPI = {
  registerDeviceBundle: async (payload: {
    deviceId: string;
    deviceName?: string;
    identityKey: string;
    identityKeyAlgo?: string;
    signedPrekeyId: number;
    signedPrekeyPublic: string;
    signedPrekeySignature: string;
    signedPrekeyAlgo?: string;
    registrationId?: number | null;
    oneTimePrekeys?: Array<{ prekeyId: number; publicKey: string; keyAlgo?: string }>;
  }) => {
    return apiRequest('/e2ee/devices/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getUserDeviceBundles: async (userId: string, deviceId: string) => {
    const params = new URLSearchParams({ deviceId });
    return apiRequest<{ devices: unknown[] }>(`/e2ee/users/${encodeURIComponent(userId)}/devices?${params.toString()}`, {
      method: 'GET',
    });
  },

  sendEncryptedEnvelope: async (payload: {
    chatId: string;
    senderDeviceId: string;
    recipientUserId: string;
    recipientDeviceId: string;
    messageType?: string;
    protocolVersion?: number;
    clientMessageId?: string | null;
    sentAt?: string | null;
    envelope: unknown;
  }) => {
    return apiRequest<{ ok: boolean; messageId: string }>('/e2ee/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  syncEncryptedMessages: async (params: {
    deviceId: string;
    afterId?: string | number;
    limit?: number;
  }) => {
    const query = new URLSearchParams({
      deviceId: params.deviceId,
      ...(params.afterId !== undefined ? { afterId: String(params.afterId) } : {}),
      ...(params.limit !== undefined ? { limit: String(params.limit) } : {}),
    });
    return apiRequest<{ items: unknown[]; nextCursor: string }>(`/e2ee/messages/sync?${query.toString()}`, {
      method: 'GET',
    });
  },

  sendDeliveryReceipt: async (payload: { messageId: string; deviceId: string; status?: 'delivered' }) => {
    return apiRequest<{ ok: boolean }>(`/e2ee/messages/${encodeURIComponent(payload.messageId)}/receipt`, {
      method: 'POST',
      body: JSON.stringify({ deviceId: payload.deviceId, status: payload.status || 'delivered' }),
    });
  },

  getMyDevices: async () => {
    return apiRequest<{ devices: unknown[] }>('/e2ee/devices', { method: 'GET' });
  },

  verifyDevice: async (payload: {
    verifierDeviceId: string;
    targetUserId: string;
    targetDeviceId: string;
    status: 'trusted' | 'untrusted';
  }) => {
    return apiRequest<{ ok: boolean }>('/e2ee/devices/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getDeviceTrust: async (verifierDeviceId: string) => {
    const query = new URLSearchParams({ verifierDeviceId });
    return apiRequest<{ trust: unknown[] }>(`/e2ee/devices/trust?${query.toString()}`, {
      method: 'GET',
    });
  },

  uploadEncryptedAttachment: async (payload: {
    messageId?: string | null;
    senderDeviceId: string;
    recipientUserId: string;
    recipientDeviceId: string;
    storageUrl: string;
    mimeType?: string | null;
    ciphertextSize?: number | null;
    sha256Ciphertext?: string | null;
    encryptedFileKey: string;
    encryptedFileNonce?: string | null;
    protocolVersion?: number;
  }) => {
    return apiRequest<{ ok: boolean; attachmentId: string }>('/e2ee/attachments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  syncEncryptedAttachments: async (params: {
    deviceId: string;
    afterId?: string | number;
    limit?: number;
  }) => {
    const query = new URLSearchParams({
      deviceId: params.deviceId,
      ...(params.afterId !== undefined ? { afterId: String(params.afterId) } : {}),
      ...(params.limit !== undefined ? { limit: String(params.limit) } : {}),
    });
    return apiRequest<{ items: unknown[]; nextCursor: string }>(`/e2ee/attachments/sync?${query.toString()}`, {
      method: 'GET',
    });
  },
};

