import { useEffect, useMemo, useState } from "react";
import { Activity, Database, Server, Wifi, HardDrive, Cpu } from "lucide-react";
import { API_BASE_PATH } from "@/lib/config";
import { useLanguage } from "@/contexts/LanguageContext";
import HelpShell from "@/components/help/HelpShell";

interface StatusPayload {
  timestamp: string;
  uptimeSec: number;
  api: {
    available: boolean;
    latencyMs: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  database: {
    available: boolean;
    latencyMs: number;
  };
  websocket: {
    available: boolean;
    latencyMs: number | null;
    connections: number;
  };
  media: {
    available: boolean;
    latencyMs: number | null;
  };
  system: {
    memory: {
      heapUsed: number;
      heapTotal: number;
      percent: number;
    };
    cpu: {
      loadAvg: number[];
    };
  };
}

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

const StatusPage = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timer: number | null = null;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_PATH}/status`, { credentials: "include" });
        if (!res.ok) {
          throw new Error("STATUS_UNAVAILABLE");
        }
        const payload: StatusPayload = await res.json();
        if (isMounted) {
          setData(payload);
          setLastChecked(Date.now());
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(t("status.unavailable"));
        }
      }
    };

    fetchStatus();
    timer = window.setInterval(fetchStatus, 10000);

    return () => {
      isMounted = false;
      if (timer) window.clearInterval(timer);
    };
  }, [t]);

  const services = useMemo(() => {
    if (!data) return [];
    const apiStatus = !data.api.available
      ? "down"
      : data.api.latencyMs > 500 || data.api.errorRate > 2
        ? "degraded"
        : "ok";
    const dbStatus = !data.database.available
      ? "down"
      : data.database.latencyMs > 500
        ? "degraded"
        : "ok";
    const wsStatus = !data.websocket.available
      ? "down"
      : data.websocket.latencyMs && data.websocket.latencyMs > 500
        ? "degraded"
        : "ok";
    const mediaStatus = !data.media.available
      ? "down"
      : data.media.latencyMs && data.media.latencyMs > 500
        ? "degraded"
        : "ok";
    return [
      { key: "api", label: t("status.services.api"), icon: Server, latency: data.api.latencyMs, status: apiStatus },
      { key: "db", label: t("status.services.database"), icon: Database, latency: data.database.latencyMs, status: dbStatus },
      { key: "ws", label: t("status.services.websocket"), icon: Wifi, latency: data.websocket.latencyMs, status: wsStatus },
      { key: "media", label: t("status.services.media"), icon: HardDrive, latency: data.media.latencyMs, status: mediaStatus }
    ];
  }, [data, t]);

  const gridServices = useMemo(() => {
    if (!data) return [];
    const baseLatency = data.api.latencyMs;
    const baseStatus = data.api.latencyMs > 500 || data.api.errorRate > 2 ? "degraded" : "ok";
    const uptimePercent = Math.min(100, Math.max(0, (data.uptimeSec / 86400) * 100));
    return [
      { key: "api", label: t("status.grid.api"), latency: data.api.latencyMs, uptime: uptimePercent, status: baseStatus },
      { key: "auth", label: t("status.grid.auth"), latency: baseLatency, uptime: uptimePercent, status: baseStatus },
      { key: "feed", label: t("status.grid.feed"), latency: baseLatency, uptime: uptimePercent, status: baseStatus },
      { key: "messages", label: t("status.grid.messages"), latency: data.websocket.latencyMs ?? baseLatency, uptime: uptimePercent, status: baseStatus },
      { key: "servers", label: t("status.grid.servers"), latency: baseLatency, uptime: uptimePercent, status: baseStatus },
      { key: "media", label: t("status.grid.media"), latency: data.media.latencyMs ?? baseLatency, uptime: uptimePercent, status: baseStatus }
    ];
  }, [data, t]);

  const overallStatus = useMemo(() => {
    if (!data) return "unknown";
    if (services.some((svc) => svc.status === "down")) return "down";
    if (services.some((svc) => svc.status === "degraded")) return "degraded";
    return "ok";
  }, [data, services]);

  const statusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-emerald-500/20 text-emerald-200";
      case "degraded":
        return "bg-amber-500/20 text-amber-200";
      case "down":
        return "bg-rose-500/20 text-rose-200";
      default:
        return "bg-white/10 text-white/70";
    }
  };

  const lastCheckedLabel = lastChecked
    ? t("status.lastChecked", { seconds: Math.floor((Date.now() - lastChecked) / 1000) })
    : t("status.lastChecked", { seconds: 0 });

  return (
    <HelpShell title={t("status.title")} subtitle={t("status.subtitle")} meta={lastCheckedLabel}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="sticky top-6 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              {t("status.overview")}
            </div>
            <div className="mt-4 space-y-3">
              <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(overallStatus)}`}>
                {overallStatus === "ok" ? t("status.ok") : overallStatus === "down" ? t("status.down") : t("status.degraded")}
              </div>
              <div className="text-sm text-white/60">{t("status.uptime")}: {data ? formatUptime(data.uptimeSec) : "--"}</div>
              <div className="text-xs text-white/40">{lastCheckedLabel}</div>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-6 space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">{t("status.live")}</div>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            {error && (
              <div className="mt-4 rounded-[22px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
            {data && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                  <div className="text-xs text-white/50">API</div>
                  <div className="text-lg font-semibold">{data.api.latencyMs} ms</div>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                  <div className="text-xs text-white/50">DB</div>
                  <div className="text-lg font-semibold">{data.database.latencyMs} ms</div>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                  <div className="text-xs text-white/50">WS</div>
                  <div className="text-lg font-semibold">{data.websocket.latencyMs ?? "--"} ms</div>
                </div>
              </div>
            )}
          </div>

          {data && (
            <div className="grid gap-4 md:grid-cols-2">
              {gridServices.map((service) => (
                <div key={service.key} className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <span className={`h-2 w-2 rounded-full ${service.status === "ok" ? "bg-emerald-400" : service.status === "degraded" ? "bg-amber-400" : "bg-rose-400"}`} />
                      {service.label}
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] ${statusBadge(service.status)}`}>
                      {service.status === "ok" ? t("status.ok") : service.status === "down" ? t("status.down") : t("status.degraded")}
                    </span>
                  </div>
                  <div className="mt-3 text-lg font-semibold">
                    {service.latency !== null ? `${service.latency} ms` : t("status.noData")}
                  </div>
                  <div className="text-xs text-white/50">{t("status.uptimePercent", { value: service.uptime.toFixed(2) })}</div>
                </div>
              ))}
            </div>
          )}
        </main>

        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm font-semibold text-white">{t("status.metrics")}</div>
            <div className="mt-3 space-y-2 text-sm text-white/60">
              <div>{t("status.requests")}: {data ? data.api.requestsPerMinute : "--"}</div>
              <div>{t("status.errorRate", { value: data ? data.api.errorRate.toFixed(2) : "0.00" })}</div>
              <div>{t("status.connections", { value: data ? data.websocket.connections : 0 })}</div>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm font-semibold text-white">{t("status.system")}</div>
            <div className="mt-3 space-y-2 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                {data ? data.system.cpu.loadAvg.map((v) => v.toFixed(2)).join(" / ") : "--"}
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                {data
                  ? t("status.memoryUsed", {
                      used: Math.round(data.system.memory.heapUsed / 1024 / 1024),
                      total: Math.round(data.system.memory.heapTotal / 1024 / 1024)
                    })
                  : "--"}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </HelpShell>
  );
};

export default StatusPage;
