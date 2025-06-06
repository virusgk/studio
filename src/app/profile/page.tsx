'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit3, Home, Package, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProfilePage() {
  const { currentUser, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/profile');
    }
    if (!loading && currentUser && currentUser.uid === 'admin-static-id' && isAdmin) {
        // Redirect static admin away from user profile to admin dashboard
        router.push('/admin/dashboard');
    }
  }, [currentUser, loading, router, isAdmin]);

  if (loading) {
    return <div className="text-center py-10">Loading profile...</div>;
  }

  if (!currentUser || (currentUser.uid === 'admin-static-id' && isAdmin)) {
     return (
      <Alert variant="destructive" className="max-w-md mx-auto my-10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You need to be logged in as a regular user to view this page.
          <Button asChild variant="link" className="p-0 h-auto ml-1"><Link href="/login?redirect=/profile">Login here.</Link></Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  const getAvatarFallback = (displayName?: string | null, email?: string | null) => {
    if (displayName) return displayName.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || 'User'} />
            <AvatarFallback className="text-3xl font-headline">
              {getAvatarFallback(currentUser.displayName, currentUser.email)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-headline">{currentUser.displayName || 'Valued Customer'}</CardTitle>
          <CardDescription className="font-body">{currentUser.email}</CardDescription>
        </CardHeader>
        <CardContent className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/profile/address">
                <Home className="mr-2 h-5 w-5" /> Manage Address
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/profile/orders">
                <Package className="mr-2 h-5 w-5" /> View Orders
              </Link>
            </Button>
          </div>
          {/* Add more profile sections or settings here */}
           <div className="pt-4 border-t">
            <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile (Coming Soon)
            </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
