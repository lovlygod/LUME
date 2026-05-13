import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../../');

describe('E2EE security hardening', () => {
  it('has migration for e2ee core tables', () => {
    const migrationPath = path.join(root, 'backend/database/migrations/009_add_e2ee_core_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS e2ee_devices');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS e2ee_one_time_prekeys');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS e2ee_messages');
  });

  it('has migration for replay protection fields', () => {
    const migrationPath = path.join(root, 'backend/database/migrations/010_add_e2ee_replay_protection.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('client_message_id');
    expect(sql).toContain('uq_e2ee_sender_device_client_msg');
  });

  it('has migration for trusted devices table', () => {
    const migrationPath = path.join(root, 'backend/database/migrations/011_add_e2ee_device_trust.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS e2ee_device_trust');
    expect(sql).toContain("status IN ('trusted', 'untrusted')");
  });

  it('has migration for encrypted attachments table', () => {
    const migrationPath = path.join(root, 'backend/database/migrations/012_add_e2ee_encrypted_attachments.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS e2ee_encrypted_attachments');
    expect(sql).toContain('encrypted_file_key');
  });

  it('contains plaintext enforcement switch in messages API', () => {
    const apiPath = path.join(root, 'backend/src/api.js');
    const code = fs.readFileSync(apiPath, 'utf8');
    expect(code).toContain("process.env.E2EE_ENFORCE === 'true'");
    expect(code).toContain('Plaintext message body is disabled when E2EE_ENFORCE=true');
  });

  it('contains sync, receipt and trust routes', () => {
    const routesPath = path.join(root, 'backend/src/routes/e2eeRoutes.js');
    const code = fs.readFileSync(routesPath, 'utf8');
    expect(code).toContain("router.get('/e2ee/messages/sync'");
    expect(code).toContain("router.post('/e2ee/messages/:messageId/receipt'");
    expect(code).toContain("router.post('/e2ee/devices/verify'");
    expect(code).toContain("router.get('/e2ee/devices/trust'");
    expect(code).toContain("router.post('/e2ee/attachments'");
    expect(code).toContain("router.get('/e2ee/attachments/sync'");
    expect(code).toContain('storageUrl must be an absolute http(s) URL');
    expect(code).toContain('sha256Ciphertext must be a 64-char hex digest');
  });

  it('contains frontend e2ee strict mode and provider hook integration', () => {
    const hookPath = path.join(root, 'src/pages/messages/hooks/useSendMessage.ts');
    const hookCode = fs.readFileSync(hookPath, 'utf8');
    expect(hookCode).toContain('isE2EEEnabled');
    expect(hookCode).toContain('isE2EEStrictMode');
    expect(hookCode).toContain('getE2EEProvider');
    expect(hookCode).toContain('sendEncryptedEnvelope');
  });
});

