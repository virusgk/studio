'use client';

import { CustomStickerForm } from '@/components/stickers/custom-sticker-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AlertCircle, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Button } from '@/components/ui/button';


export default function CustomStickerPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/custom-sticker');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!currentUser) {
    // This case should ideally be handled by the redirect, but as a fallback:
    return (
      <Alert variant="destructive" className="max-w-md mx-auto my-10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          You need to be logged in to create custom stickers. 
          <Button asChild variant="link" className="p-0 h-auto ml-1"><Link href="/login?redirect=/custom-sticker">Login here.</Link></Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wand2 size={32} />
          </div>
          <CardTitle className="text-3xl font-headline">Create Your Custom Sticker</CardTitle>
          <CardDescription className="font-body">
            Upload your design, choose your material, and let us bring your vision to life!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomStickerForm />
        </CardContent>
      </Card>
    </div>
  );
}
