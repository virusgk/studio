'use client';

import { AddressForm } from '@/components/user/address-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Home, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Button } from '@/components/ui/button';


export default function AddressPage() {
  const { currentUser, loading, userAddress, fetchAddress, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/profile/address');
    } else if (!loading && currentUser && currentUser.uid !== 'admin-static-id') { // Don't fetch for static admin
      fetchAddress();
    }
    if (!loading && currentUser && currentUser.uid === 'admin-static-id' && isAdmin) {
        // Redirect static admin away
        router.push('/admin/dashboard');
    }
  }, [currentUser, loading, router, fetchAddress, isAdmin]);

  if (loading) {
    return <div className="text-center py-10">Loading address information...</div>;
  }

  if (!currentUser || (currentUser.uid === 'admin-static-id' && isAdmin)) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto my-10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You need to be logged in as a regular user to manage addresses.
          <Button asChild variant="link" className="p-0 h-auto ml-1"><Link href="/login?redirect=/profile/address">Login here.</Link></Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <Home className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-headline">Shipping Address</CardTitle>
          </div>
          <CardDescription className="font-body">
            Manage your primary shipping address. We currently support one address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddressForm initialData={userAddress} />
        </CardContent>
      </Card>
    </div>
  );
}
