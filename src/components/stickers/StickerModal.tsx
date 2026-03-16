import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { StickerPack, Sticker } from "@/types/stickers";
import StickerCanvas from "@/components/stickers/StickerCanvas";

interface StickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sticker: Sticker | null;
  pack: StickerPack | null;
  onAddPack: () => void;
}

const StickerModal = ({ open, onOpenChange, sticker, pack, onAddPack }: StickerModalProps) => {
  if (!sticker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{pack?.name || "Sticker pack"}</DialogTitle>
          <DialogDescription className="text-white/60">
            {pack?.description || "Add this sticker pack to your collection."}
          </DialogDescription>
        </DialogHeader>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-56 w-56 rounded-[28px] border border-white/10 bg-white/5 flex items-center justify-center">
            <StickerCanvas
              src={sticker.url}
              size={192}
              className="h-48 w-48 object-contain select-none"
            />
          </div>
          <button
            type="button"
            onClick={onAddPack}
            className="w-full rounded-full bg-white/15 text-white py-2 text-sm font-semibold hover:bg-white/20 transition-smooth"
          >
            Add Sticker Pack
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default StickerModal;
