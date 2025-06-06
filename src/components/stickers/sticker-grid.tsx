'use client';

import type { Sticker } from '@/types';
import { StickerCard } from './sticker-card';

interface StickerGridProps {
  stickers: Sticker[];
}

export function StickerGrid({ stickers }: StickerGridProps) {
  if (!stickers || stickers.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No stickers found. Check back soon!</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {stickers.map((sticker) => (
        <StickerCard key={sticker.id} sticker={sticker} />
      ))}
    </div>
  );
}
