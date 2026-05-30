export const formatCoin = (micro: unknown) => {
  const value = Number(micro || 0) / 1000;
  const fixed = value.toFixed(3);
  const normalized = fixed.replace(/\.0+$/, "").replace(/(\.\d*?[1-9])0+$/, "$1");
  return `${normalized} LUX`;
};
export const formatRub = (micro: unknown) => `${((Number(micro || 0) / 1000) * 2.3).toFixed(2)} ₽`;
export const formatUsdDisplay = (micro: unknown) => `~$${((Number(micro || 0) / 1000) * 2.3 / 90).toFixed(2)}`;

export const makeIdem = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const estimateFeeMicro = (amountCoinValue: string) => {
  const raw = Number(amountCoinValue || 0);
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const micro = Math.floor(raw * 1000);
  return Math.max(1, Math.floor((micro * 50) / 10000));
};

