import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";

interface StickerPackTabsProps {
  value: string;
  onValueChange: (value: string) => void;
}

const StickerPackTabs = ({ value, onValueChange }: StickerPackTabsProps) => {
  const { t } = useLanguage();
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList className="bg-white/5 border border-white/10">
        <TabsTrigger value="mine">{t("stickers.myStickers")}</TabsTrigger>
        <TabsTrigger value="lume">{t("stickers.lumeStickers")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default StickerPackTabs;
