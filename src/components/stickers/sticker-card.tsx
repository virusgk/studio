
'use client';

import NextImage from 'next/image';
import type { Sticker } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye, Image as ImageIconPlaceholder } from 'lucide-react'; // Added ImageIconPlaceholder
import Link from 'next/link';

interface StickerCardProps {
  sticker: Sticker;
}

export function StickerCard({ sticker }: StickerCardProps) {
  const isOutOfStock = sticker.stock !== undefined && sticker.stock <= 0;
  const primaryImageUrl = sticker.imageUrls && sticker.imageUrls.length > 0 ? sticker.imageUrls[0] : 'https://placehold.co/300x300.png?text=No+Image';

  return (
    <Card className="flex flex-col overflow-hidden h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02] bg-card">
      <CardHeader className="p-0 relative">
        <Link href={`/sticker/${sticker.id}`} passHref>
          <div className="aspect-square w-full relative overflow-hidden group cursor-pointer bg-muted">
            {primaryImageUrl !== 'https://placehold.co/300x300.png?text=No+Image' ? (
              <NextImage
                src={primaryImageUrl}
                alt={sticker.name}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 group-hover:scale-110"
                data-ai-hint={`${sticker.category || ''} ${sticker.tags?.[0] || ''}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIconPlaceholder className="w-1/2 h-1/2 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Eye className="h-10 w-10 text-white" />
            </div>
          </div>
        </Link>
        {isOutOfStock && (
          <Badge variant="destructive" className="absolute top-2 right-2">Out of Stock</Badge>
        )}
         {!isOutOfStock && sticker.stock !== undefined && sticker.stock < 10 && (
          <Badge variant="secondary" className="absolute top-2 right-2">Low Stock</Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl mb-1 font-headline group-hover:text-primary transition-colors text-foreground">
          <Link href={`/sticker/${sticker.id}`} className="hover:underline">
            {sticker.name}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2 h-10 overflow-hidden line-clamp-2">
          {sticker.description}
        </CardDescription>
        <div className="flex flex-wrap gap-1 mt-2">
          {sticker.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center border-t border-border/50 mt-auto">
        <p className="text-lg font-headline text-primary">${sticker.price.toFixed(2)}</p>
        <Button size="sm" variant={isOutOfStock ? "outline" : "default"} disabled={isOutOfStock} className="bg-primary text-primary-foreground hover:bg-primary/80">
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}
