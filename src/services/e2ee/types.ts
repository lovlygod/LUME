export type E2EEDeviceState = {
  userId: string;
  deviceId: string;
  registrationId: number;
  identityPublicKey: string;
  identityPrivateKey: string;
  signedPrekeyPublicKey: string;
  signedPrekeyPrivateKey: string;
  signedPrekeySignature: string;
  signedPrekeyId: number;
  createdAt: string;
};

export type EncryptedEnvelopePacket = {
  recipientUserId: string;
  recipientDeviceId: string;
  envelope: unknown;
  protocolVersion?: number;
  clientMessageId?: string;
  sentAt?: string;
};

