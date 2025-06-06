
'use client';

import Link from 'next/link';
import { ShoppingCart, UserCircle2, LogIn, LogOut, Settings, LayoutDashboard, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from 'next/navigation';

export default function AppHeader() {
  const { currentUser, isAdmin, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  const getAvatarFallback = (displayName?: string | null, email?: string | null) => {
    if (displayName) return displayName.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  }

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-1 text-2xl font-headline hover:opacity-80 transition-opacity">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-foreground">Think</span>
          <span className="text-foreground">Stick</span>
          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-md">It</span>
        </Link>
        <nav className="flex items-center space-x-3 md:space-x-4">
          <Button variant="ghost" asChild className="text-sm text-foreground hover:text-primary">
            <Link href="/">Home</Link>
          </Button>
          <Button variant="ghost" asChild className="text-sm text-foreground hover:text-primary">
            <Link href="/#catalog">Stickers</Link>
          </Button>
          <Button variant="ghost" asChild className="text-sm text-foreground hover:text-primary">
            <Link href="/custom-sticker">Custom Design</Link>
          </Button>
          
          <Button variant="ghost" size="icon" asChild className="relative text-foreground hover:text-primary transition-colors">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Cart</span>
            </Link>
          </Button>
          
          {loading ? (
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || 'User'} />
                    <AvatarFallback>{getAvatarFallback(currentUser.displayName, currentUser.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none font-headline">
                      {currentUser.displayName || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/admin/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                 <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <UserCircle2 className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/profile/address')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Address
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/profile/orders')}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => router.push('/login')} variant="outline" size="sm" className="text-sm">
              <LogIn className="mr-1.5 h-4 w-4" /> Login
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
