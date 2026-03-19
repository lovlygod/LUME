import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { stickersAPI } from "@/services/api";
import type { Sticker, StickerPack } from "@/types/stickers";
import StickerGrid from "@/components/stickers/StickerGrid";
import StickerModal from "@/components/stickers/StickerModal";
import { useLanguage } from "@/contexts/LanguageContext";

const AddStickerPackPage = () => {
  const { packSlug } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [pack, setPack] = useState<StickerPack | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSticker, setActiveSticker] = useState<Sticker | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const slug = packSlug || "";
    if (!slug) {
      navigate("/feed", { replace: true });
      return;
    }
    setLoading(true);
    stickersAPI
      .getPublicPackBySlug(slug)
      .then((res) => {
        setPack(res.pack || null);
        setStickers(res.stickers || []);
      })
      .catch(() => {
        toast.error(t("stickers.packLoadError"));
        navigate("/feed", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [packSlug, navigate, t]);

  const handleSelect = (sticker: Sticker) => {
    setActiveSticker(sticker);
    setModalOpen(true);
  };

  const handleAddPack = async () => {
    if (!pack?.id) return;
    try {
      await stickersAPI.addPack(pack.id);
      toast.success(t("stickers.packAdded"));
      navigate(`/messages?addStickerPack=${pack.id}`, { replace: true });
    } catch (_error) {
      toast.error(t("stickers.packAddError"));
    }
  };

  const description = useMemo(() => {
    if (pack?.description) return pack.description;
    return t("stickers.packDescriptionFallback");
  }, [pack?.description, t]);

  return (
    <div className="min-h-screen bg-black/95 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-2xl font-semibold">{pack?.name || t("stickers.packTitleFallback")}</h1>
          <p className="text-sm text-white/60">{description}</p>
        </div>

        {loading ? (
          <div className="text-sm text-white/60">{t("stickers.loading")}</div>
        ) : (
          <StickerGrid stickers={stickers} onSelect={handleSelect} />
        )}

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleAddPack}
            className="rounded-full bg-white/15 text-white py-2 px-6 text-sm font-semibold hover:bg-white/20 transition-smooth"
          >
            {t("stickers.addPack")}
          </button>
        </div>
      </div>

      <StickerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        sticker={activeSticker}
        pack={pack}
        onAddPack={handleAddPack}
      />
    </div>
  );
};

export default AddStickerPackPage;
