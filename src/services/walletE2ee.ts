import { getLocalE2EEDeviceState } from "@/services/e2ee/deviceStore";

const textEncoder = new TextEncoder();

const b64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
  return btoa(s);
};

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return Array.from(new Uint8Array(digest)).map((x) => x.toString(16).padStart(2, "0")).join("");
};

export const buildWalletEncryptedPayload = async (input: {
  to: string;
  amount_coin: string;
  idempotency_key: string;
  recipientUserId: string | number;
}) => {
  const device = getLocalE2EEDeviceState();
  if (!device?.deviceId) return null;

  const payload = JSON.stringify({
    to: input.to,
    amount_coin: input.amount_coin,
    idempotency_key: input.idempotency_key,
    ts: Date.now(),
  });

  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const rawKey = await crypto.subtle.exportKey("raw", key);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEncoder.encode(payload));

  const payloadHash = await sha256Hex(payload);
  const clientOperationId = `wallet-${crypto.randomUUID()}`;

  return {
    sender_device_id: device.deviceId,
    protocol_version: 1,
    cipher_alg: "aes-256-gcm",
    aad_json: { wallet_e2ee: true },
    ciphertext_b64: b64(ciphertext),
    nonce_b64: b64(iv),
    payload_sha256: payloadHash,
    client_operation_id: clientOperationId,
    envelopes: [
      {
        recipient_user_id: Number(input.recipientUserId),
        recipient_device_id: device.deviceId,
        wrapped_key_b64: b64(rawKey),
        wrap_alg: "local-dev-wrap",
        envelope_json: { note: "client-bootstrap" },
      },
    ],
  };
};

