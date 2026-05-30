const {
  COIN_SCALE,
  TRANSFER_FEE_BPS,
  TRANSFER_RESERVE_BPS,
  MIN_TRANSFER_MICRO,
  MIN_TRANSFER_FEE_MICRO,
} = require('./constants');

const parseAmountCoinToMicro = (amountCoin) => {
  const raw = String(amountCoin ?? '').trim();
  if (!raw) {
    const error = new Error('amount_coin is required');
    error.code = 'INVALID_AMOUNT';
    throw error;
  }
  if (!/^\d+(\.\d{1,3})?$/.test(raw)) {
    const error = new Error('Invalid amount_coin format');
    error.code = 'INVALID_AMOUNT';
    throw error;
  }
  const [whole, frac = ''] = raw.split('.');
  const micro = BigInt(whole) * COIN_SCALE + BigInt((frac + '000').slice(0, 3));
  if (micro < MIN_TRANSFER_MICRO) {
    const error = new Error('Transfer amount below minimum');
    error.code = 'TRANSFER_MIN_AMOUNT';
    throw error;
  }
  return micro;
};

const calcTransferFeeMicro = (amountMicro) => {
  const fee = (amountMicro * TRANSFER_FEE_BPS) / 10000n;
  return fee > 0n ? fee : MIN_TRANSFER_FEE_MICRO;
};

const calcTransferFeeSplit = (feeMicro) => {
  const reserve = (feeMicro * TRANSFER_RESERVE_BPS) / TRANSFER_FEE_BPS;
  const burn = feeMicro - reserve;
  return { reserveFeeMicro: reserve, burnFeeMicro: burn };
};

module.exports = {
  parseAmountCoinToMicro,
  calcTransferFeeMicro,
  calcTransferFeeSplit,
};

