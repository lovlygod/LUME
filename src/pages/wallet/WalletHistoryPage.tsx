import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUpRight, Flame, Hash, History, RefreshCw, Search } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import CustomSelect from "@/components/ui/CustomSelect";
import WalletSectionNav from "./WalletSectionNav";
import { useWalletData } from "./useWalletData";
import { formatCoin } from "./format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WalletTx = Record<string, unknown>;

const toSafeString = (value: unknown, fallback = "-") => {
  const str = String(value ?? "").trim();
  return str.length ? str : fallback;
};

const formatTxDate = (value: unknown) => {
  const raw = String(value || "");
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
};

const normalizeTxType = (value: unknown) => String(value || "").trim().toUpperCase();

const formatBaseTypeLabel = (value: unknown, t: (k: string) => string) => {
  const type = normalizeTxType(value);
  const map: Record<string, string> = {
    TRANSFER: t("economy.history.typeTransfer") || "Transfer",
    USERNAME_PURCHASE: t("economy.history.typeUsernamePurchase") || "Username purchase",
    COIN_PURCHASE: t("economy.history.typeCoinPurchase") || "Coin purchase",
  };
  return map[type] || type || "-";
};

const parseMicro = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.trim().replace(/,/g, "");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const resolveAmountMicro = (tx: WalletTx): number => {
  const direct = parseMicro(tx.amount_micro);
  if (direct !== null && direct > 0) return direct;

  const meta = (tx.metadata_json && typeof tx.metadata_json === "object")
    ? (tx.metadata_json as Record<string, unknown>)
    : null;

  const fromMeta = parseMicro(meta?.priceMicro ?? meta?.amountMicro ?? meta?.price_micro ?? meta?.amount_micro);
  if (fromMeta !== null && fromMeta > 0) return fromMeta;

  const type = normalizeTxType(tx.type);
  if (type === "USERNAME_PURCHASE") {
    const fromFallback = parseMicro(tx.fee_micro);
    if (fromFallback !== null && fromFallback > 0) return fromFallback;
  }

  return 0;
};

const formatTypeLabel = (tx: WalletTx, walletId: number | null, t: (k: string) => string) => {
  const type = normalizeTxType(tx.type);
  if (type === "TRANSFER") {
    const fromWalletId = parseMicro(tx.from_wallet_id);
    if (walletId !== null && fromWalletId !== null && Number(fromWalletId) === Number(walletId)) {
      return t("economy.history.typeTransferSent") || "Sent";
    }
    return t("economy.history.typeTransferReceived") || "Received";
  }
  return formatBaseTypeLabel(type, t);
};

const getStatusTone = (status: unknown) => {
  const v = String(status || "").toUpperCase();
  if (v === "COMPLETED") return "text-emerald-300 border-emerald-300/30 bg-emerald-500/10";
  if (v === "PENDING") return "text-amber-300 border-amber-300/30 bg-amber-500/10";
  if (v === "FAILED") return "text-red-300 border-red-300/30 bg-red-500/10";
  return "text-white/70 border-white/15 bg-white/5";
};

const clampPct = (value: number) => Math.max(0, Math.min(100, value));

