'use client';

import { StickerIcon } from 'lucide-react';

export default function AppFooter() {
  return (
    <footer className="bg-card text-card-foreground py-6 mt-auto shadow-inner">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center mb-2">
          <StickerIcon className="h-6 w-6 mr-2 text-primary" />
          <p className="text-sm font-headline">StickerVerse &copy; {new Date().getFullYear()}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          All your sticker needs, in one universe!
        </p>
      </div>
    </footer>
  );
}
