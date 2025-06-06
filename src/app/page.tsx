'use client'; // Keep client component if fetching data or interactivity needed

import { StickerGrid } from '@/components/stickers/sticker-grid';
import { MOCK_STICKERS } from '@/data/sticker-data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Sparkles } from 'lucide-react';

export default function HomePage() {
  // In a real app, you'd fetch stickers here, possibly server-side.
  const stickers = MOCK_STICKERS;

  return (
    <div className="space-y-12">
      <section className="text-center py-10 bg-gradient-to-r from-primary/10 via-background to-accent/10 rounded-lg shadow-lg">
        <h1 className="text-5xl font-headline mb-4 text-primary">
          Welcome to StickerVerse!
        </h1>
        <p className="text-xl text-foreground mb-8 max-w-2xl mx-auto">
          Discover unique stickers or create your own. Your imagination is the limit!
        </p>
        <div className="space-x-4">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/custom-sticker">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Your Own
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10">
            <Link href="#catalog">
              <Sparkles className="mr-2 h-5 w-5" /> Explore Catalog
            </Link>
          </Button>
        </div>
      </section>

      <section id="catalog">
        <h2 className="text-3xl font-headline mb-8 text-center text-primary-focus">
          Featured Stickers
        </h2>
        <StickerGrid stickers={stickers} />
      </section>
    </div>
  );
}
