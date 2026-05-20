import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type ImageViewerModalProps = {
  images: string[];
  galleryId: string;
  activeIndex: number | null;
  onClose: () => void;
  onChange: (nextIndex: number) => void;
};

const swipeConfidenceThreshold = 80;

const ImageViewerModal = ({ images, galleryId, activeIndex, onClose, onChange }: ImageViewerModalProps) => {
  const isOpen = activeIndex !== null && images.length > 0;
  const safeIndex = activeIndex ?? 0;
  const canGoPrev = safeIndex > 0;
  const canGoNext = safeIndex < images.length - 1;
  const imageSrc = images[safeIndex];
  const startXRef = useRef<number | null>(null);

  const [direction, setDirection] = useState<"left" | "right">("right");

  const handlePrev = () => {
    if (!canGoPrev) return;
    setDirection("left");
    onChange(safeIndex - 1);
  };

  const handleNext = () => {
    if (!canGoNext) return;
    setDirection("right");
    onChange(safeIndex + 1);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startXRef.current = event.clientX;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) return;
    const delta = event.clientX - startXRef.current;
    if (Math.abs(delta) > swipeConfidenceThreshold) {
      if (delta > 0) handlePrev();
      if (delta < 0) handleNext();
    }
    startXRef.current = null;
  };

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") handlePrev();
      if (event.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, safeIndex, images.length]);

  const slideDirection = useMemo(() => ({ left: -120, right: 120 }), []);

  if (!isOpen || !imageSrc) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[120]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <div
          className="relative z-[121] flex h-full w-full items-center justify-center p-6"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onClick={onClose}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={imageSrc}
              src={imageSrc}
              alt="Preview"
              layoutId={`${galleryId}-image-${safeIndex}`}
              className="max-h-[88vh] max-w-[92vw] rounded-[18px] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
              initial={{ opacity: 0, scale: 0.95, x: direction === "left" ? slideDirection.left : slideDirection.right }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.96, x: direction === "left" ? slideDirection.right : slideDirection.left }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              onClick={(event) => event.stopPropagation()}
            />
          </AnimatePresence>

          {canGoPrev && (
            <button
              type="button"
              className="absolute left-6 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-[10px] transition-smooth hover:bg-white/20"
              onClick={(event) => {
                event.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {canGoNext && (
            <button
              type="button"
              className="absolute right-6 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-[10px] transition-smooth hover:bg-white/20"
              onClick={(event) => {
                event.stopPropagation();
                handleNext();
              }}
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <button
            type="button"
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-[10px] transition-smooth hover:bg-white/20"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default ImageViewerModal;
