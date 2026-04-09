"use client";

import Link from "next/link";
import { Camera, Search, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border py-3"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
            <Camera className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Menorify
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/explore" className="text-sm font-medium hover:text-primary transition-colors">
            Explore
          </Link>
          <Link href="/how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            How it works
          </Link>
          <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
            Pricing
          </Link>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          {isDashboard ? (
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-sm font-semibold italic border border-border px-6 py-2.5 rounded-xl hover:bg-muted transition-all"
              >
                Sign Out
              </Link>
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                <User className="w-5 h-5 text-primary" />
              </div>
            </div>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-sm font-semibold italic border border-border px-6 py-2.5 rounded-xl hover:bg-muted transition-all active:scale-95"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="text-sm font-black italic px-7 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 tracking-widest uppercase active:scale-95"
              >
                Join Menorify
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-6 shadow-xl animate-in slide-in-from-top duration-300">
          <Link href="/explore" className="text-lg font-medium">Explore</Link>
          <Link href="/how-it-works" className="text-lg font-medium">How it works</Link>
          <Link href="/pricing" className="text-lg font-medium">Pricing</Link>
          <hr className="border-border/50" />
          <Link href="/login" className="text-xl font-black italic tracking-tight">Sign In</Link>
          <Link 
            href="/signup" 
            className="text-xl font-black italic px-6 py-4 bg-primary text-primary-foreground rounded-2xl text-center shadow-xl shadow-primary/10 tracking-widest uppercase"
          >
            Join Menorify
          </Link>
        </div>
      )}
    </nav>
  );
}
