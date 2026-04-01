"use client";

import Image from "next/image";
import { Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./Button";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero.png"
          alt="Professional Photography Studio"
          fill
          className="object-cover opacity-60 scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Capture Life&apos;s <br />
              <span className="text-serif italic text-primary font-medium">Finest Moments.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 text-xl text-zinc-300 max-w-xl leading-relaxed"
          >
            Connect with world-class professional photographers for your weddings,
            corporate events, and personal portraits. Premium service, guaranteed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1 max-w-md group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Where is your event?"
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl h-14 pl-12 pr-6 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <Button size="lg" className="h-14 group">
              Find Photographers
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 flex items-center gap-6"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center overflow-hidden"
                >
                  <div className="w-full h-full bg-primary/20 animate-pulse" />
                </div>
              ))}
            </div>
            <div className="text-sm text-zinc-400">
              <span className="text-white font-semibold">500+</span> Top-rated
              photographers nearby
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative gradients */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />
    </section>
  );
}
