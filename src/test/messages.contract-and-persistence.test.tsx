import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  getMessages: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  messagesAPI: {
    getMessages: mocks.getMessages,
  },
}));

import { useChatMessages } from '@/pages/messages/hooks/useChatMessages';
import { messageQueryKeys } from '@/pages/messages/hooks/queryKeys';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, Wrapper };
};

describe('messages API contract and persistence behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps messages in query cache so they survive component remount (reload-like flow)', async () => {
    mocks.getMessages.mockResolvedValue({
      messages: [
        {
          id: 'm-1',
          senderId: 'self',
          sender: null,
          text: 'persist me',
          type: 'text',
          timestamp: new Date().toISOString(),
          own: true,
          attachments: [],
          replyToMessageId: null,
          linkPreview: null,
        },
      ],
    });

    const { queryClient, Wrapper } = createWrapper();

    const first = renderHook(() => useChatMessages('chat-1'), { wrapper: Wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    expect(first.result.current.data?.messages[0]?.text).toBe('persist me');

    first.unmount();

    const cached = queryClient.getQueryData<{ messages: Array<{ text: string }> }>(
      messageQueryKeys.chatMessages('chat-1')
    );
    expect(cached?.messages?.[0]?.text).toBe('persist me');

    const second = renderHook(() => useChatMessages('chat-1'), { wrapper: Wrapper });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
    expect(second.result.current.data?.messages?.length).toBe(1);
  });

  it('exposes backend 403/404 contract errors through react-query error state', async () => {
    const contractError = Object.assign(new Error('Access denied'), {
      error: { statusCode: 403, code: 'FORBIDDEN' },
    });
    mocks.getMessages.mockRejectedValue(contractError);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useChatMessages('chat-forbidden'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const err = result.current.error as Error & { error?: { statusCode?: number; code?: string } };
    expect(err.error?.statusCode).toBe(403);
    expect(err.error?.code).toBe('FORBIDDEN');
  });
});

