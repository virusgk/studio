'use client';

import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FlameKindling } from 'lucide-react'; // Or StickerIcon if preferred

export default function LoginPage() {
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
