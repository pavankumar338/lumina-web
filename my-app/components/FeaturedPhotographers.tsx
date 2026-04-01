"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Camera } from "lucide-react";
import Image from "next/image";
import { Button } from "./Button";

const photographers = [
  {
    id: 1,
    name: "Elena Rossi",
    specialty: "Wedding & High Fashion",
    rating: 4.9,
    reviews: 124,
    location: "Milan, Italy",
    price: "From €250/hr",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3387&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Marcus Thorne",
    specialty: "Luxury Real Estate",
    rating: 4.8,
    reviews: 89,
    location: "New York, USA",
    price: "From $180/hr",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3387&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Sofia Chen",
    specialty: "Commercial & PR",
    rating: 5.0,
    reviews: 56,
    location: "London, UK",
    price: "From £200/hr",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=3388&auto=format&fit=crop",
  },
];

export function FeaturedPhotographers() {
  return (
    <section className="py-24 bg-zinc-50 dark:bg-black">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1"
          >
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Meet Our <span className="text-serif italic text-primary">Master Artists</span>
            </h2>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400 max-w-xl text-lg leading-relaxed">
              Curated professionals with a proven track record of delivering 
              extraordinary results for our elite clientele.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Button variant="outline" size="lg">
              View All Artists
            </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {photographers.map((photog, i) => (
            <motion.div
              key={photog.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group bg-card dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-border shadow-soft-xl hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
            >
              <div className="relative h-[420px] overflow-hidden">
                <Image
                  src={photog.image}
                  alt={photog.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-6 left-6 flex gap-2">
                  <div className="px-5 py-2.5 bg-black/40 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest border border-white/20">
                    Featured
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-primary fill-primary" />
                    <span className="text-white font-bold text-lg">{photog.rating}</span>
                    <span className="text-zinc-400 text-sm">({photog.reviews} reviews)</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white tracking-tight">{photog.name}</h3>
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 mb-6">
                  <div className="flex items-center gap-2">
                    <Camera size={18} className="text-primary" />
                    <span className="text-sm font-medium">{photog.specialty}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <MapPin size={18} className="text-primary" />
                    <span className="text-sm font-medium">{photog.location}</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between pt-8 border-t border-border">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Rate</span>
                    <span className="text-xl font-bold text-foreground">{photog.price}</span>
                  </div>
                  <Button variant="premium" className="rounded-2xl px-8 h-12 shadow-lg shadow-primary/20">
                    Book Now
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
