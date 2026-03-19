import { useEffect, useState } from "react";
import { stickersAPI } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import StickerGrid from "@/components/stickers/StickerGrid";
import type { Sticker } from "@/types/stickers";

type BotSticker = {
  name: string;
  url?: string | null;
};

interface StickerBotPanelProps {
  onUploaded?: () => void;
}

const StickerBotPanel = ({ onUploaded }: StickerBotPanelProps) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<{
    step: string;
    packName: string | null;
    stickers: BotSticker[];
    limits: { maxStickers: number; maxFileSize: number };
  } | null>(null);

  const loadSession = async () => {
    setLoading(true);
    try {
      const res = await stickersAPI.getBotSession();
      setSession(res);
    } catch (_error) {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setLoading(true);
    try {
      await stickersAPI.uploadBotStickers(files);
      await loadSession();
      onUploaded?.();
    } finally {
      setLoading(false);
    }
  };

  const stickers: Sticker[] = (session?.stickers || []).map((item, index) => ({
    id: `${index}`,
    name: item.name,
    url: item.url || null,
  }));

  return (
    <div className="rounded-[16px] border border-white/10 bg-white/5 p-4 mt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Sticker Bot</div>
          <div className="text-xs text-white/60">
            {session?.packName ? `Pack: ${session.packName}` : "No pack in progress"}
          </div>
        </div>
        <label className="rounded-full bg-white/15 text-white py-2 px-4 text-xs font-semibold cursor-pointer hover:bg-white/20 transition-smooth">
          {t("stickers.upload")}
          <input
            type="file"
            accept="image/png,image/webp,image/gif"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
      <div className="mt-3 text-xs text-white/60">
        {loading ? t("stickers.loading") : `Uploaded: ${stickers.length}/${session?.limits.maxStickers || 60}`}
      </div>
      {stickers.length > 0 && (
        <div className="mt-4">
          <StickerGrid stickers={stickers} onSelect={() => null} />
        </div>
      )}
    </div>
  );
};

export default StickerBotPanel;
