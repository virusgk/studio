'use client';

import Image from 'next/image';
import type { Sticker } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye } from 'lucide-react';
import Link from 'next/link';

interface StickerCardProps {
  sticker: Sticker;
}

export function StickerCard({ sticker }: StickerCardProps) {
  const isOutOfStock = sticker.stock !== undefined && sticker.stock <= 0;

  return (
    <Card className="flex flex-col overflow-hidden h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]">
      <CardHeader className="p-0 relative">
        <Link href={`/sticker/${sticker.id}`} passHref>
          <div className="aspect-square w-full relative overflow-hidden group cursor-pointer">
            <Image
              src={sticker.imageUrl}
              alt={sticker.name}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-110"
              data-ai-hint={`${sticker.category || ''} ${sticker.tags?.[0] || ''}`}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Eye className="h-10 w-10 text-white" />
            </div>
          </div>
        </Link>
        {isOutOfStock && (
          <Badge variant="destructive" className="absolute top-2 right-2">Out of Stock</Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl mb-1 font-headline group-hover:text-primary transition-colors">
          <Link href={`/sticker/${sticker.id}`} className="hover:underline">
            {sticker.name}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2 h-12 overflow-hidden">
          {sticker.description}
        </CardDescription>
        <div className="flex flex-wrap gap-1 mt-2">
          {sticker.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-lg font-headline text-primary">${sticker.price.toFixed(2)}</p>
        <Button size="sm" variant={isOutOfStock ? "outline" : "default"} disabled={isOutOfStock}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}
