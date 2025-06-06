
'use client';

import { useState, useEffect } from 'react';
import type { CartItem, Sticker } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import NextImage from 'next/image'; // Renamed to avoid conflict with Lucide Icon
import { Trash2, ShoppingBag, Sparkles, AlertCircle, Image as ImageIconPlaceholder } from 'lucide-react';
import { recommendStickers, type RecommendStickersOutput } from '@/ai/flows/recommend-stickers';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock cart data for now
const MOCK_CART_ITEMS: CartItem[] = [
  { 
    id: 'sticker-001', 
    type: 'sticker',
    stickerId: 'sticker-001',
    name: 'Cosmic Cat', 
    price: 3.99, 
    quantity: 2, 
    imageUrl: 'https://placehold.co/100x100.png?text=Cosmic+Cat', 
  },
  { 
    id: 'custom-xyz', 
    type: 'custom',
    name: 'My Custom Design', 
    price: 5.00, 
    quantity: 1, 
    originalImageUrl: 'https://placehold.co/100x100.png?text=Custom', 
    imageUrl: 'https://placehold.co/100x100.png?text=Custom', // Added for consistency
    material: 'vinyl-glossy',
  },
];


export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(MOCK_CART_ITEMS);
  const [recommendations, setRecommendations] = useState<RecommendStickersOutput['recommendations'] | null>(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && !currentUser) {
      // Optionally redirect to login if cart requires auth
      // router.push('/login?redirect=/cart');
    }
  }, [currentUser, loading]);


  useEffect(() => {
    const fetchRecommendations = async () => {
      if (cartItems.length > 0) {
        setIsLoadingRecs(true);
        try {
          const cartItemNames = cartItems.map(item => item.name);
          const result = await recommendStickers({ cartItems: cartItemNames });
          setRecommendations(result.recommendations);
        } catch (error) {
          console.error("Error fetching recommendations:", error);
          setRecommendations([]); 
        } finally {
          setIsLoadingRecs(false);
        }
      } else {
        setRecommendations(null);
      }
    };

    fetchRecommendations();
  }, [cartItems]);

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems(prevItems => 
      prevItems.map(item => item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item)
      .filter(item => item.quantity > 0) 
    );
  };

  const removeItem = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
      return <div className="text-center py-10">Loading cart...</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-8 text-foreground">
      <Card className="shadow-xl bg-card border-border">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline text-foreground">Your Shopping Cart</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {cartItems.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground font-headline">Your cart is empty.</p>
              <p className="text-muted-foreground mb-6 font-body">Looks like you haven't added any stickers yet!</p>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/">
                  Explore Catalog
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border border-border/50 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-background">
                  <div className="relative w-20 h-20 rounded-md overflow-hidden border border-muted bg-muted">
                    {item.imageUrl ? (
                        <NextImage 
                        src={item.imageUrl} 
                        alt={item.name} 
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint="sticker product"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIconPlaceholder className="w-10 h-10 text-muted-foreground" />
                        </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold font-headline text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">Price: ${item.price.toFixed(2)}</p>
                    {item.type === 'custom' && <p className="text-xs text-muted-foreground">Material: {(item as any).material}</p>}
                  </div>
                  <div className="flex items-center gap-2 w-24">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      min="1"
                      className="h-9 w-16 text-center bg-input text-foreground border-border"
                    />
                  </div>
                  <p className="w-20 text-right font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} aria-label="Remove item">
                    <Trash2 className="h-5 w-5 text-destructive hover:text-destructive/80" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {cartItems.length > 0 && (
          <CardFooter className="flex flex-col items-stretch gap-4 pt-6 border-t border-border/50">
            <div className="flex justify-between text-xl font-semibold font-headline text-foreground">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={!currentUser}>
              {currentUser ? 'Proceed to Checkout' : 'Login to Checkout'}
            </Button>
             {!currentUser && (
                <p className="text-sm text-center text-muted-foreground">
                    Please <Link href="/login?redirect=/cart" className="underline text-primary hover:text-primary/80">login</Link> to proceed.
                </p>
            )}
          </CardFooter>
        )}
      </Card>

      {isLoadingRecs && (
        <div className="mt-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 animate-pulse text-primary mb-2" />
          <p className="text-muted-foreground font-headline">Loading recommendations...</p>
        </div>
      )}

      {recommendations && recommendations.length > 0 && !isLoadingRecs && (
        <Card className="mt-8 shadow-lg bg-card border-border">
          <CardHeader>
             <div className="flex items-center space-x-3 mb-1">
                <Sparkles className="h-6 w-6 text-accent" />
                <CardTitle className="text-2xl font-headline text-foreground">You Might Also Like</CardTitle>
             </div>
             <CardDescription className="text-muted-foreground">AI-powered recommendations based on your cart!</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {recommendations.map((rec, index) => (
              <Card key={index} className="p-3 text-center hover:shadow-md transition-shadow bg-background border-border/50">
                <div className="relative w-[100px] h-[100px] mx-auto mb-2 rounded-md overflow-hidden border border-muted bg-muted">
                <NextImage 
                    src={`https://placehold.co/100x100.png?text=${encodeURIComponent(rec.substring(0,12))}`}
                    alt={rec}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="sticker design"
                />
                </div>
                <p className="text-sm font-medium text-foreground">{rec}</p>
                <Button variant="outline" size="sm" className="mt-2 text-xs border-primary text-primary hover:bg-primary/10">View</Button>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
      {recommendations && recommendations.length === 0 && !isLoadingRecs && cartItems.length > 0 &&(
         <Alert className="mt-8 bg-card border-border text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="font-headline text-foreground">No Specific Recommendations Right Now</AlertTitle>
            <AlertDescription className="text-muted-foreground">
                We couldn't find specific recommendations for your current cart, but feel free to browse our <Link href="/" className="underline hover:text-primary">full catalog</Link>!
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
