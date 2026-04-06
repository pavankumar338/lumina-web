"use client";

import React, { useEffect, useState, use } from "react";
import {
  Star,
  MapPin,
  Image as ImageIcon,
  Calendar,
  Clock,
  DollarSign,
  ArrowLeft,
  Heart,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PhotographerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const photographerId = resolvedParams.id;

  const supabase = createClient();
  const router = useRouter();

  const [photographer, setPhotographer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    date: "",
    time: "",
    type: "Portrait Session",
    notes: ""
  });

  useEffect(() => {
    async function fetchPhotographer() {
      const { data, error } = await supabase
        .from('profiles')
        .select(`*, portfolios (*)`)
        .eq('id', photographerId)
        .single();
      
      if (error) {
        console.error("Error fetching photographer:", error);
        router.push("/dashboard/user");
        return;
      }

      setPhotographer(data);
      setLoading(false);
    }
    fetchPhotographer();
  }, [photographerId, supabase, router]);

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const bookingData = {
      client_id: user.id,
      photographer_id: photographerId,
      type: bookingDetails.type,
      date: bookingDetails.date, 
      time: bookingDetails.time,
      notes: bookingDetails.notes,
      amount: "$250", // Fixed base price for now
      status: "pending"
    };

    const { error } = await supabase.from('bookings').insert(bookingData);
    if (error) {
      alert("Error booking session: " + error.message);
    } else {
      alert("Session Booked Successfully! View it in your Appointments.");
      setShowBookingModal(false);
      router.push("/dashboard/user");
    }
  };

  const goToNext = () => {
    if (!photographer?.portfolios) return;
    setActiveImageIndex((prev) => (prev + 1) % photographer.portfolios.length);
  };

  const goToPrev = () => {
    if (!photographer?.portfolios) return;
    setActiveImageIndex((prev) => (prev - 1 + photographer.portfolios.length) % photographer.portfolios.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeImage = photographer?.portfolios?.[activeImageIndex]?.image_url;

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="hover:bg-muted font-bold italic gap-2 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Discover
            </Button>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">Elite Storyteller</div>
              <h1 className="text-5xl font-black italic tracking-tighter font-serif leading-none">{photographer.full_name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground font-semibold italic">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-primary" /> {photographer.location || "Global Boutique"}</span>
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-primary fill-current" /> 5.0 (42 Review)</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right mr-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Base Investment</p>
                <h3 className="text-3xl font-black italic text-primary leading-none">{photographer.rate || "$250"}</h3>
             </div>
             <Button 
               onClick={() => setShowBookingModal(true)}
               className="px-10 py-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black italic shadow-xl shadow-primary/20 text-lg"
             >
               Book Discovery
             </Button>
          </div>
        </div>

        {/* Spacious Main Stage */}
        <div className="space-y-12">
          
          {/* Central Stage */}
          <div className="relative group overflow-hidden rounded-[3rem] bg-muted aspect-video md:aspect-[21/9] border-2 border-border shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                src={activeImage || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80"}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Navigation Overlays */}
            {photographer.portfolios?.length > 1 && (
              <>
                <div className="absolute inset-y-0 left-0 w-1/4 flex items-center justify-start pl-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={goToPrev}
                    className="w-14 h-14 rounded-full bg-background/80 backdrop-blur-md border-2 border-border flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg"
                  >
                    <ArrowLeft className="w-6 h-6 ml-[-2px]" />
                  </button>
                </div>
                <div className="absolute inset-y-0 right-0 w-1/4 flex items-center justify-end pr-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={goToNext}
                    className="w-14 h-14 rounded-full bg-background/80 backdrop-blur-md border-2 border-border flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg"
                  >
                    <ChevronRight className="w-6 h-6 mr-[-2px]" />
                  </button>
                </div>
              </>
            )}

            {/* Stage Footer Info */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-background/80 backdrop-blur-md border-2 border-border shadow-xl text-xs font-black italic tracking-widest flex items-center gap-4">
               <span className="text-primary">{activeImageIndex + 1}</span>
               <span className="opacity-20 text-foreground">/</span>
               <span className="text-muted-foreground">{photographer.portfolios?.length || 0}</span>
            </div>
          </div>

          {/* Bottom Grid Info & Thumbnails */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left: Artist Info */}
            <div className="lg:col-span-4 space-y-8">
              <div className="flex gap-4">
                 <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden border-2 border-primary/20 flex-shrink-0">
                    <img src={photographer.avatar_url || "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=200&q=80"} className="w-full h-full object-cover" />
                 </div>
                 <div className="space-y-1">
                    <h4 className="font-serif font-black italic text-xl">Artist Bio</h4>
                    <p className="text-sm text-muted-foreground italic font-medium leading-relaxed italic">
                      "{photographer.bio || "Capturing the raw beauty of human connection through natural light and cinematic composition."}"
                    </p>
                 </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-14 gap-2 border-2 rounded-2xl font-black italic uppercase tracking-widest text-xs">
                  <MessageSquare className="w-4 h-4" /> Message
                </Button>
                <Button variant="outline" className="w-14 h-14 p-0 border-2 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all border-rose-500/10">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-3">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Specialties</p>
                 <div className="flex flex-wrap gap-2">
                   {(photographer.specialty ? photographer.specialty.split(',').map((s: string) => s.trim()) : ["Weddings", "Portraits", "Cinematic", "Editorial"]).map((tag: string) => (
                     <span key={tag} className="px-4 py-1.5 rounded-xl bg-muted/50 border border-border text-[9px] font-black italic tracking-widest uppercase">{tag}</span>
                   ))}
                 </div>
              </div>
            </div>

            {/* Right: Full Collection Thumbnails */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black italic tracking-tight font-serif uppercase">Full Collection</h2>
                <div className="h-px flex-1 mx-6 bg-border/50" />
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {photographer.portfolios?.map((photo: any, idx: number) => (
                  <button 
                    key={photo.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105",
                      activeImageIndex === idx ? "border-primary shadow-lg shadow-primary/20 scale-110" : "border-border/50 opacity-40 hover:opacity-100"
                    )}
                  >
                    <img src={photo.image_url} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Booking Form Overlay */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-background border-2 border-border rounded-[3rem] shadow-2xl p-10 overflow-hidden"
            >
              {/* Gold Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <div className="relative space-y-8">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black italic tracking-tighter font-serif leading-none uppercase underline decoration-primary decoration-4 underline-offset-8">Book Studio Session</h2>
                  <p className="text-muted-foreground font-semibold italic">Tell us about your visual story.</p>
                </div>

                <form onSubmit={handleBookSession} className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic ml-2">Preferred Date</p>
                        <input 
                           type="date" 
                           required
                           className="w-full h-14 bg-muted/40 border-2 border-border/50 focus:border-primary rounded-2xl px-5 outline-none font-bold italic"
                           value={bookingDetails.date}
                           onChange={(e) => setBookingDetails({...bookingDetails, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic ml-2">Preferred Time</p>
                        <input 
                           type="time" 
                           required
                           className="w-full h-14 bg-muted/40 border-2 border-border/50 focus:border-primary rounded-2xl px-5 outline-none font-bold italic"
                           value={bookingDetails.time}
                           onChange={(e) => setBookingDetails({...bookingDetails, time: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic ml-2">Event Type</p>
                      <select 
                         className="w-full h-14 bg-muted/40 border-2 border-border/50 focus:border-primary rounded-2xl px-5 outline-none font-bold italic appearance-none"
                         value={bookingDetails.type}
                         onChange={(e) => setBookingDetails({...bookingDetails, type: e.target.value})}
                      >
                         <option value="Portrait Session">Portrait Session</option>
                         <option value="Wedding / Engagement">Wedding / Engagement</option>
                         <option value="Cinematic Studio">Cinematic Studio</option>
                         <option value="Editorial / Fashion">Editorial / Fashion</option>
                         <option value="Event Coverage">Event Coverage</option>
                      </select>
                   </div>

                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic ml-2">Vision & Details</p>
                      <textarea 
                         placeholder="Briefly describe your vision for this session..."
                         className="w-full min-h-[120px] bg-muted/40 border-2 border-border/50 focus:border-primary rounded-[2rem] p-6 outline-none font-medium italic resize-none"
                         value={bookingDetails.notes}
                         onChange={(e) => setBookingDetails({...bookingDetails, notes: e.target.value})}
                      />
                   </div>

                   <div className="flex gap-4 pt-4">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setShowBookingModal(false)}
                        className="flex-1 h-16 rounded-2xl font-black italic tracking-widest uppercase border-2 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-[2] h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black italic tracking-widest uppercase shadow-xl shadow-primary/20"
                      >
                        Request Session
                      </Button>
                   </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}


