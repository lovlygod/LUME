# E2EE Security Updates (Incremental Migration)

This document summarizes the implemented security migration work toward a Signal-style model while preserving the existing LUME architecture.

## Scope completed

- Backend log redaction/sanitization for sensitive payload fields.
- Backend strict plaintext guards under `E2EE_ENFORCE=true`.
- New E2EE database migrations for devices, prekeys, envelopes, replay protection, trust, and encrypted attachments metadata.
- New/extended E2EE API routes for:
  - device registration and bundle retrieval,
  - encrypted envelope send + sync,
  - delivery receipts,
  - device trust verification,
  - encrypted attachment metadata upload + sync.
- Frontend E2EE API client methods.
- Frontend feature flags and strict-mode support.
- Frontend message send hook integration with E2EE-first flow and strict fallback behavior.
- Security-focused tests for migration presence and E2EE message flow behavior.

## Backend changes

### Logging hardening

- Sensitive keys are redacted before log output.
- Validation and error logs avoid leaking message plaintext or cryptographic payloads.

### Plaintext enforcement

When `E2EE_ENFORCE=true`:

- plaintext message body is rejected,
- plaintext voice/moment body pathways are constrained by enforcement checks where applicable.

### Migrations

- `009_add_e2ee_core_tables.sql`
- `010_add_e2ee_replay_protection.sql`
- `011_add_e2ee_device_trust.sql`
- `012_add_e2ee_encrypted_attachments.sql`

These introduce core persistence for E2EE relay operations and anti-replay semantics (`client_message_id` uniqueness per sender device).

## Frontend changes

### Config / flags

- `VITE_E2EE_ENABLED`
- `VITE_E2EE_STRICT_MODE`

### E2EE service surface

Added client methods for envelopes, device bundles, trust operations, receipt updates, and encrypted attachment metadata.

### Message send integration

Message sending now supports:

- E2EE fanout by recipient device,
- strict mode behavior that blocks unsafe plaintext fallback,
- compatibility fallback for legacy path when strict mode is disabled.

## Tests

- structural and route-level security checks,
- E2EE send-hook strict mode behavior tests.

## Remaining hard blockers (expected for full Signal-equivalence)

- Full Double Ratchet implementation + long-term state persistence lifecycle,
- production-grade device key verification UX and trust key continuity workflow,
- cryptographic provider hardening and secure storage guarantees by platform,
- comprehensive end-to-end crypto interoperability test matrix.

