import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StickerPackTabsProps {
  value: string;
  onValueChange: (value: string) => void;
}

const StickerPackTabs = ({ value, onValueChange }: StickerPackTabsProps) => {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList className="bg-white/5 border border-white/10">
        <TabsTrigger value="mine">My Stickers</TabsTrigger>
        <TabsTrigger value="lume">LUME Stickers</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default StickerPackTabs;
