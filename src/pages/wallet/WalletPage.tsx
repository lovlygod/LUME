import { ArrowDownLeft, RefreshCw, Send, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { economyAPI } from "@/services/api";
import { wsService } from "@/services/websocket";
import { normalizeImageUrl } from "@/lib/utils";
import WalletSectionNav from "./WalletSectionNav";
import { useWalletData } from "./useWalletData";
import { estimateFeeMicro, formatCoin, formatRub, formatUsdDisplay, makeIdem } from "./format";
import { buildWalletEncryptedPayload } from "@/services/walletE2ee";
import { getLocalE2EEDeviceState } from "@/services/e2ee/deviceStore";
import QRCodeStyling from "qr-code-styling";
import lumeLogo from "@/assets/coin/LUX-coin.webp";
import lumeCoinBackground from "@/assets/coin/LUX-coin-background.png";

const WalletPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { wallet, walletStats, walletTx, loading, error, reload } = useWalletData();
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyLux, setBuyLux] = useState("10");
  const [sendOpen, setSendOpen] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("1");
  const [recipientPreview, setRecipientPreview] = useState<{ user_id: number | null; username: string | null; name: string | null; avatar: string | null; address: string } | null>(null);
  const [sendToError, setSendToError] = useState<string | null>(null);
  const [recipientChecking, setRecipientChecking] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [sendSubmitting, setSendSubmitting] = useState(false);
  const [liveActivity, setLiveActivity] = useState<Array<{ id: string; text: string; at: string; txHash: string }>>([]);
  const [secureDeviceId, setSecureDeviceId] = useState<string | null>(null);
  const [secureEnvelopeCount, setSecureEnvelopeCount] = useState(0);
  const [secureSyncOk, setSecureSyncOk] = useState(false);
  const [e2eeEnabled, setE2eeEnabled] = useState(false);

  const luxAmount = Number(buyLux || 0);
  const safeLuxAmount = Number.isFinite(luxAmount) && luxAmount > 0 ? luxAmount : 0;
  const rubCost = safeLuxAmount * 2.3;
  const sendLuxAmount = Number(sendAmount || 0);
  const sendSafeLuxAmount = Number.isFinite(sendLuxAmount) && sendLuxAmount > 0 ? sendLuxAmount : 0;
  const sendAmountMicro = Math.floor(sendSafeLuxAmount * 1000);
  const sendFeeMicro = estimateFeeMicro(sendAmount);
  const sendDebitMicro = sendAmountMicro + sendFeeMicro;
  const availableMicro = Number(wallet?.balance_micro || 0) - Number(wallet?.locked_balance_micro || 0);
  const canAffordSend = availableMicro >= sendDebitMicro;
  const walletAddress = String(wallet?.address || "");
  const receiveUrl = `${window.location.origin}/wallet?sendTo=${encodeURIComponent(walletAddress || "")}`;
  const balanceValue = Number(wallet?.balance_micro || 0) / 1000;
  const balanceDisplay = Number.isInteger(balanceValue)
    ? String(balanceValue)
    : balanceValue.toFixed(3).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  const incomeMicro = Number(walletStats?.income_micro || 0);
  const expenseMicro = Number(walletStats?.expense_micro || 0);
  const feesMicro = Number(walletStats?.fees_micro || 0);
  const transferCount = Number(walletStats?.transfer_count || 0);
  const sentAmountMicro = Number(walletStats?.sent_amount_micro || 0);
  const avgTransferMicro = transferCount > 0 ? Math.floor(sentAmountMicro / transferCount) : 0;
  const savingsRate = incomeMicro > 0 ? Math.max(0, Math.min(100, ((incomeMicro - expenseMicro) / incomeMicro) * 100)) : 0;
  const momentumTone = savingsRate >= 20 ? "text-emerald-300" : savingsRate >= 0 ? "text-amber-300" : "text-rose-300";
  const reserveFeeMicro = Math.floor(sendFeeMicro * 0.6);
  const burnFeeMicro = Math.max(0, sendFeeMicro - reserveFeeMicro);
  const securityOps = (Array.isArray(walletTx) ? walletTx : []).slice(0, 5);

  useEffect(() => {
    const state = getLocalE2EEDeviceState();
    setSecureDeviceId(state?.deviceId || null);
    try {
      setE2eeEnabled(localStorage.getItem("lume:wallet:e2ee:enabled") === "1");
    } catch {
      setE2eeEnabled(false);
    }
  }, []);

  const toggleE2EE = () => {
    const next = !e2eeEnabled;
    setE2eeEnabled(next);
    try {
      localStorage.setItem("lume:wallet:e2ee:enabled", next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const loadSecureState = async () => {
      if (!secureDeviceId) {
        setSecureEnvelopeCount(0);
        setSecureSyncOk(false);
        return;
      }
      try {
        const res = await economyAPI.getWalletE2EESync({ deviceId: secureDeviceId, limit: 20 });
        setSecureEnvelopeCount(Array.isArray(res?.items) ? res.items.length : 0);
        setSecureSyncOk(true);
      } catch {
        setSecureEnvelopeCount(0);
        setSecureSyncOk(false);
      }
    };
    void loadSecureState();
  }, [secureDeviceId]);

  useEffect(() => {
    const next = (Array.isArray(walletTx) ? walletTx : [])
      .slice(0, 7)
      .map((tx, idx) => {
        const typed = tx as Record<string, unknown>;
        const txType = String(typed.type || "").toUpperCase();
        const amountMicro = Number(typed.amount_micro || 0);
        const label = txType === "TRANSFER"
          ? `${t("economy.history.typeTransfer") || "Transfer"}: ${formatCoin(amountMicro)}`
          : `${txType || "TX"}: ${formatCoin(amountMicro)}`;
        return {
          id: String(typed.tx_hash || `history-${idx}`),
          text: label,
          at: String(typed.created_at || new Date().toISOString()),
          txHash: String(typed.tx_hash || ""),
        };
      });
    setLiveActivity(next);
  }, [walletTx, t]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sendToFromQuery = (params.get("sendTo") || "").trim();
    if (!sendToFromQuery) return;

    setSendTo(sendToFromQuery);
    setSendOpen(true);
  }, [location.search]);

  useEffect(() => {
    let active = true;

    const qr = new QRCodeStyling({
      width: 220,
      height: 220,
      type: "svg",
      data: receiveUrl,
      margin: 0,
      image: lumeLogo,
      imageOptions: {
        saveAsBlob: true,
        hideBackgroundDots: true,
        imageSize: 0.26,
        margin: 0,
      },
      dotsOptions: {
        color: "#ffffff",
        type: "rounded",
      },
      backgroundOptions: {
        color: "transparent",
      },
      cornersSquareOptions: {
        color: "#ffffff",
        type: "extra-rounded",
      },
      cornersDotOptions: {
        color: "#ffffff",
        type: "dot",
      },
    });

    const build = async () => {
      try {
        const raw = await qr.getRawData("svg");
        if (!raw || !active) return;
        const svgText = raw instanceof Blob
          ? await raw.text()
          : new TextDecoder("utf-8").decode(raw as Uint8Array);
        if (!active) return;
        setQrSvg(svgText);
      } catch {
        if (active) setQrSvg("");
      }
    };

    void build();
    return () => {
      active = false;
    };
  }, [receiveUrl]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    const off = wsService.on("economy:wallet_updated", async (eventData) => {
      const payload = (eventData || {}) as Record<string, unknown>;
      const amountMicro = Number(payload.amountMicro || 0);
      const txHash = String(payload.txHash || "");
      const reason = String(payload.reason || "transfer");
      setLiveActivity((prev) => {
        const text = `${t("economy.wallet.liveTransferEvent") || "New transfer event"} · ${reason}${amountMicro > 0 ? ` · ${formatCoin(amountMicro)}` : ""}`;
        const next = [{ id: txHash || `evt-${Date.now()}`, text, at: new Date().toISOString(), txHash }, ...prev];
        return next.slice(0, 7);
      });
      await reload();
    });
    return off;
  }, [reload, t]);

  const validateRecipient = async () => {
    const value = sendTo.trim();
    setRecipientPreview(null);
    setSendToError(null);
    if (!value) return;

    setRecipientChecking(true);
    try {
      const res = await economyAPI.getRecipientPreview(value);
      setRecipientPreview({
        user_id: typeof res.recipient.user_id === "number" ? res.recipient.user_id : null,
        username: res.recipient.username,
        name: res.recipient.name,
        avatar: res.recipient.avatar,
        address: res.recipient.address,
      });
    } catch (e) {
      const code = (e as { error?: { code?: string } })?.error?.code;
      if (code === "RECIPIENT_USERNAME_NOT_FOUND") {
        setSendToError(t("economy.wallet.recipientUserNotFound") || "Такого юзера не существует");
      } else if (code === "RECIPIENT_ADDRESS_NOT_FOUND") {
        setSendToError(t("economy.wallet.recipientAddressNotFound") || "Такого адреса не существует");
      } else {
        setSendToError(t("economy.wallet.recipientNotFound") || "Получатель не найден");
      }
    } finally {
      setRecipientChecking(false);
    }
  };

  const resolveWalletErrorMessage = (err: unknown) => {
    const payload = (err as { error?: { code?: string; message?: string; details?: { code?: string } } })?.error;
    const code = payload?.code;
    const detailsCode = payload?.details?.code;
    const normalizedCode = detailsCode || code;
    if (normalizedCode === "INSUFFICIENT_BALANCE") return t("economy.wallet.errorInsufficientBalance") || "Недостаточно средств для операции";
    if (normalizedCode === "TRANSFER_DAILY_LIMIT_EXCEEDED") return t("economy.wallet.errorDailyLimit") || "Превышен дневной лимит переводов";
    if (normalizedCode === "INVALID_RECIPIENT") return t("economy.wallet.errorInvalidRecipient") || "Нельзя отправить самому себе";
    if (normalizedCode === "RECIPIENT_USERNAME_NOT_FOUND") return t("economy.wallet.recipientUserNotFound") || "Такого юзера не существует";
    if (normalizedCode === "RECIPIENT_ADDRESS_NOT_FOUND") return t("economy.wallet.recipientAddressNotFound") || "Такого адреса не существует";
    if (normalizedCode === "RATE_LIMIT_EXCEEDED") return t("common.tooManyRequests") || "Слишком много запросов, попробуйте позже";
    if (normalizedCode === "VALIDATION_ERROR") return t("economy.wallet.errorValidation") || "Проверьте корректность введённых данных";
    if (code === "VALIDATION_ERROR") return t("economy.wallet.errorValidation") || "Проверьте корректность введённых данных";
    return payload?.message || t("common.error") || "Ошибка";
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">{t("navigation.wallet") || "Wallet"}</h1>
        <Button type="button" variant="outline" size="sm" onClick={reload} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          {t("common.refresh") || "Refresh"}
        </Button>
      </div>

      {error && <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</div>}

      <WalletSectionNav />

      {loading ? (
        <div className="space-y-3">
          <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          <div className="h-44 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          <div className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        </div>
      ) : (
      <div className="space-y-3">
        <div
          className="rounded-2xl border border-white/10 p-6 text-sm text-white/90 min-h-[220px] flex flex-col justify-between bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(8,10,16,0.30), rgba(8,10,16,0.58)), url(${lumeCoinBackground})`,
              backgroundSize: "100% auto",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
            }}
        >
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="text-sm text-white/70">{t("economy.wallet.balance") || "Balance"}</div>
            <div className="mt-2 flex items-center gap-3 text-4xl font-semibold leading-none text-white">
            <img
              src={lumeLogo}
              alt="LUX"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="h-[1em] w-[1em] shrink-0 select-none rounded-md object-cover align-middle pointer-events-none"
            />
            <span>{balanceDisplay}</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button type="button" size="sm" onClick={() => setBuyOpen(true)}><ShoppingCart className="h-4 w-4" />{t("economy.wallet.buyAction") || "РљСѓРїРёС‚СЊ"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setSendOpen(true)}><Send className="h-4 w-4" />{t("economy.wallet.sendAction") || "РћС‚РїСЂР°РІРёС‚СЊ"}</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setReceiveOpen(true)}><ArrowDownLeft className="h-4 w-4" />{t("economy.wallet.receiveAction") || "РџРѕР»СѓС‡РёС‚СЊ"}</Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">{t("economy.wallet.incomeRecent") || "Income (recent)"}</div>
            <div className="mt-1 text-xl font-semibold text-emerald-300">{formatCoin(incomeMicro)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">{t("economy.wallet.expenseRecent") || "Expense (recent)"}</div>
            <div className="mt-1 text-xl font-semibold text-rose-300">{formatCoin(expenseMicro)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">{t("economy.wallet.feesPaid") || "Fees paid"}</div>
            <div className="mt-1 text-xl font-semibold text-amber-300">{formatCoin(feesMicro)}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-4">
          <div className="text-sm text-white/80">{t("economy.wallet.smartInsights") || "Smart insights"}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">{t("economy.wallet.avgTransfer") || "Avg transfer"}</div>
              <div className="mt-1 text-sm font-semibold text-white">{formatCoin(avgTransferMicro)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">{t("economy.wallet.transferCount") || "Transfers"}</div>
              <div className="mt-1 text-sm font-semibold text-white">{transferCount}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">{t("economy.wallet.momentum") || "Momentum"}</div>
              <div className={`mt-1 text-sm font-semibold ${momentumTone}`}>{Math.round(savingsRate)}%</div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-4">
            <div className="text-sm text-white/80">{t("economy.wallet.liveActivity") || "Live activity"}</div>
            <div className="mt-3 space-y-2">
              {liveActivity.length === 0 ? (
                <div className="text-xs text-white/60">{t("economy.wallet.liveActivityEmpty") || "No live events yet"}</div>
              ) : liveActivity.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => item.txHash && navigate(`/wallet/history?openTx=${encodeURIComponent(item.txHash)}`)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/80 hover:border-white/20"
                >
                  <div>{item.text}</div>
                  <div className="mt-1 text-[10px] text-white/50">{new Date(item.at).toLocaleTimeString()}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-300/20 bg-gradient-to-b from-emerald-500/10 to-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-white/90">{t("economy.wallet.securityCenter") || "Security center"}</div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${e2eeEnabled ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"}`}>
                {e2eeEnabled ? (t("economy.wallet.e2eeEnabled") || "E2EE enabled") : (t("economy.wallet.e2eeDisabled") || "E2EE disabled")}
              </span>
            </div>
            <div className="mt-2">
              <Button type="button" size="sm" variant={e2eeEnabled ? "secondary" : "outline"} onClick={toggleE2EE}>
                {e2eeEnabled ? (t("economy.wallet.e2eeTurnOff") || "Disable E2EE") : (t("economy.wallet.e2eeTurnOn") || "Enable E2EE")}
              </Button>
            </div>
            <div className="mt-3 space-y-1 text-xs text-white/75">
              <div>{t("economy.wallet.secureDeviceId") || "Device"}: {secureDeviceId || "—"}</div>
              <div>{t("economy.wallet.pendingEnvelopes") || "Pending envelopes"}: {secureEnvelopeCount}</div>
              {e2eeEnabled && !secureSyncOk && (
                <div className="text-[11px] text-amber-200/90">{t("economy.wallet.e2eeSyncPending") || "E2EE enabled, waiting for secure sync"}</div>
              )}
            </div>
            <div className="mt-3 space-y-2">
              <div className="text-xs text-white/70">{t("economy.wallet.securityOps") || "Security operations"}</div>
              {securityOps.length === 0 ? (
                <div className="text-xs text-white/55">{t("economy.wallet.securityOpsEmpty") || "No operations yet"}</div>
              ) : securityOps.map((tx, idx) => {
                const typed = tx as Record<string, unknown>;
                const txHash = String(typed.tx_hash || "");
                const txType = String(typed.type || "TX");
                return (
                  <button
                    key={txHash || `sec-${idx}`}
                    type="button"
                    onClick={() => navigate(`/wallet/history?openTx=${encodeURIComponent(txHash)}`)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/80 hover:border-white/20"
                  >
                    <div className="truncate">{txType}</div>
                    <div className="mt-0.5 truncate text-[10px] text-white/55">{txHash || "—"}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
      )}

      <Dialog open={buyOpen} onOpenChange={(next) => { setBuyOpen(next); if (!next) setModalError(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden">
          {modalError && (
            <div className="mb-3 rounded-xl border border-red-300/40 bg-red-500/15 px-3 py-2 text-xs text-red-100 shadow-[0_0_24px_rgba(239,68,68,0.25)] relative z-[60]">
              {modalError}
            </div>
          )}
          <DialogHeader>
            <DialogTitle className="text-center text-white">{t("economy.wallet.buyAction") || "РљСѓРїРёС‚СЊ"} LUX</DialogTitle>
            <DialogDescription className="text-center text-white/60">
              {t("economy.wallet.buyModalDesc") || "Р’РІРµРґРёС‚Рµ РєРѕР»РёС‡РµСЃС‚РІРѕ LUX Рё РїРѕСЃРјРѕС‚СЂРёС‚Рµ РёС‚РѕРіРѕРІСѓСЋ СЃС‚РѕРёРјРѕСЃС‚СЊ."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-white/70">{t("economy.wallet.buyAmountLux") || "РљРѕР»РёС‡РµСЃС‚РІРѕ LUX"}</label>
              <input
                value={buyLux}
                onChange={(e) => setBuyLux(e.target.value)}
                placeholder="10"
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-white"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
              <div>{t("economy.wallet.buyPreviewLux") || "Рљ Р·Р°С‡РёСЃР»РµРЅРёСЋ"}: {safeLuxAmount.toFixed(3)} LUX</div>
              <div>{t("economy.wallet.buyPreviewRate") || "Курс"}: {t("economy.wallet.buyPreviewRateValue") || "1 LUX = 2.3 ₽"}</div>
              <div className="font-medium text-white">{t("economy.wallet.buyPreviewTotal") || "Итого к оплате"}: {rubCost.toFixed(2)} ₽</div>
            </div>
          </div>

          <DialogFooter className="mt-4 justify-center sm:justify-center">
            <Button type="button" variant="ghost" onClick={() => setBuyOpen(false)}>
              {t("common.cancel") || "РћС‚РјРµРЅР°"}
            </Button>
            <Button type="button" disabled>
              {t("economy.wallet.payAction") || "РћРїР»Р°С‚РёС‚СЊ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sendOpen} onOpenChange={(next) => { setSendOpen(next); if (!next) setModalError(null); }}>
        <DialogContent className="max-w-md">
          {modalError && (
            <div className="mb-3 rounded-xl border border-red-300/40 bg-red-500/15 px-3 py-2 text-xs text-red-100 shadow-[0_0_24px_rgba(239,68,68,0.25)] relative z-[60]">
              {modalError}
            </div>
          )}
          <DialogHeader>
            <DialogTitle className="text-center text-white">{t("economy.wallet.sendAction") || "РћС‚РїСЂР°РІРёС‚СЊ"} LUX</DialogTitle>
            <DialogDescription className="text-center text-white/60">
              {t("economy.wallet.sendModalDesc") || "Р’РІРµРґРёС‚Рµ РїРѕР»СѓС‡Р°С‚РµР»СЏ Рё СЃСѓРјРјСѓ РїРµСЂРµРІРѕРґР°."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
               <div>{t("economy.wallet.available") || "Р”РѕСЃС‚СѓРїРЅРѕ"}: {formatCoin(availableMicro)}</div>
               {sendSafeLuxAmount > 0 && !canAffordSend && (
                 <div className="mt-1 text-xs text-red-300">{t("economy.wallet.errorInsufficientForFee") || "Недостаточно средств с учётом комиссии"}</div>
               )}
             </div>

            <div>
              <label className="mb-1 block text-xs text-white/70">{t("economy.wallet.toField") || "Адрес или @username получателя"}</label>
              <input
                value={sendTo}
                onChange={(e) => {
                  setSendTo(e.target.value);
                  setRecipientPreview(null);
                  setSendToError(null);
                }}
                onBlur={() => {
                  void validateRecipient();
                }}
                placeholder={t("economy.wallet.toPlaceholder") || "@username или lume_xxx"}
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-white"
              />
              {recipientChecking && (
                <div className="mt-2 text-xs text-white/60">{t("common.loading") || "Loading..."}</div>
              )}
              {sendToError && (
                <div className="mt-2 text-xs text-red-300">{sendToError}</div>
              )}
              {recipientPreview && (
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-white/80">
                  {recipientPreview.avatar ? (
                    <img
                      src={normalizeImageUrl(recipientPreview.avatar) || ""}
                      alt={recipientPreview.username || recipientPreview.name || "user"}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-white/10" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">{recipientPreview.name || recipientPreview.username || "User"}</div>
                    <div className="truncate text-white/60">{recipientPreview.username ? `@${String(recipientPreview.username).replace(/^@+/, "")}` : recipientPreview.address}</div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/70">{t("economy.wallet.amountField") || "Сумма LUX"}</label>
              <input
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="1"
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-white"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80 space-y-1">
              <div>{t("economy.wallet.fee") || "РљРѕРјРёСЃСЃРёСЏ"}: {formatCoin(sendFeeMicro)}</div>
              <div className="text-xs text-white/60">{t("economy.wallet.feeReserve") || "Reserve"}: {formatCoin(reserveFeeMicro)}</div>
              <div className="text-xs text-white/60">{t("economy.wallet.feeBurn") || "Burn"}: {formatCoin(burnFeeMicro)}</div>
              <div>{t("economy.wallet.receive") || "РџРѕР»СѓС‡РёС‚ РїРѕР»СѓС‡Р°С‚РµР»СЊ"}: {formatCoin(sendAmountMicro)}</div>
              <div className="font-medium text-white">{t("economy.wallet.debit") || "РЎРїРёС€РµС‚СЃСЏ"}: {formatCoin(sendDebitMicro)}</div>
            </div>
          </div>

          <DialogFooter className="mt-4 justify-center sm:justify-center">
            <Button type="button" variant="ghost" onClick={() => setSendOpen(false)}>
              {t("common.cancel") || "РћС‚РјРµРЅР°"}
            </Button>
            <Button
              type="button"
              disabled={!sendTo.trim() || sendSafeLuxAmount <= 0 || Boolean(sendToError) || recipientChecking || !recipientPreview}
              onClick={async () => {
                if (!canAffordSend) {
                  const msg = t("economy.wallet.errorInsufficientForFee") || "Недостаточно средств с учётом комиссии";
                  setModalError(msg);
                  toast({
                    title: t("common.error") || "Ошибка",
                    description: msg,
                    variant: "destructive",
                  });
                  return;
                }

                setSendSubmitting(true);
                setModalError(null);
                try {
                  const idempotencyKey = makeIdem();
                  const encrypted = e2eeEnabled
                    ? await buildWalletEncryptedPayload({
                        to: sendTo.trim(),
                        amount_coin: sendSafeLuxAmount.toString(),
                        idempotency_key: idempotencyKey,
                        recipientUserId: recipientPreview?.user_id || 0,
                      })
                    : null;
                  await economyAPI.transfer({
                    to: sendTo.trim(),
                    amount_coin: sendSafeLuxAmount.toString(),
                    idempotency_key: idempotencyKey,
                    encrypted,
                  });
                  setSendTo("");
                  setSendAmount("1");
                  setRecipientPreview(null);
                  setSendToError(null);
                  setSendOpen(false);
                  await reload();
                } catch (e) {
                  const message = resolveWalletErrorMessage(e);
                  setModalError(message);
                  toast({
                    title: t("common.error") || "Ошибка",
                    description: message,
                    variant: "destructive",
                  });
                } finally {
                  setSendSubmitting(false);
                }
              }}
            >
              {sendSubmitting ? (t("common.loading") || "Loading...") : (t("economy.wallet.sendAction") || "РћС‚РїСЂР°РІРёС‚СЊ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={receiveOpen}
        onOpenChange={(next) => {
          setReceiveOpen(next);
          if (!next) setCopied(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-white">{t("economy.wallet.receiveAction") || "РџРѕР»СѓС‡РёС‚СЊ"} LUX</DialogTitle>
            <DialogDescription className="text-center text-white/60">
              {t("economy.wallet.receiveModalDesc") || "РџРѕРєР°Р¶РёС‚Рµ QR-РєРѕРґ РѕС‚РїСЂР°РІРёС‚РµР»СЋ РёР»Рё РЅР°Р¶РјРёС‚Рµ РЅР° Р°РґСЂРµСЃ РґР»СЏ РєРѕРїРёСЂРѕРІР°РЅРёСЏ."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-2">
            <div className="relative rounded-2xl border border-white/10 bg-black/30 p-0 overflow-hidden">
              <div className="h-[220px] w-[220px]" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (!walletAddress) return;
              await navigator.clipboard.writeText(walletAddress);
              setCopied(true);
            }}
            className={`w-full rounded-xl border p-3 text-left text-sm transition-all duration-500 ease-out disabled:opacity-50 ${
              copied ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.18)]" : "border-white/10 bg-white/5 text-white/85"
            }`}
            disabled={!walletAddress}
          >
            <div className="mb-1 text-xs text-white/60">{t("economy.wallet.walletAddress") || "РђРґСЂРµСЃ РєРѕС€РµР»СЊРєР°"}</div>
            <div className="min-w-0 break-all">{walletAddress || "—"}</div>
          </button>
          <div className="text-center text-xs text-white/60">
            {t("economy.wallet.receiveTapHint") || "Tap the address to copy it."}
          </div>

          <DialogFooter className="mt-2 justify-center sm:justify-center">
            <Button type="button" onClick={() => setReceiveOpen(false)}>{t("common.close") || "Р—Р°РєСЂС‹С‚СЊ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletPage;


