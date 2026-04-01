"use client";

import { motion } from "framer-motion";
import { 
  Heart, 
  Camera, 
  Briefcase, 
  Building2, 
  Music, 
  Clapperboard, 
  Plane, 
  Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { id: "weddings", name: "Weddings", icon: Heart, count: "120+", color: "bg-pink-500/10 text-pink-500" },
  { id: "portraits", name: "Portraits", icon: Camera, count: "95+", color: "bg-blue-500/10 text-blue-500" },
  { id: "corporate", name: "Corporate", icon: Briefcase, count: "80+", color: "bg-indigo-500/10 text-indigo-500" },
  { id: "real-estate", name: "Real Estate", icon: Building2, count: "65+", color: "bg-emerald-500/10 text-emerald-500" },
  { id: "events", name: "Events", icon: Music, count: "110+", color: "bg-purple-500/10 text-purple-500" },
  { id: "lifestyle", name: "Lifestyle", icon: Sparkles, count: "75+", color: "bg-amber-500/10 text-amber-500" },
  { id: "commercial", name: "Commercial", icon: Clapperboard, count: "55+", color: "bg-red-500/10 text-red-500" },
  { id: "travel", name: "Travel", icon: Plane, count: "40+", color: "bg-cyan-500/10 text-cyan-500" },
];

export function Categories() {
  return (
    <section className="py-24 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Popular Photographer <span className="text-serif italic text-primary">Specialties</span>
          </h2>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Find specialized professionals perfectly matches to your occasion.
            Choose from a diverse range of photography experts.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="group cursor-pointer p-8 rounded-3xl border border-border bg-card dark:hover:bg-zinc-900 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5"
            >
              <div className={cn(
                "w-14 h-14 mx-auto rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                cat.color
              )}>
                <cat.icon className="w-7 h-7" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">{cat.name}</h3>
              <p className="mt-2 text-sm text-zinc-400 tracking-wide font-medium">
                {cat.count} Professionals
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
