import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Image as ImageIcon, Link as LinkIcon, FileText, Mic, Video } from "lucide-react";
import { motion } from "framer-motion";
import { messagesAPI } from "@/services/api";
import type { ChatAttachmentFeedItem, ChatAttachmentFeedType } from "@/types/messages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  chatId: string;
  t: (key: string, options?: Record<string, string>) => string;
  onOpenInChat?: (messageId: string) => void;
};

const tabIcon: Record<ChatAttachmentFeedType, ReactNode> = {
  media: <ImageIcon className="h-4 w-4" />,
  videos: <Video className="h-4 w-4" />,
  voice: <Mic className="h-4 w-4" />,
  files: <FileText className="h-4 w-4" />,
  links: <LinkIcon className="h-4 w-4" />,
};

const tabs: ChatAttachmentFeedType[] = ["media", "videos", "voice", "files", "links"];

const groupDateLabel = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
};

export default function ChatInfoShared({ chatId, t, onOpenInChat }: Props) {
  const [activeTab, setActiveTab] = useState<ChatAttachmentFeedType>("media");
  const [map, setMap] = useState<Record<ChatAttachmentFeedType, ChatAttachmentFeedItem[]>>({
    media: [], videos: [], voice: [], files: [], links: [],
  });
  const [cursorMap, setCursorMap] = useState<Record<ChatAttachmentFeedType, string | null>>({
    media: null, videos: null, voice: null, files: null, links: null,
  });
  const [hasMoreMap, setHasMoreMap] = useState<Record<ChatAttachmentFeedType, boolean>>({
    media: true, videos: true, voice: true, files: true, links: true,
  });
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; messageId: string } | null>(null);
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Partial<Record<ChatAttachmentFeedType, HTMLButtonElement | null>>>({});

  const load = async (kind: ChatAttachmentFeedType, append = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await messagesAPI.getChatAttachments(chatId, { type: kind, before: append ? cursorMap[kind] : null, limit: 30 });
      setMap((prev) => ({ ...prev, [kind]: append ? [...prev[kind], ...res.items] : res.items }));
      setCursorMap((prev) => ({ ...prev, [kind]: res.nextCursor }));
      setHasMoreMap((prev) => ({ ...prev, [kind]: res.hasMore }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(activeTab, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, chatId]);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeTab]);

  const grouped = useMemo(() => {
    const items = map[activeTab] || [];
    const g: Record<string, ChatAttachmentFeedItem[]> = {};
    for (const item of items) {
      const key = groupDateLabel(item.timestamp);
      if (!g[key]) g[key] = [];
      g[key].push(item);
    }
    return g;
  }, [activeTab, map]);

  const isImageTab = activeTab === "media" || activeTab === "videos";

  return (
    <>
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ChatAttachmentFeedType)} className="space-y-3">
      <div ref={tabsScrollRef} className="overflow-x-auto pb-1">
        <TabsList className="h-auto w-max min-w-full justify-start gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              ref={(node) => {
                tabRefs.current[tab] = node;
              }}
              className="group relative gap-1.5 rounded-xl px-3 py-2 text-xs text-white/70 data-[state=active]:text-white"
            >
              {activeTab === tab && (
                <motion.span
                  layoutId="chat-info-active-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl bg-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.22)]"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                {tabIcon[tab]} {t(`messages.chatInfo.${tab}`)}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value={activeTab}>
        {Object.keys(grouped).length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
            {t("messages.chatInfo.empty")}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="space-y-2">
                <p className="text-xs tracking-wide text-white/50">{date}</p>
                <div className={isImageTab ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "space-y-2"}>
                  {items.map((item) => (
                    <div
                      key={`${item.messageId}-${item.attachment?.id || item.link?.url || "x"}`}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 cursor-pointer"
                      onClick={() => onOpenInChat?.(item.messageId)}
                    >
                      <p className="mb-1 text-xs text-white/50">@{item.sender.username || item.sender.name || "user"}</p>
                      {(activeTab === "media" || activeTab === "videos") && item.attachment?.url ? (
                        <button
                          type="button"
                          className="block w-full"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (activeTab === "media") {
                              setPreviewImage({ url: item.attachment!.url, messageId: item.messageId });
                              setPreviewOpen(true);
                            }
                          }}
                        >
                          {activeTab === "videos" ? (
                            <video src={item.attachment.url} className="h-36 w-full rounded-xl object-cover" controls preload="metadata" />
                          ) : (
                            <img
                              src={item.attachment.url}
                              alt={item.attachment.mime || "media"}
                              className="h-36 w-full rounded-xl object-cover"
                              loading="lazy"
                            />
                          )}
                        </button>
                      ) : item.attachment?.url ? (
                        <button
                          type="button"
                          className="text-left text-sm text-white underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInChat?.(item.messageId);
                          }}
                        >
                          {item.attachment.mime || item.attachment.type}
                        </button>
                      ) : null}
                      {item.link?.url && (
                        <button
                          type="button"
                          className="text-left text-sm text-white underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInChat?.(item.messageId);
                          }}
                        >
                          {item.link.preview?.title || item.link.url}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {hasMoreMap[activeTab] && (
          <Button type="button" variant="outline" className="mt-4 h-11 w-full rounded-xl" onClick={() => void load(activeTab, true)} disabled={loading}>
            {loading ? t("messages.loading") : t("messages.chatInfo.loadMore")}
          </Button>
        )}
      </TabsContent>
    </Tabs>
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent className="max-w-3xl border-white/10 bg-[#0b0b0f] text-white">
        <DialogHeader>
          <DialogTitle>{t("messages.chatInfo.media")}</DialogTitle>
        </DialogHeader>
        {previewImage?.url ? (
          <div className="space-y-3">
            <img src={previewImage.url} alt="preview" className="max-h-[70vh] w-full rounded-2xl object-contain bg-black/30" />
            {onOpenInChat && (
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  setPreviewOpen(false);
                  onOpenInChat(previewImage.messageId);
                }}
              >
                {t("messages.chatInfo.openInChat")}
              </Button>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  );
}

