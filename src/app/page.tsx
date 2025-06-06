
'use client'; 

import { StickerGrid } from '@/components/stickers/sticker-grid';
import { MOCK_STICKERS } from '@/data/sticker-data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Sparkles, Wand2, CheckCircle, Package, Zap } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const stickers = MOCK_STICKERS;

  return (
    <div className="space-y-16 md:space-y-24">
      <section 
        className="text-center py-16 md:py-24 rounded-lg shadow-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--card)) 50%, hsl(var(--background)) 100%)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 opacity-50"></div>
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline mb-6 text-foreground">
            Welcome to <span className="text-primary">Think Stick It</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Discover unique stickers or unleash your creativity with custom designs. High-quality, vibrant, and made just for you.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-transform hover:scale-105 w-full sm:w-auto">
              <Link href="/#catalog">
                Shop Stickers <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary shadow-lg transition-transform hover:scale-105 w-full sm:w-auto">
              <Link href="/custom-sticker">
                Create Your Own <Wand2 className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="featured-stickers" className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-headline mb-4 text-center text-foreground">
          Featured Stickers
        </h2>
        {stickers && stickers.length > 0 ? (
          <StickerGrid stickers={stickers.slice(0, 4)} /> 
        ) : (
          <p className="text-center text-muted-foreground py-8">No featured stickers available at the moment. Check back soon!</p>
        )}
        <div className="text-center mt-8">
          <Button asChild variant="link" className="text-primary hover:text-primary/80 text-lg">
            <Link href="/catalog"> {/* Assuming /catalog is the full catalog page */}
              View All Stickers <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
      
      <section id="design-perfect-sticker" className="py-16 md:py-24 bg-card rounded-lg shadow-xl">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="relative aspect-[600/400] w-full max-w-lg mx-auto rounded-lg overflow-hidden shadow-2xl">
            <Image
              src="https://placehold.co/600x400.png"
              alt="Design your perfect sticker"
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
              data-ai-hint="sticker design custom"
            />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-headline mb-6 text-foreground">
              Design Your <span className="text-primary">Perfect</span> Sticker
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Got an idea? Upload your artwork, and our AI-powered tool will help you ensure it's print-perfect.
            </p>
            <ul className="space-y-4 mb-10 text-left">
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 text-accent mr-3 mt-1 shrink-0" />
                <span><span className="font-semibold text-foreground">AI Quality Check</span> for optimal resolution.</span>
              </li>
              <li className="flex items-start">
                <Package className="h-6 w-6 text-accent mr-3 mt-1 shrink-0" />
                <span><span className="font-semibold text-foreground">Easy upload and preview</span> process.</span>
              </li>
              <li className="flex items-start">
                <Zap className="h-6 w-6 text-accent mr-3 mt-1 shrink-0" />
                <span><span className="font-semibold text-foreground">Durable materials, vibrant colors.</span></span>
              </li>
            </ul>
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg transition-transform hover:scale-105 w-full sm:w-auto">
              <Link href="/custom-sticker">
                Start Customizing <Wand2 className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Keep the original catalog section if it's separate from featured */}
      <section id="catalog" className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-headline mb-8 text-center text-foreground">
          Our Collection
        </h2>
        <StickerGrid stickers={stickers} />
      </section>
    </div>
  );
}
