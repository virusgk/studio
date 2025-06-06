'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { ChromeIcon } from 'lucide-react'; // Using ChromeIcon as a stand-in for Google G

export function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth();

  return (
    <Button onClick={signInWithGoogle} className="w-full" variant="outline">
      <ChromeIcon className="mr-2 h-5 w-5" />
      Sign in with Google
    </Button>
  );
}
