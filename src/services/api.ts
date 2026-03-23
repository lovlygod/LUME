import { API_BASE_PATH } from "@/lib/config";
import type { User, VerificationRequest, VerificationStatus, Post, Comment } from "@/types";
import type { Chat, Attachment, Message } from "@/types/messages";
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
  register: async (userData: { email: string; password: string; name: string; username: string }) => {
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

  getChatByUsername: async (username: string): Promise<{ chat: Chat & { membersCount?: number; joinStatus?: string | null } }> => {
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

    const response = await fetch(`${API_BASE_URL}/moments`, {
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

  openMoment: async (momentId: string) => {
    return apiRequest<{ token: string; expiresAt: string }>(`/moments/${momentId}/open`, {
      method: 'POST',
    });
  },

  getMomentContent: async (momentId: string, token: string): Promise<{ url: string; mime?: string; expiresAt?: string | null }> => {
    const params = new URLSearchParams({ token });
    return apiRequest(`/moments/${momentId}/content?${params.toString()}`, {
      method: 'GET',
    });
  },

  markMomentViewed: async (momentId: string) => {
    return apiRequest(`/moments/${momentId}/viewed`, {
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

// ==================== ONBOARDING ====================

export const onboardingAPI = {
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

  updateProfile: async (data: { bio?: string; city?: string; website?: string }) => {
    return apiRequest('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
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
