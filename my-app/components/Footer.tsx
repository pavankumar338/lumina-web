"use client";

import Link from "next/link";
import { Camera, Instagram, Twitter, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="pt-24 pb-12 bg-black text-zinc-400 border-t border-zinc-900">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Info */}
          <div className="flex flex-col">
            <Link href="/" className="flex items-center gap-2 group mb-8">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                <Camera className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Menorify
              </span>
            </Link>
            <p className="text-lg leading-relaxed max-w-sm mb-10">
              Capturing the essence of every precious moment with our handpicked
              selection of the world&apos;s finest photographers.
            </p>
            <div className="flex items-center gap-5">
              <SocialIcon icon={Instagram} href="#" />
              <SocialIcon icon={Twitter} href="#" />
              <SocialIcon icon={Facebook} href="#" />
              <SocialIcon icon={Youtube} href="#" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-8 border-l-4 border-primary pl-4 uppercase tracking-widest">Platform</h4>
            <ul className="space-y-4 text-base">
              <li><FooterLink href="/explore">Browse Artists</FooterLink></li>
              <li><FooterLink href="/how-it-works">Booking Guide</FooterLink></li>
              <li><FooterLink href="/pricing">Premium Pricing</FooterLink></li>
              <li><FooterLink href="/become-partner">Join as Partner</FooterLink></li>
              <li><FooterLink href="/success-stories">Success Stories</FooterLink></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-lg font-bold text-white mb-8 border-l-4 border-primary pl-4 uppercase tracking-widest">Community</h4>
            <ul className="space-y-4 text-base">
              <li><FooterLink href="/about">Our Story</FooterLink></li>
              <li><FooterLink href="/careers">Career Opportunities</FooterLink></li>
              <li><FooterLink href="/blog">Luxury Blog</FooterLink></li>
              <li><FooterLink href="/events">Upcoming Events</FooterLink></li>
              <li><FooterLink href="/legal">Terms & Privacy</FooterLink></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold text-white mb-8 border-l-4 border-primary pl-4 uppercase tracking-widest">Get In Touch</h4>
            <ul className="space-y-6 text-base">
              <li className="flex items-start gap-4">
                <Mail className="mt-1 w-5 h-5 text-primary" />
                <div>
                  <div className="text-white font-bold mb-1">Email us at:</div>
                  <a href="mailto:concierge@menorify.com" className="hover:text-primary transition-colors">concierge@menorify.com</a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <Phone className="mt-1 w-5 h-5 text-primary" />
                <div>
                  <div className="text-white font-bold mb-1">Speak with us:</div>
                  <a href="tel:+1800MENORIFY" className="hover:text-primary transition-colors">+1-800-MENORIFY-CONCIERGE</a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <MapPin className="mt-1 w-5 h-5 text-primary" />
                <div>
                  <div className="text-white font-bold mb-1">Main Studio:</div>
                  <span>95 Luxury Ave, Penthouse A8,<br />Milan, IT 41012</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm tracking-wide">
            &copy; {currentYear} Menorify International Ltd. All rights reserved. 
            Crafted with passion for world-class artists.
          </p>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ icon: Icon, href }: { icon: any, href: string }) {
  return (
    <a 
      href={href} 
      className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all group scale-100 hover:scale-110 active:scale-95"
    >
      <Icon className="w-5 h-5" />
    </a>
  );
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link href={href} className="hover:text-primary transition-all flex items-center group">
      <span className="w-0 group-hover:w-4 h-0.5 bg-primary mr-0 group-hover:mr-2 transition-all" />
      {children}
    </Link>
  );
}
