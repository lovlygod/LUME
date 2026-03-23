import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";

type ImageGalleryProps = {
  images: string[];
  galleryId: string;
  onOpen: (index: number) => void;
};

const ImageGallery = ({ images, galleryId, onOpen }: ImageGalleryProps) => {
  const galleryImages = useMemo(() => images.filter(Boolean).slice(0, 5), [images]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (galleryImages.length <= 1) return;
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      container.scrollLeft += event.deltaY * 2.2;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [galleryImages.length]);

  if (galleryImages.length === 0) return null;

  if (galleryImages.length === 1) {
    return (
      <motion.button
        type="button"
        className="group relative w-full overflow-hidden rounded-[16px] bg-white/5"
        onClick={() => onOpen(0)}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.25 }}
      >
        <motion.img
          src={galleryImages[0]}
          alt="Post image"
          layoutId={`${galleryId}-image-0`}
          className="w-full h-auto max-h-[520px] rounded-[16px] object-cover"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.3 }}
        />
        <div className="pointer-events-none absolute inset-0 bg-black/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </motion.button>
    );
  }

  return (
    <div
      ref={containerRef}
      className="group flex gap-3 overflow-x-auto md:overflow-x-hidden md:hover:overflow-x-auto no-scrollbar scroll-smooth overscroll-x-contain"
    >
      {galleryImages.map((src, index) => (
        <motion.button
          key={`${src}-${index}`}
          type="button"
          onClick={() => onOpen(index)}
          className="relative flex h-[220px] min-w-[200px] flex-none overflow-hidden rounded-[16px] bg-white/5 md:h-[320px]"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.25 }}
        >
            <motion.img
              src={src}
              alt={`Post image ${index + 1}`}
              layoutId={`${galleryId}-image-${index}`}
              className="h-full w-auto min-w-full object-cover"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
            />
          <div className="pointer-events-none absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </motion.button>
      ))}
    </div>
  );
};

export default ImageGallery;
