import { useMemo, useState } from "react";
import ImageGallery from "@/components/feed/ImageGallery";
import ImageViewerModal from "@/components/feed/ImageViewerModal";

type FeedPostProps = {
  images: string[];
  galleryId: string;
};

const FeedPost = ({ images, galleryId }: FeedPostProps) => {
  const galleryImages = useMemo(() => images.filter(Boolean).slice(0, 5), [images]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="rounded-[20px] bg-white/4 p-2">
      <ImageGallery
        images={galleryImages}
        galleryId={galleryId}
        onOpen={(index) => setActiveIndex(index)}
      />
      <ImageViewerModal
        images={galleryImages}
        galleryId={galleryId}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onChange={(nextIndex) => setActiveIndex(nextIndex)}
      />
    </div>
  );
};

export default FeedPost;
