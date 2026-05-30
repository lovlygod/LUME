const { AppError } = require('../errors');

class EconomyError extends AppError {
  constructor(message, statusCode, code, details = {}) {
    super(message, statusCode, code, details);
  }
}

class InsufficientBalanceError extends EconomyError {
  constructor(details = {}) {
    super('Not enough balance', 400, 'INSUFFICIENT_BALANCE', details);
  }
}

class IdempotencyConflictError extends EconomyError {
  constructor(details = {}) {
    super('Idempotency conflict', 409, 'IDEMPOTENCY_CONFLICT', details);
  }
}

module.exports = {
  EconomyError,
  InsufficientBalanceError,
  IdempotencyConflictError,
};

