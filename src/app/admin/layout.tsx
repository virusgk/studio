
'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, Users as UsersIcon, Settings, LogOut, StickerIcon } from 'lucide-react'; // Renamed Users to UsersIcon
import { useAuth } from '@/contexts/auth-context';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const adminNavItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/admin/inventory', icon: Package },
  { name: 'Users', href: '/admin/users', icon: UsersIcon }, 
  { name: 'Orders', href: '/admin/orders', icon: Package }, 
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAdmin, loading, currentUser, logout } = useAuth();
  const router = useRouter();

  console.log(`ADMIN_LAYOUT: Rendering. Path: ${pathname}. Auth state - loading: ${loading}, isAdmin: ${isAdmin}, currentUser: ${currentUser?.email}`);

  useEffect(() => {
    console.log(`ADMIN_LAYOUT: useEffect triggered. Path: ${pathname}. Auth state - loading: ${loading}, isAdmin: ${isAdmin}`);
    if (!loading && !isAdmin) {
      console.log(`ADMIN_LAYOUT: Access DENIED by useEffect. Redirecting to login. loading: ${loading}, isAdmin: ${isAdmin}`);
      router.push('/login?redirect=' + pathname);
    } else if (!loading && isAdmin) {
      console.log(`ADMIN_LAYOUT: Access GRANTED by useEffect. loading: ${loading}, isAdmin: ${isAdmin}`);
    } else {
      console.log(`ADMIN_LAYOUT: useEffect - still loading or indeterminate state. loading: ${loading}, isAdmin: ${isAdmin}`);
    }
  }, [isAdmin, loading, router, pathname, currentUser]); // Added currentUser to deps for more complete re-evaluation

  if (loading) {
    console.log("ADMIN_LAYOUT: Showing 'Loading Admin Area...' screen.");
    return <div className="flex h-screen items-center justify-center">Loading Admin Area...</div>;
  }

  if (!isAdmin) {
     console.log(`ADMIN_LAYOUT: Showing 'Access Denied' screen. loading: ${loading}, isAdmin: ${isAdmin}, currentUser: ${currentUser?.email}`);
     return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You ({currentUser?.email || 'guest'}) do not have permission to access this area. Please
            <Button asChild variant="link" className="p-0 h-auto ml-1"><Link href="/login">login as an admin</Link></Button>.
             Current auth state: loading={String(loading)}, isAdmin={String(isAdmin)}.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  console.log("ADMIN_LAYOUT: Access GRANTED. Rendering admin content.");
  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-card sm:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-headline text-lg font-semibold text-primary">
            <StickerIcon className="h-6 w-6" />
            <span>StickerVerse Admin</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <ul className="grid items-start px-4 text-sm font-medium">
            {adminNavItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:bg-primary/10 hover:text-primary',
                    pathname === item.href || (item.name === "Inventory" && pathname.startsWith("/admin/inventory")) || (item.name === "Users" && pathname.startsWith("/admin/users")) ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto p-4 border-t">
            <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
        </div>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-72 flex-1"> {/* Ensure pl matches aside width */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          {/* Mobile Nav Trigger could go here */}
          <h1 className="text-xl font-semibold font-headline">
            {adminNavItems.find(item => pathname.startsWith(item.href))?.name || 
             (pathname.startsWith('/admin/inventory') ? 'Inventory' : 
             (pathname.startsWith('/admin/users') ? 'Users' : 'Admin'))
            }
          </h1>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 bg-background rounded-lg shadow-inner overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
