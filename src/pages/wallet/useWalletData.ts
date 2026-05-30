import { useCallback, useEffect, useState } from "react";
import { economyAPI } from "@/services/api";

export const useWalletData = () => {
  const [wallet, setWallet] = useState<Record<string, unknown> | null>(null);
  const [walletStats, setWalletStats] = useState<Record<string, unknown> | null>(null);
  const [explorer, setExplorer] = useState<Array<Record<string, unknown>>>([]);
  const [market, setMarket] = useState<Array<Record<string, unknown>>>([]);
  const [walletTx, setWalletTx] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, walletStatsRes, explorerRes, marketRes, walletTxRes] = await Promise.all([
        economyAPI.getWallet(),
        economyAPI.getWalletStats(),
        economyAPI.getExplorerPublic(),
        economyAPI.getMarketListings(),
        economyAPI.getWalletTransactions(),
      ]);
      setWallet(walletRes.wallet);
      setWalletStats(walletStatsRes.stats || null);
      setExplorer(explorerRes.transactions || []);
      setMarket(marketRes.listings || []);
      setWalletTx(walletTxRes.transactions || []);
    } catch (e) {
      setError((e as { error?: { message?: string } })?.error?.message || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { wallet, walletStats, explorer, market, walletTx, loading, error, reload };
};

