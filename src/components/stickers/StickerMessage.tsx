import { memo } from "react";
import { motion } from "framer-motion";
import type { Sticker } from "@/types/stickers";
import StickerCanvas from "@/components/stickers/StickerCanvas";

interface StickerMessageProps {
  sticker: Sticker | null | undefined;
  onOpen?: (sticker: Sticker) => void;
}

const StickerMessage = ({ sticker, onOpen }: StickerMessageProps) => {
  if (!sticker?.url) return null;

  return (
    <motion.button
      type="button"
      onClick={() => sticker && onOpen?.(sticker)}
      className="h-32 w-32 rounded-[20px] overflow-hidden bg-transparent border-0 shadow-none flex items-center justify-center"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <StickerCanvas
        src={sticker.url}
        size={128}
        className="h-32 w-32 object-contain select-none"
      />
    </motion.button>
  );
};

export default memo(StickerMessage);
