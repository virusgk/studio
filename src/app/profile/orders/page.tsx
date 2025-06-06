
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Order, OrderItem } from '@/types'; // Updated to include OrderItem
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Package, ShoppingBag, AlertCircle, PackageSearch } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import NextImage from 'next/image';

// Mock order data for this user
const MOCK_USER_ORDERS: Order[] = [
  { id: "ORD781", userId: "current-user-id", totalAmount: 15.99, shippingAddress: { name: "Current User", street: "123 My Street", city: "My City", state: "MS", zip: "12345", country: "USA" }, orderDate: new Date(Date.now() - 86400000 * 2).toISOString(), status: "delivered", items: [{id: "item-1-1", type: "sticker", stickerId: "sticker-001", name: "Cosmic Cat", price: 3.99, quantity: 2, imageUrl: "https://placehold.co/50x50.png?text=CC" } as OrderItem, { id: "item-1-2", type: "sticker", stickerId: "sticker-002", name: "Geometric Bear", price: 4.50, quantity: 1, imageUrl: "https://placehold.co/50x50.png?text=GB" } as OrderItem] },
  { id: "ORD782", userId: "current-user-id", totalAmount: 8.75, shippingAddress: { name: "Current User", street: "123 My Street", city: "My City", state: "MS", zip: "12345", country: "USA" }, orderDate: new Date(Date.now() - 86400000 * 5).toISOString(), status: "shipped", items: [{id: "item-2-1", type: "sticker", stickerId: "sticker-005", name: "Retro Gamer", price: 3.75, quantity: 1, imageUrl: "https://placehold.co/50x50.png?text=RG" } as OrderItem, { id: "item-2-2", type: "custom", name: "My Special Design", price: 5.00, quantity: 1, originalImageUrl: "https://placehold.co/50x50.png?text=SD", material: "holographic", imageUrl: "https://placehold.co/50x50.png?text=SD"} as OrderItem] },
];


export default function UserOrdersPage() {
  const { currentUser, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/profile/orders');
    } else if (!loading && currentUser && currentUser.uid !== 'admin-static-id') {
      setOrders(MOCK_USER_ORDERS.filter(o => o.userId === "current-user-id")); 
    }
    if (!loading && currentUser && currentUser.uid === 'admin-static-id' && isAdmin) {
        router.push('/admin/dashboard');
    }
  }, [currentUser, loading, router, isAdmin]);

  if (loading) {
    return <div className="text-center py-10">Loading your orders...</div>;
  }

  if (!currentUser || (currentUser.uid === 'admin-static-id' && isAdmin)) {
     return (
      <Alert variant="destructive" className="max-w-md mx-auto my-10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You need to be logged in to view your orders.
          <Button asChild variant="link" className="p-0 h-auto ml-1 text-destructive-foreground hover:underline"><Link href="/login?redirect=/profile/orders">Login here.</Link></Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'processing': return 'secondary';
      case 'shipped': return 'default'; // Consider a blue-ish variant from theme
      case 'delivered': return 'default'; // Consider a green-ish variant from theme
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 text-foreground">
      <Card className="shadow-xl bg-card border-border">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <Package className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline text-foreground">My Orders</CardTitle>
          </div>
          <CardDescription className="font-body text-muted-foreground">
            Review your past and current orders with Think Stick It.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-2 space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-border/50 rounded-lg">
              <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground font-headline">No Orders Yet</p>
              <p className="text-muted-foreground mb-6 font-body">You haven't placed any orders. Time to get some stickers!</p>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/">
                  <ShoppingBag className="mr-2 h-5 w-5" /> Start Shopping
                </Link>
              </Button>
            </div>
          ) : (
            orders.map(order => (
              <Card key={order.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-background border-border/50">
                <CardHeader className="flex flex-row justify-between items-start bg-muted/30 p-4">
                  <div>
                    <CardTitle className="text-lg font-headline text-foreground">Order #{order.id}</CardTitle>
                    <CardDescription className="text-xs font-body text-muted-foreground">Placed on: {new Date(order.orderDate).toLocaleDateString()}</CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize text-sm px-3 py-1">
                    {order.status}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-3">
                    <h4 className="font-semibold font-body text-sm mb-2 text-foreground">Items:</h4>
                    <ul className="space-y-2">
                      {order.items.map(item => (
                        <li key={item.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                          {item.imageUrl && (
                             <div className="relative w-10 h-10 rounded-md overflow-hidden border border-muted bg-muted shrink-0">
                                <NextImage src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" />
                             </div>
                          )}
                          <span>{item.name} (x{item.quantity}) - ${item.price.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border/50">
                    <p className="font-semibold font-body text-foreground">Total: <span className="text-primary">${order.totalAmount.toFixed(2)}</span></p>
                    <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
