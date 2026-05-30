import { RefreshCw, Search, ShoppingCart, Tag, UserRoundSearch, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { economyAPI } from "@/services/api";
import { wsService } from "@/services/websocket";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CustomSelect from "@/components/ui/CustomSelect";
import { Switch } from "@/components/ui/switch";
import WalletSectionNav from "./WalletSectionNav";
import { useWalletData } from "./useWalletData";
import { formatCoin, formatRub, makeIdem } from "./format";

const WalletMarketPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { loading, error, reload } = useWalletData();
  const [filteredMarket, setFilteredMarket] = useState<Array<Record<string, unknown>>>([]);
  const [myUsernames, setMyUsernames] = useState<Array<Record<string, unknown>>>([]);
  const [selectedUsernameId, setSelectedUsernameId] = useState("");
  const [priceCoin, setPriceCoin] = useState("10");
  const [busy, setBusy] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [targetListing, setTargetListing] = useState<Record<string, unknown> | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "price_asc" | "price_desc" | "expiring">("new");
  const [onlyNew, setOnlyNew] = useState(false);
  const [minPriceCoin, setMinPriceCoin] = useState("");
  const [maxPriceCoin, setMaxPriceCoin] = useState("");
  const [section, setSection] = useState<"buy" | "sell">("buy");

  const myListings = useMemo(
    () => filteredMarket.filter((item) => Number(item?.seller_id || 0) > 0 && myUsernames.some((u) => String(u.normalized_username || "") === String(item.normalized_username || ""))),
    [filteredMarket, myUsernames],
  );

  const loadMyUsernames = async () => {
    const res = await economyAPI.getMyUsernames();
    const items = Array.isArray(res.usernames) ? res.usernames : [];
    setMyUsernames(items);
    if (items.length === 1) {
      setSelectedUsernameId(String(items[0]?.id || ""));
    }
  };

  const hardReload = async () => {
    setUiError(null);
    const marketRes = await economyAPI.getMarketListings({
      q: q.trim() || undefined,
      sort,
      only_new: onlyNew,
      min_price_coin: minPriceCoin.trim() || undefined,
      max_price_coin: maxPriceCoin.trim() || undefined,
      limit: 100,
    });
    await Promise.all([reload(), loadMyUsernames()]);
    setFilteredMarket(Array.isArray(marketRes?.listings) ? marketRes.listings : []);
  };

  const parseApiError = (e: unknown) => {
    const code = (e as { error?: { code?: string } })?.error?.code;
    if (!code) return t("common.error") || "Error";
    if (code === "USERNAME_ALREADY_LISTED") return t("economy.market.errorAlreadyListed") || "Username already listed";
    if (code === "INSUFFICIENT_BALANCE") return t("economy.market.errorInsufficient") || "Insufficient balance";
    if (code === "LISTING_NOT_ACTIVE") return t("economy.market.errorNotActive") || "Listing no longer active";
    return code;
  };

  useEffect(() => {
    void hardReload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort, onlyNew, minPriceCoin, maxPriceCoin]);

  useEffect(() => {
    if (section === "sell" && myUsernames.length === 0) {
      void loadMyUsernames();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  useEffect(() => {
    const unsubCreated = wsService.on("market.username.listing.created", async () => {
      await hardReload();
    });
    const unsubUpdated = wsService.on("market.username.listing.updated", async () => {
      await hardReload();
    });
    const unsubSold = wsService.on("market.username.listing.sold", async () => {
      await hardReload();
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubSold();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const platformFeeMicro = useMemo(() => {
    const p = BigInt(Number(targetListing?.price_micro || 0));
    return Number((p * 20n) / 100n);
  }, [targetListing]);

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">{t("economy.tabs.market") || "Username Market"}</h1>
        <Button type="button" variant="outline" size="sm" onClick={reload} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          {t("common.refresh") || "Refresh"}
        </Button>
      </div>

      {error && <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</div>}
      {uiError && <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">{uiError}</div>}

      <WalletSectionNav />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={section === "buy" ? "default" : "ghost"} onClick={() => setSection("buy")}>
            {t("economy.market.buySection") || "Buy usernames"}
          </Button>
          <Button type="button" variant={section === "sell" ? "default" : "ghost"} onClick={() => setSection("sell")}>
            {t("economy.market.sellSection") || "Publish my usernames"}
          </Button>
        </div>
      </div>

      {section === "buy" && (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="text-sm font-medium text-white">{t("economy.market.filtersTitle") || "Search & filters"}</div>
            <label className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                <Search className="h-4 w-4 text-white/60" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none"
                  placeholder={t("economy.market.search") || "Search by username"}
                />
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              <CustomSelect
                value={sort}
                onChange={(value) => setSort(value as "new" | "price_asc" | "price_desc" | "expiring")}
                options={[
                  { value: "new", label: t("economy.market.sortNew") || "Newest" },
                  { value: "price_asc", label: t("economy.market.sortPriceAsc") || "Price asc" },
                  { value: "price_desc", label: t("economy.market.sortPriceDesc") || "Price desc" },
                  { value: "expiring", label: t("economy.market.sortExpiring") || "Expiring soon" },
                ]}
                className="w-full"
                buttonClassName="px-3 py-2 rounded-xl"
              />
              <input value={minPriceCoin} onChange={(e) => setMinPriceCoin(e.target.value)} className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white" placeholder={t("economy.market.minPrice") || "Min COIN"} />
              <input value={maxPriceCoin} onChange={(e) => setMaxPriceCoin(e.target.value)} className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white" placeholder={t("economy.market.maxPrice") || "Max COIN"} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-sm text-white/80">{t("economy.market.onlyNew") || "Only new (<24h)"}</span>
              <Switch checked={onlyNew} onCheckedChange={setOnlyNew} />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              <div className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            </div>
          ) : (
          <div className="space-y-2">
            {filteredMarket.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                {t("economy.market.empty") || "No active listings"}
              </div>
            )}
            {filteredMarket.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/90 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium inline-flex items-center gap-2"><UserRoundSearch className="h-4 w-4" />@{String(item.username ?? "-")}</div>
                  <div className="text-white/70">{formatCoin(item.price_micro)} · {formatRub(item.price_micro)}</div>
                  {item?.seller_username ? (
                    <div className="text-xs text-white/50">{t("economy.market.seller") || "Seller"}: @{String(item.seller_username)}</div>
                  ) : null}
                </div>
                {Number(item?.seller_id || 0) === Number(user?.id || 0) ? (
                  <Button type="button" disabled variant="secondary">
                    {t("economy.market.yours") || "This is your username"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setTargetListing(item);
                      setBuyOpen(true);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {t("economy.market.buy") || "Buy"}
                  </Button>
                )}
              </div>
            ))}
          </div>
          )}
        </>
      )}

      {section === "sell" && (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="text-sm font-medium text-white">{t("economy.market.createTitle") || "Create listing"}</div>
            <div className="grid gap-2 sm:grid-cols-3">
              <CustomSelect
                value={selectedUsernameId}
                onChange={setSelectedUsernameId}
                placeholder={t("economy.market.selectUsername") || "Select username"}
                options={myUsernames.map((u) => ({
                  value: String(u.id),
                  label: `@${String(u.username || u.normalized_username || "")}`,
                }))}
                className="w-full"
                buttonClassName="px-3 py-2 rounded-xl"
              />
              {myUsernames.length === 0 && (
                <div className="text-xs text-white/60 sm:col-span-3">
                  {t("economy.market.noOwnedUsernames") || "No usernames available for listing yet."}
                </div>
              )}
              <input
                value={priceCoin}
                onChange={(e) => setPriceCoin(e.target.value)}
                className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="10"
              />
              <Button
                type="button"
                disabled={!selectedUsernameId || !priceCoin || busy}
                onClick={async () => {
                  setBusy(true);
                  setUiError(null);
                  try {
                    await economyAPI.createMarketListing({ username_id: Number(selectedUsernameId), price_coin: priceCoin.trim() });
                    setSelectedUsernameId("");
                    setPriceCoin("10");
                    await hardReload();
                  } catch (e) {
                    setUiError(parseApiError(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Tag className="h-4 w-4" />
                {t("economy.market.createAction") || "List"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
            <div className="text-sm font-medium text-white">{t("economy.market.myListings") || "My active listings"}</div>
            {myListings.length === 0 && <div className="text-sm text-white/60">{t("economy.market.emptyMy") || "No my listings"}</div>}
            {myListings.map((item, idx) => (
              <div key={`my-${idx}`} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/85 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">@{String(item.username ?? "-")}</div>
                  <div className="text-white/65">{formatCoin(item.price_micro)} · {formatRub(item.price_micro)}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setUiError(null);
                    try {
                      await economyAPI.cancelMarketListing(Number(item.id));
                      await hardReload();
                    } catch (e) {
                      setUiError(parseApiError(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  {t("economy.market.cancel") || "Cancel"}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-white">{t("economy.market.buy") || "Buy"}</DialogTitle>
            <DialogDescription className="text-center text-white/60">
              @{String(targetListing?.username || "-")} · {formatCoin(targetListing?.price_micro)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 text-sm text-white/80">
            <div>{t("economy.market.confirmPrice") || "Price"}: <span className="text-white">{formatCoin(targetListing?.price_micro)}</span></div>
            <div>{t("economy.market.confirmFee") || "Platform fee (included)"}: <span className="text-white">{formatCoin(platformFeeMicro)}</span></div>
            <div>{t("economy.market.confirmTotal") || "Total debit"}: <span className="text-white">{formatCoin(targetListing?.price_micro)}</span></div>
            <div className="text-amber-300">{t("economy.market.irreversible") || "This operation is irreversible."}</div>
          </div>
          <DialogFooter className="justify-center sm:justify-center">
            <Button type="button" variant="ghost" onClick={() => setBuyOpen(false)}>{t("common.cancel") || "Cancel"}</Button>
            <Button
              type="button"
              disabled={!targetListing || busy}
              onClick={async () => {
                if (!targetListing) return;
                setBusy(true);
                setUiError(null);
                try {
                  await economyAPI.buyMarketListing(Number(targetListing.id), makeIdem(), Date.now());
                  setBuyOpen(false);
                  setTargetListing(null);
                  await hardReload();
                } catch (e) {
                  setUiError(parseApiError(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("economy.market.buy") || "Buy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletMarketPage;

