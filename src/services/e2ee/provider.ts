import type { EncryptedEnvelopePacket } from './types';

export type E2EEEncryptInput = {
  chatId: string;
  plaintext: string;
  senderDeviceId: string;
  recipients: Array<{ userId: string; deviceId: string }>;
};

export type E2EEProvider = {
  encryptMessageForDevices(input: E2EEEncryptInput): Promise<EncryptedEnvelopePacket[]>;
};

let activeProvider: E2EEProvider | null = null;

export const registerE2EEProvider = (provider: E2EEProvider) => {
  activeProvider = provider;
};

export const getE2EEProvider = () => activeProvider;

