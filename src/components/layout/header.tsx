'use client';

import Link from 'next/link';
import { FlameKindling, ShoppingCart, UserCircle2, LogIn, LogOut, Settings, LayoutDashboard, StickerIcon, PlusCircle } from 'lucide-react';
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
        <Link href="/" className="flex items-center gap-2 text-2xl font-headline text-primary hover:opacity-80 transition-opacity">
          <StickerIcon className="h-8 w-8" />
          StickerVerse
        </Link>
        <nav className="flex items-center space-x-4 md:space-x-6">
          <Link href="/" className="text-foreground hover:text-primary transition-colors font-medium">
            Catalog
          </Link>
          <Link href="/custom-sticker" className="text-foreground hover:text-primary transition-colors font-medium">
            Custom
          </Link>
          <Link href="/cart" className="relative text-foreground hover:text-primary transition-colors">
            <ShoppingCart className="h-6 w-6" />
            {/* Basic cart count example - replace with actual cart logic */}
            {/* <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span> */}
          </Link>
          
          {loading ? (
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
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
            <Button onClick={() => router.push('/login')} variant="ghost">
              <LogIn className="mr-2 h-5 w-5" /> Login
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
