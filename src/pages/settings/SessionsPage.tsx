import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Laptop, Smartphone, Tablet, LogOut, Globe2, Wifi, Building2, Clock3 } from "lucide-react";
import { sessionsAPI, type SessionInfo } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const iconByDevice = (deviceLabel: string) => {
  const lower = deviceLabel.toLowerCase();
  if (lower.includes("iphone") || lower.includes("android") || lower.includes("mobile")) {
    return Smartphone;
  }
  if (lower.includes("ipad") || lower.includes("tablet")) {
    return Tablet;
  }
  return Laptop;
};

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const formatRelativeTime = (value: string, t: TranslateFn) => {
  if (!value) return t("sessions.lastActiveUnknown");
  const lastActive = new Date(value);
  if (Number.isNaN(lastActive.getTime())) return t("sessions.lastActiveUnknown");
  const diffMs = Date.now() - lastActive.getTime();
  if (diffMs < 60_000) return t("sessions.lastActiveNow");
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) return t("sessions.lastActiveMinutes", { count: diffMinutes });
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t("sessions.lastActiveHours", { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  return t("sessions.lastActiveDays", { count: diffDays });
};

const SessionsPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [processingSessionId, setProcessingSessionId] = useState<string | null>(null);
  const [processingAll, setProcessingAll] = useState(false);

  const currentSession = useMemo(
    () => sessions.find((session) => session.current),
    [sessions]
  );

  const otherSessions = useMemo(
    () => sessions.filter((session) => !session.current),
    [sessions]
  );

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await sessionsAPI.getSessions();
      setSessions(response.sessions || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      setError(t("sessions.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleLogoutSession = async (sessionId: string) => {
    setProcessingSessionId(sessionId);
    try {
      await sessionsAPI.deleteSession(sessionId);
      toast.success(t("sessions.terminated"));
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    } catch (err) {
      console.error("Failed to terminate session:", err);
      toast.error(t("sessions.terminateError"));
    } finally {
      setProcessingSessionId(null);
    }
  };

  const handleLogoutAll = async () => {
    setProcessingAll(true);
    try {
      await sessionsAPI.logoutAllOther();
      toast.success(t("sessions.terminatedAll"));
      setLogoutAllOpen(false);
      await loadSessions();
    } catch (err) {
      console.error("Failed to terminate sessions:", err);
      toast.error(t("sessions.terminateAllError"));
    } finally {
      setProcessingAll(false);
    }
  };

  const renderSessionCard = (session: SessionInfo) => {
    const Icon = iconByDevice(session.device);
    const locationLabel = session.city && session.country
      ? `${session.city}, ${session.country}`
      : session.location || t("sessions.locationUnknown");
    return (
      <div
        key={session.id}
        className="border border-white/10 rounded-2xl p-5 bg-white/5 backdrop-blur flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-white/70" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {`${session.browser} — ${session.os}`}
            </p>
            <div className="mt-2 space-y-1 text-xs text-secondary">
              <div className="flex items-center gap-2">
                <Globe2 className="h-3.5 w-3.5 text-white/60" />
                <span>{t("sessions.locationLabel")}: {locationLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="h-3.5 w-3.5 text-white/60" />
                <span>{t("sessions.ipLabel")}: {session.ip || t("sessions.ipUnknown")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-white/60" />
                <span>{t("sessions.providerLabel")}: {session.provider || t("sessions.providerUnknown")}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-secondary flex items-center gap-2">
            <Clock3 className="h-3.5 w-3.5 text-white/60" />
            {t("sessions.lastActiveLabel")}: {formatRelativeTime(session.lastActive, t)}
          </p>
          {session.current ? (
            <span className="text-xs font-semibold text-emerald-200">
              {t("sessions.thisDevice")}
            </span>
          ) : (
            <button
              onClick={() => handleLogoutSession(session.id)}
              disabled={processingSessionId === session.id}
              className="flex items-center gap-2 text-xs font-semibold text-red-200 hover:text-red-100 transition disabled:opacity-50"
            >
              {processingSessionId === session.id ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-red-200 border-t-transparent" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              {t("sessions.logout")}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="px-6 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("sessions.title")}</h1>
          <p className="text-sm text-secondary mt-1">{t("sessions.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/settings")}
            className="px-4 py-2 rounded-full text-xs font-medium bg-white/5 text-secondary hover:text-white transition"
          >
            {t("sessions.backToSettings")}
          </button>
          <button
            onClick={() => setLogoutAllOpen(true)}
            disabled={otherSessions.length === 0}
            className="px-4 py-2 rounded-full text-xs font-semibold text-red-200 border border-red-200/20 hover:bg-white/5 transition disabled:opacity-50"
          >
            {t("sessions.logoutAll")}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="border border-red-200/20 bg-red-500/10 rounded-2xl p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="border border-white/10 rounded-2xl p-6 text-sm text-secondary">
            {t("sessions.empty")}
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="space-y-4">
            {currentSession && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-white/80">
                  {t("sessions.currentSession")}
                </h2>
                {renderSessionCard(currentSession)}
              </div>
            )}
            {otherSessions.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-white/80">
                  {t("sessions.otherSessions")}
                </h2>
                <div className="space-y-4">
                  {otherSessions.map(renderSessionCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={logoutAllOpen} onOpenChange={setLogoutAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sessions.logoutAllTitle")}</DialogTitle>
            <DialogDescription>{t("sessions.logoutAllDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setLogoutAllOpen(false)}
              className="flex-1 rounded-full py-2 text-sm font-medium bg-white/5 text-white hover:bg-white/10 transition"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleLogoutAll}
              disabled={processingAll}
              className="flex-1 rounded-full py-2 text-sm font-semibold text-red-200 border border-red-200/20 hover:bg-white/5 transition disabled:opacity-50"
            >
              {processingAll ? t("sessions.loggingOut") : t("sessions.logout")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionsPage;
