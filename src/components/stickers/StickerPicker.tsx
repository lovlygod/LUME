import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Sticker, StickerPack } from "@/types/stickers";
import StickerGrid from "@/components/stickers/StickerGrid";
import StickerPackTabs from "@/components/stickers/StickerPackTabs";

interface StickerPickerProps {
  isOpen: boolean;
  activePackId: string | null;
  myPacks: StickerPack[];
  lumePacks: StickerPack[];
  stickersByPack: Record<string, Sticker[]>;
  onSelect: (sticker: Sticker) => void;
  onPickPack: (packId: string) => void;
  onBrowsePacks: () => void;
}

const StickerPicker = ({
  isOpen,
  activePackId,
  myPacks,
  lumePacks,
  stickersByPack,
  onSelect,
  onPickPack,
  onBrowsePacks,
}: StickerPickerProps) => {
  const [tab, setTab] = useState("mine");

  const packs = tab === "mine" ? myPacks : lumePacks;
  const resolvedPackId = activePackId || packs[0]?.id || null;
  const stickers = useMemo(() => {
    if (!resolvedPackId) return [];
    return stickersByPack[resolvedPackId] || [];
  }, [resolvedPackId, stickersByPack]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full mb-3 left-0 right-0 rounded-[24px] border border-white/10 bg-black/85 backdrop-blur-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <StickerPackTabs value={tab} onValueChange={setTab} />
            {packs.length > 0 && (
              <select
                value={resolvedPackId || ""}
                onChange={(event) => onPickPack(event.target.value)}
                className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/80"
              >
                {packs.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {tab === "mine" && packs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-white/70">No stickers yet</p>
              <button
                type="button"
                onClick={onBrowsePacks}
                className="mt-3 text-xs text-white/80 underline"
              >
                Browse sticker packs
              </button>
            </div>
          ) : (
            <StickerGrid stickers={stickers} onSelect={onSelect} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickerPicker;
