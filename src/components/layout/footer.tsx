
'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AppFooter() {
  return (
    <footer className="bg-card text-card-foreground py-8 md:py-12 mt-auto border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-1 text-xl font-headline mb-2">
              <Sparkles className="h-7 w-7 text-primary" />
              <span className="text-foreground">Think</span>
              <span className="text-foreground">Stick</span>
              <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded">It</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your universe of creative and custom stickers.
            </p>
          </div>
          <div>
            <h3 className="text-md font-semibold text-foreground mb-3 font-headline">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary">About Us</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-primary">FAQ</Link></li>
              <li><Link href="/#catalog" className="text-muted-foreground hover:text-primary">Stickers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-md font-semibold text-foreground mb-3 font-headline">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ThinkStickIt. All rights reserved. Designed with <span className="text-primary">&hearts;</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
