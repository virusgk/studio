
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { useAuth } from '@/contexts/auth-context';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FlameKindling, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { currentUser, isAdmin, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); // To get redirect query param

  useEffect(() => {
    if (!loading && currentUser) {
      const redirectParam = searchParams.get('redirect');
      let redirectTo = '/';

      if (isAdmin) {
        console.log("LOGIN_PAGE: Admin user already logged in.");
        redirectTo = (redirectParam && redirectParam.startsWith('/admin')) ? redirectParam : '/admin/dashboard';
      } else {
        console.log("LOGIN_PAGE: Regular user already logged in.");
        redirectTo = (redirectParam && !redirectParam.startsWith('/admin') && redirectParam !== '/login') ? redirectParam : '/profile';
      }
      console.log(`LOGIN_PAGE: Redirecting logged-in user to ${redirectTo}`);
      router.push(redirectTo);
    }
  }, [currentUser, isAdmin, loading, router, searchParams]);

  if (loading || (!loading && currentUser)) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FlameKindling size={32} />
          </div>
          <CardTitle className="text-3xl font-headline">Welcome to StickerVerse!</CardTitle>
          <CardDescription className="font-body">Sign in to continue or manage your sticker empire.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-3 text-center font-headline text-lg text-primary">User Login</h3>
            <GoogleSignInButton />
          </div>
          <div className="relative my-6">
            <Separator />
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-center font-headline text-lg text-primary">Admin Login</h3>
            <AdminLoginForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

