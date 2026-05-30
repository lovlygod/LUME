import { RefreshCw, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import WalletSectionNav from "./WalletSectionNav";
import { useWalletData } from "./useWalletData";
import { formatCoin } from "./format";

const WalletExplorerPage = () => {
  const { t } = useLanguage();
  const { explorer, loading, error, reload } = useWalletData();

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">{t("economy.tabs.explorer") || "Explorer"}</h1>
        <Button type="button" variant="outline" size="sm" onClick={reload} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          {t("common.refresh") || "Refresh"}
        </Button>
      </div>

      {error && <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</div>}

      <WalletSectionNav />

      {loading ? (
        <div className="space-y-2">
          <div className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/5" />
          <div className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/5" />
        </div>
      ) : (
      <div className="space-y-2">
        {explorer.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
            {t("economy.explorer.empty") || "No transactions"}
          </div>
        )}
        {explorer.map((tx, idx) => (
          <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/80">
            <div className="inline-flex items-center gap-2"><Search className="h-4 w-4" />tx: {String(tx.tx_hash ?? "-")}</div>
            <div>type: {String(tx.type ?? "-")}</div>
            <div>amount: {formatCoin(tx.amount_micro)}</div>
            <div>fee: {formatCoin(tx.fee_micro)}</div>
            <div>burn: {formatCoin(tx.burn_micro)}</div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default WalletExplorerPage;