const WalletHistoryPage = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { wallet, walletTx, loading, error, reload } = useWalletData();
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [hashQuery, setHashQuery] = useState<string>("");
  const [selectedTx, setSelectedTx] = useState<WalletTx | null>(null);
  const [chartVisible, setChartVisible] = useState(false);
  const [chartAnimNonce, setChartAnimNonce] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openTx = (params.get("openTx") || "").trim();
    if (!openTx) return;
    const found = walletTx.find((row) => String((row as WalletTx).tx_hash || "") === openTx) || null;
    if (found) setSelectedTx(found as WalletTx);
  }, [location.search, walletTx]);

  useEffect(() => {
    if (chartVisible) {
      setChartAnimNonce((prev) => prev + 1);
    }
  }, [chartVisible]);

  const typeOptions = useMemo(() => {
    const found = new Set<string>();
    for (const tx of walletTx) {
      const type = normalizeTxType((tx as WalletTx).type);
      if (type) found.add(type);
    }
    return ["ALL", ...Array.from(found)];
  }, [walletTx]);

  const filteredTx = useMemo(() => {
    const now = Date.now();
    const periodMs: Record<string, number> = {
      "24H": 24 * 60 * 60 * 1000,
      "7D": 7 * 24 * 60 * 60 * 1000,
      "30D": 30 * 24 * 60 * 60 * 1000,
    };
    const normalizedHash = hashQuery.trim().toLowerCase();

    return walletTx.filter((tx) => {
      const typed = tx as WalletTx;
      const type = normalizeTxType(typed.type);
      if (typeFilter !== "ALL" && type !== typeFilter) return false;

      if (periodFilter !== "ALL") {
        const createdAt = new Date(String(typed.created_at || "")).getTime();
        if (Number.isNaN(createdAt)) return false;
        if (now - createdAt > periodMs[periodFilter]) return false;
      }

      if (normalizedHash) {
        const txHash = String(typed.tx_hash || "").toLowerCase();
        if (!txHash.includes(normalizedHash)) return false;
      }

      return true;
    });
  }, [walletTx, typeFilter, periodFilter, hashQuery]);

  const groupedTx = useMemo(() => {
    const groups = new Map<string, WalletTx[]>();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 24 * 60 * 60 * 1000;
    const weekStart = today - 6 * 24 * 60 * 60 * 1000;

    for (const tx of filteredTx) {
      const createdAt = new Date(String((tx as WalletTx).created_at || "")).getTime();
      let key = t("economy.history.groupMonth") || "Earlier";
      if (!Number.isNaN(createdAt)) {
        if (createdAt >= today) key = t("economy.history.groupToday") || "Today";
        else if (createdAt >= yesterday) key = t("economy.history.groupYesterday") || "Yesterday";
        else if (createdAt >= weekStart) key = t("economy.history.groupWeek") || "This week";
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tx as WalletTx);
    }

    return Array.from(groups.entries());
  }, [filteredTx, t]);

  const flowChart = useMemo(() => {
    const walletId = Number(wallet?.id || 0);
    let received = 0;
    let sent = 0;
    let fee = 0;
    let usernamePurchase = 0;

    for (const tx of filteredTx) {
      const row = tx as WalletTx;
      const type = normalizeTxType(row.type);
      const amount = resolveAmountMicro(row);
      const feeMicro = Number(parseMicro(row.fee_micro) || 0);
      fee += feeMicro;
      if (type === "USERNAME_PURCHASE") {
        usernamePurchase += amount;
        continue;
      }
      if (type !== "TRANSFER") continue;
      const fromWalletId = Number(parseMicro(row.from_wallet_id) || 0);
      if (walletId > 0 && fromWalletId === walletId) sent += amount;
      else received += amount;
    }

    const total = Math.max(received + sent + fee + usernamePurchase, 1);
    const receivedPct = clampPct((received / total) * 100);
    const sentPct = clampPct((sent / total) * 100);
    const usernamePurchasePct = clampPct((usernamePurchase / total) * 100);
    const feePct = clampPct(100 - receivedPct - sentPct - usernamePurchasePct);

    return { received, sent, fee, usernamePurchase, receivedPct, sentPct, usernamePurchasePct, feePct };
  }, [filteredTx, wallet?.id]);

  const chartData = useMemo(() => ([
    { name: t("economy.history.typeTransferReceived") || "Received", value: flowChart.received, color: "#00F5A0" },
    { name: t("economy.history.typeTransferSent") || "Sent", value: flowChart.sent, color: "#FF4D6D" },
    { name: t("economy.history.typeUsernamePurchase") || "Username purchase", value: flowChart.usernamePurchase, color: "#B026FF" },
    { name: t("economy.history.groupFee") || "Fee", value: flowChart.fee, color: "#FFD60A" },
  ]), [flowChart, t]);

  const calcGroupTotals = (items: WalletTx[]) => {
    const walletId = Number(wallet?.id || 0);
    let sentMicro = 0;
    let receivedMicro = 0;
    let feeMicro = 0;
    for (const tx of items) {
      const type = normalizeTxType(tx.type);
      const amount = resolveAmountMicro(tx);
      if (type === "TRANSFER") {
        const fromWalletId = Number(parseMicro(tx.from_wallet_id) || 0);
        if (walletId > 0 && fromWalletId === walletId) sentMicro += amount;
        else receivedMicro += amount;
      }
      feeMicro += Number(parseMicro(tx.fee_micro) || 0);
    }
    return { sentMicro, receivedMicro, feeMicro };
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">{t("economy.tabs.history") || "History"}</h1>
        <Button type="button" variant="outline" size="sm" onClick={reload} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          {t("common.refresh") || "Refresh"}
        </Button>
      </div>

      {error && <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</div>}

      <WalletSectionNav />

      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-3 md:grid-cols-3 md:items-center">
        <label className="text-xs text-white/70">
          <span>{t("economy.history.filterType") || "Type"}</span>
          <CustomSelect
            className="mt-1"
            buttonClassName="px-3 py-2 rounded-xl"
            dropdownClassName="z-[80]"
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            options={typeOptions.map((type) => ({
              value: type,
              label: type === "ALL"
                ? (t("economy.history.allTypes") || "All types")
                : formatBaseTypeLabel(type, t),
            }))}
          />
        </label>

        <label className="text-xs text-white/70">
          <span>{t("economy.history.filterPeriod") || "Period"}</span>
          <CustomSelect
            className="mt-1"
            buttonClassName="px-3 py-2 rounded-xl"
            dropdownClassName="z-[80]"
            value={periodFilter}
            onChange={(value) => setPeriodFilter(value)}
            options={[
              { value: "ALL", label: t("economy.history.allPeriods") || "All time" },
              { value: "24H", label: t("economy.history.period24h") || "24h" },
              { value: "7D", label: t("economy.history.period7d") || "7d" },
              { value: "30D", label: t("economy.history.period30d") || "30d" },
            ]}
          />
        </label>

        <label className="text-xs text-white/70 flex flex-col">
          <span>{t("economy.history.filterHash") || "TX hash"}</span>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 transition-colors hover:border-white/20 focus-within:border-white/30">
            <Search className="h-4 w-4 text-white/50" />
            <input
              value={hashQuery}
              onChange={(e) => setHashQuery(e.target.value)}
              placeholder={t("economy.history.hashPlaceholder") || "Search tx hash"}
              className="w-full bg-transparent py-2 text-sm text-white outline-none"
            />
          </div>
        </label>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.1] to-white/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-sm text-white/80">{t("economy.history.chartTotal") || "Total flow"}</div>
          <Button type="button" variant="outline" size="sm" onClick={() => setChartVisible((prev) => !prev)}>
            {chartVisible ? (t("economy.history.hideChart") || "Hide") : (t("economy.history.showChart") || "Show")}
          </Button>
        </div>
        <div
          className={`grid gap-5 md:grid-cols-[260px_1fr] md:items-center overflow-hidden transition-all duration-500 ease-out ${chartVisible ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="mx-auto h-64 w-64 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie key={`chart-open-${chartAnimNonce}`} data={chartData} dataKey="value" nameKey="name" innerRadius={74} outerRadius={108} stroke="none" isAnimationActive={chartVisible} animationDuration={900}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCoin(value)}
                  contentStyle={{ background: "rgba(11,15,25,0.92)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fff" }}
                  labelStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="-mt-32 text-center pointer-events-none">
              <div className="text-[10px] text-white/60">{t("economy.history.chartTotal") || "Total flow"}</div>
              <div className="text-sm font-semibold text-white">{formatCoin(flowChart.received + flowChart.sent + flowChart.fee + flowChart.usernamePurchase)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2 text-sm">
              <div className="inline-flex items-center gap-2 text-white/90"><span className="h-2 w-2 rounded-full bg-emerald-300" />{t("economy.history.typeTransferReceived") || "Received"}</div>
              <div className="text-right">
                <div className="font-semibold text-emerald-300">{formatCoin(flowChart.received)}</div>
                <div className="text-xs text-emerald-200">{Math.round(flowChart.receivedPct)}%</div>
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2 text-sm">
              <div className="inline-flex items-center gap-2 text-white/90"><span className="h-2 w-2 rounded-full bg-rose-300" />{t("economy.history.typeTransferSent") || "Sent"}</div>
              <div className="text-right">
                <div className="font-semibold text-rose-300">{formatCoin(flowChart.sent)}</div>
                <div className="text-xs text-rose-200">{Math.round(flowChart.sentPct)}%</div>
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2 text-sm">
              <div className="inline-flex items-center gap-2 text-white/90"><span className="h-2 w-2 rounded-full bg-violet-300" />{t("economy.history.typeUsernamePurchase") || "Username purchase"}</div>
              <div className="text-right">
                <div className="font-semibold text-violet-300">{formatCoin(flowChart.usernamePurchase)}</div>
                <div className="text-xs text-violet-200">{Math.round(flowChart.usernamePurchasePct)}%</div>
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <div className="inline-flex items-center gap-2 text-white/90"><span className="h-2 w-2 rounded-full bg-amber-300" />{t("economy.history.groupFee") || "Fee"}</div>
              <div className="text-right">
                <div className="font-semibold text-amber-300">{formatCoin(flowChart.fee)}</div>
                <div className="text-xs text-amber-200">{Math.round(flowChart.feePct)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          <div className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          <div className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTx.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              {t("economy.history.emptyFiltered") || t("economy.wallet.emptyTx") || "No transactions yet"}
            </div>
          )}

          {groupedTx.map(([groupLabel, items]) => {
            const totals = calcGroupTotals(items);
            return (
              <div key={groupLabel} className="space-y-2">
                <div className="sticky top-16 z-10 rounded-xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-white/85">{groupLabel}</div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/70">
                      <span>{t("economy.history.groupReceived") || "Received"}: <span className="text-emerald-300">{formatCoin(totals.receivedMicro)}</span></span>
                      <span>{t("economy.history.groupSent") || "Sent"}: <span className="text-rose-300">{formatCoin(totals.sentMicro)}</span></span>
                      <span>{t("economy.history.groupFee") || "Fee"}: <span className="text-amber-300">{formatCoin(totals.feeMicro)}</span></span>
                    </div>
                  </div>
                </div>
                {items.map((tx, idx) => (
                  <button
                    key={toSafeString((tx as WalletTx).tx_hash, `${groupLabel}-${idx}`)}
                    type="button"
                    onClick={() => setSelectedTx(tx)}
                    className="group w-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-4 text-left text-sm text-white/85 shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-[1px] hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="inline-flex items-center gap-2 font-medium text-white">
                        <History className="h-4 w-4" />
                        {formatTypeLabel(tx as WalletTx, Number(wallet?.id || 0) || null, t)}
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getStatusTone((tx as WalletTx).status)}`}>
                        {toSafeString((tx as WalletTx).status)}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-white/65 sm:grid-cols-3">
                      <div className="inline-flex items-center gap-1.5"><ArrowUpRight className="h-3.5 w-3.5" />{formatCoin(resolveAmountMicro(tx as WalletTx))}</div>
                      <div className="inline-flex items-center gap-1.5"><Flame className="h-3.5 w-3.5" />{formatCoin((tx as WalletTx).burn_micro)}</div>
                      <div className="inline-flex items-center gap-1.5 truncate"><Hash className="h-3.5 w-3.5 shrink-0" />{toSafeString((tx as WalletTx).tx_hash).slice(0, 14)}...</div>
                    </div>
                    <div className="mt-2 text-xs text-white/50">{formatTxDate((tx as WalletTx).created_at)}</div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedTx} onOpenChange={(next) => { if (!next) setSelectedTx(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-white">{t("economy.history.detailsTitle") || "Transaction details"}</DialogTitle>
            <DialogDescription className="text-center text-white/60">
              {t("economy.history.detailsSubtitle") || "Complete operation details"}
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-3 text-sm">
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3"><span className="text-white/60">{t("economy.history.type") || "Type"}</span><span className="text-white font-medium">{formatTypeLabel(selectedTx, Number(wallet?.id || 0) || null, t)}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-white/60">{t("economy.history.amount") || "Amount"}</span><span className="text-white font-medium">{formatCoin(resolveAmountMicro(selectedTx))}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-white/60">{t("economy.history.fee") || "Fee"}</span><span className="text-white">{formatCoin(selectedTx.fee_micro)}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-white/60">{t("economy.history.burn") || "Burn"}</span><span className="text-white">{formatCoin(selectedTx.burn_micro)}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-white/60">{t("economy.history.status") || "Status"}</span><span className={`rounded-full border px-2 py-0.5 text-xs ${getStatusTone(selectedTx.status)}`}>{toSafeString(selectedTx.status)}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-white/60">{t("economy.history.date") || "Date"}</span><span className="text-right text-white">{formatTxDate(selectedTx.created_at)}</span></div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-1 text-white/60">{t("economy.history.txHash") || "TX hash"}</div>
                <div className="break-all rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white">{toSafeString(selectedTx.tx_hash)}</div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 justify-center sm:justify-center">
            <Button type="button" onClick={() => setSelectedTx(null)}>{t("common.close") || "Close"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default WalletHistoryPage;

