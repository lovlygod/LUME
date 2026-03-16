export interface Sticker {
  id: string;
  name?: string | null;
  filePath?: string | null;
  url?: string | null;
  packId?: string | null;
}

export interface StickerPack {
  id: string;
  name: string;
  description?: string | null;
  author?: string | null;
  createdAt?: string | null;
  stickerCount?: number;
}

export interface StickerPackWithStickers {
  pack: StickerPack;
  stickers: Sticker[];
}
