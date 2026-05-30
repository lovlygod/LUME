import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AtSign, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { economyAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import CustomSelect from "@/components/ui/CustomSelect";
import { toast } from "sonner";

type UsernameItem = {
  id: number;
  username: string;
  is_primary?: boolean;
  is_visible?: boolean;
  display_order?: number | null;
};

const UsernamesPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<UsernameItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await economyAPI.getMyUsernames();
      const list = (Array.isArray(res.usernames) ? res.usernames : []).map((x) => ({
        id: Number(x.id),
        username: String(x.username || ""),
        is_primary: Boolean(x.is_primary),
        is_visible: Boolean(x.is_visible ?? true),
        display_order: x.display_order == null ? null : Number(x.display_order),
      }));
      setItems(list);
    } catch {
      toast.error(t("common.error") || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.username.toLowerCase().includes(q));
  }, [items, search]);

  const pinnedCount = useMemo(
    () => items.filter((it) => it.is_visible && it.display_order != null && it.display_order >= 1 && it.display_order <= 10).length,
    [items],
  );

  const updateOne = (next: UsernameItem) => {
    setItems((prev) => prev.map((it) => (it.id === next.id ? next : it)));
  };

  const notifyUsernamesUpdated = () => {
    window.dispatchEvent(new CustomEvent('lume:usernames:updated'));
  };

  return (
    <div className="min-h-screen">
      <div className="px-6 py-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("settings.usernames") || "Usernames"}</h1>
          <p className="text-sm text-secondary mt-1">{t("settings.usernamesDescription") || "Choose which usernames are displayed in profile"}</p>
        </div>
        <button onClick={() => navigate("/settings")} className="btn-glass-outline px-4 py-2 text-xs">
          {t("settings.backToSettings")}
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <label className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
            <Search className="h-4 w-4 text-white/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("settings.usernamesSearch") || "Search username"}
              className="w-full bg-transparent text-sm text-white outline-none"
            />
          </label>
          <p className="mt-2 text-xs text-secondary">
            {t("settings.usernamesPinnedHint") || "Pinned in profile: up to 10"} ({pinnedCount}/10)
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            <div className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            {t("settings.usernamesEmpty") || "No usernames found"}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((it) => {
              const pinned = it.is_visible && it.display_order != null && it.display_order >= 1 && it.display_order <= 10;
              const isTop = it.display_order === 1;
              const hideDisabled = !!it.is_primary;
              return (
                <div key={it.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`text-sm truncate ${isTop ? "font-bold text-violet-300" : pinned ? "font-medium text-white" : "font-medium text-white/80"}`}>
                      @{it.username}
                    </div>
                    <div className="text-xs text-secondary">
                      {pinned ? `#${it.display_order}` : (t("settings.usernamesSecondary") || "Secondary")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!it.is_visible}
                      onCheckedChange={async (checked) => {
                        if (hideDisabled && !checked) return;
                        setBusyId(it.id);
                        try {
                          await economyAPI.setUsernameVisibility(it.id, checked);
                          if (!checked) {
                            updateOne({ ...it, is_visible: false, display_order: null });
                          } else {
                            updateOne({ ...it, is_visible: true });
                          }
                          notifyUsernamesUpdated();
                        } catch {
                          toast.error(t("settings.saveError") || "Failed to save settings");
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      disabled={busyId === it.id || hideDisabled}
                    />

                    <CustomSelect
                      value={it.display_order == null ? "" : String(it.display_order)}
                      onChange={async (value) => {
                        setBusyId(it.id);
                        try {
                          if (!value) {
                            await economyAPI.clearUsernameDisplayOrder(it.id);
                            updateOne({ ...it, display_order: null });
                          } else {
                            await economyAPI.setUsernameDisplayOrder(it.id, Number(value));
                            setItems((prev) => prev.map((row) => {
                              if (row.id === it.id) return { ...row, is_visible: true, display_order: Number(value) };
                              if (row.display_order === Number(value)) return { ...row, display_order: null };
                              return row;
                            }));
                          }
                          notifyUsernamesUpdated();
                        } catch {
                          toast.error(t("settings.saveError") || "Failed to save settings");
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      options={[
                        { value: "", label: t("settings.usernamesUnpinned") || "Not pinned" },
                        ...Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `#${i + 1}` })),
                      ]}
                      className="w-[120px]"
                      buttonClassName="px-3 py-2 rounded-xl"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button variant="outline" onClick={load}>
          <AtSign className="h-4 w-4" />
          {t("common.refresh") || "Refresh"}
        </Button>
      </div>
    </div>
  );
};

export default UsernamesPage;
