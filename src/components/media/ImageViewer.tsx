import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { X } from 'lucide-react';

type ImageViewerProps = {
  activeImageId: string | null;
  src: string | null;
  onClose: () => void;
  onContextMenu?: (event: React.MouseEvent<HTMLImageElement>) => void;
  disableSave?: boolean;
  badgeText?: string | null;
};

type ImageThumbProps = Omit<HTMLMotionProps<'img'>, 'layoutId' | 'onClick' | 'src'> & {
  imageId: string;
  src: string;
  onOpen: (imageId: string, src: string) => void;
};

export const ImageThumb = ({ imageId, src, onOpen, className, ...props }: ImageThumbProps) => {
  return (
    <motion.img
      {...props}
      src={src}
      layoutId={`image-${imageId}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(imageId, src);
      }}
      className={`cursor-zoom-in ${className || ''}`}
    />
  );
};

export const ImageViewer = ({ activeImageId, src, onClose, onContextMenu, disableSave = false, badgeText }: ImageViewerProps) => {
  const isOpen = Boolean(activeImageId && src);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100]"
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
            className="relative z-[101] flex h-full w-full items-center justify-center p-6"
            onClick={onClose}
          >
            <motion.img
              layoutId={`image-${activeImageId}`}
              src={src || ''}
              alt="Preview"
              className="max-h-[88vh] max-w-[92vw] rounded-[18px] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              onClick={(event) => event.stopPropagation()}
              onContextMenu={onContextMenu}
              draggable={disableSave ? false : undefined}
            />
            {badgeText && (
              <div className="absolute left-6 top-6 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur-[10px]">
                {badgeText}
              </div>
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
      )}
    </AnimatePresence>
  );
};
