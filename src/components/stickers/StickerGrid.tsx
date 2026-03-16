import { motion } from "framer-motion";
import type { Sticker } from "@/types/stickers";
import StickerCanvas from "@/components/stickers/StickerCanvas";

interface StickerGridProps {
  stickers: Sticker[];
  onSelect: (sticker: Sticker) => void;
}

const StickerGrid = ({ stickers, onSelect }: StickerGridProps) => {
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fit,88px)] gap-x-5 gap-y-3 justify-center">
      {stickers.map((sticker) => (
        <motion.button
          key={sticker.id}
          type="button"
          onClick={() => onSelect(sticker)}
          className="h-24 w-24 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <StickerCanvas
            src={sticker.url}
            size={96}
            className="h-24 w-24 object-contain select-none"
          />
        </motion.button>
      ))}
    </div>
  );
};

export default StickerGrid;
