import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  sendEncryptedEnvelope: vi.fn(),
  getUserDeviceBundles: vi.fn(),
  sendMessage: vi.fn(),
  playSend: vi.fn(),
  isE2EEEnabled: vi.fn(),
  isE2EEStrictMode: vi.fn(),
  getE2EEProvider: vi.fn(),
  getLocalE2EEDeviceState: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  e2eeAPI: {
    sendEncryptedEnvelope: mocks.sendEncryptedEnvelope,
    getUserDeviceBundles: mocks.getUserDeviceBundles,
  },
  messagesAPI: {
    sendMessage: mocks.sendMessage,
  },
}));

vi.mock('@/services/messageSounds', () => ({
  messageSounds: {
    playSend: mocks.playSend,
  },
}));

vi.mock('@/services/e2ee/featureFlags', () => ({
  isE2EEEnabled: mocks.isE2EEEnabled,
  isE2EEStrictMode: mocks.isE2EEStrictMode,
}));

vi.mock('@/services/e2ee/provider', () => ({
  getE2EEProvider: mocks.getE2EEProvider,
}));

vi.mock('@/services/e2ee/deviceStore', () => ({
  getLocalE2EEDeviceState: mocks.getLocalE2EEDeviceState,
}));

import { useSendMessage } from '@/pages/messages/hooks/useSendMessage';
import { messageQueryKeys } from '@/pages/messages/hooks/queryKeys';

const createWrapper = () => {
  const queryClient = new QueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, Wrapper };
};

describe('useSendMessage E2EE flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendMessage.mockResolvedValue({ messageId: 'legacy-1', type: 'text' });
    mocks.getUserDeviceBundles.mockResolvedValue({ devices: [] });
  });

  it('blocks plaintext fallback in strict mode when e2ee provider is not ready', async () => {
    mocks.isE2EEEnabled.mockReturnValue(true);
    mocks.isE2EEStrictMode.mockReturnValue(true);
    mocks.getE2EEProvider.mockReturnValue(null);
    mocks.getLocalE2EEDeviceState.mockReturnValue(null);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSendMessage('1'), { wrapper: Wrapper });

    await expect(
      result.current.mutateAsync({
        chatId: 'chat-1',
        text: 'hello',
      })
    ).rejects.toThrow('E2EE strict mode enabled');

    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });

  it('sends encrypted envelopes when provider and recipient devices are available', async () => {
    mocks.isE2EEEnabled.mockReturnValue(true);
    mocks.isE2EEStrictMode.mockReturnValue(false);

    mocks.getLocalE2EEDeviceState.mockReturnValue({
      userId: '1',
      deviceId: 'dev-self',
    });

    mocks.getUserDeviceBundles.mockResolvedValue({
      devices: [{ userId: '2', deviceId: 'dev-2a' }],
    });

    mocks.getE2EEProvider.mockReturnValue({
      encryptMessageForDevices: vi.fn().mockResolvedValue([
        {
          recipientUserId: '2',
          recipientDeviceId: 'dev-2a',
          envelope: { ciphertext: 'abc' },
          protocolVersion: 1,
        },
      ]),
    });

    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(messageQueryKeys.chatList(), {
      chats: [
        {
          id: 'chat-1',
          type: 'private',
          lastMessage: '',
          timestamp: new Date().toISOString(),
          members: [
            { id: '1', role: 'member' },
            { id: '2', role: 'member' },
          ],
        },
      ],
    });
    const { result } = renderHook(() => useSendMessage('1'), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        chatId: 'chat-1',
        text: 'hello',
      });
    });

    expect(mocks.sendEncryptedEnvelope).toHaveBeenCalledTimes(1);
    expect(mocks.sendMessage).not.toHaveBeenCalled();
    expect(mocks.playSend).toHaveBeenCalled();
  });
});

