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
  ChevronRight,
  CheckCircle,
  XCircle,
  X
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
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [bookingDetails, setBookingDetails] = useState({
    date: "",
    time: "",
    type: "Portrait Session",
    notes: ""
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();

      const [phRes, userRes] = await Promise.all([
        supabase.from('profiles').select(`*, portfolios (*)`).eq('id', photographerId).single(),
        user ? supabase.from('profiles').select('*').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null })
      ]);

      if (phRes.error) {
        setNotification({ message: "Signal Error: Resource not found.", type: 'error' });
        setTimeout(() => router.push("/dashboard/user"), 2000);
        return;
      }

      setPhotographer(phRes.data);
      if (userRes.data) setCurrentUserProfile(userRes.data);
      setLoading(false);
    }
    fetchData();
  }, [photographerId, supabase, router]);

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profileExists } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profileExists) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          role: 'USER',
          username: user.email
        });

      if (profileError) {
        setNotification({ message: "Identity Sync Error: Profile could not be initialized.", type: 'error' });
        return;
      }
    }

    const bookingData = {
      client_id: user.id,
      photographer_id: photographerId,
      type: bookingDetails.type,
      date: bookingDetails.date,
      time: bookingDetails.time,
      notes: bookingDetails.notes,
      amount: "$250",
      status: "pending"
    };

    const { error } = await supabase.from('bookings').insert(bookingData);
    if (error) {
      setNotification({ message: "Operation Failed: " + error.message, type: 'error' });
    } else {
      setNotification({ message: "Session Registered: Awaiting artist approval protocol.", type: 'success' });
      setShowBookingModal(false);
      setTimeout(() => router.push("/dashboard/user"), 2500);
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
    <div className="min-h-screen bg-background pt-24 pb-20 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-muted font-black italic gap-2 -ml-2 text-xs uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Discover
            </Button>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 italic">Elite Storyteller</div>
              <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter font-serif leading-none uppercase">{photographer.full_name} <span className="text-primary">.</span></h1>
              <div className="flex items-center gap-6 text-muted-foreground font-bold italic">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> {photographer.location || "Global Boutique"}</span>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-primary fill-current" /> 5.0 (Vouched)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-60">Base Investment</p>
              <h3 className="text-4xl font-black italic text-foreground leading-none tracking-tighter">{photographer.rate || "$250"}</h3>
            </div>
            <Button
              onClick={() => setShowBookingModal(true)}
              className="px-10 py-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black italic shadow-xl shadow-primary/20 text-lg uppercase tracking-widest h-20"
            >
              Request Session
            </Button>
          </div>
        </div>

        <div className="space-y-16">
          <div className="relative group overflow-hidden rounded-[3.5rem] bg-muted aspect-video md:aspect-[21/9] border-2 border-border shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                src={activeImage || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80"}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>

            {photographer.portfolios?.length > 1 && (
              <>
                <div className="absolute inset-y-0 left-0 w-1/4 flex items-center justify-start pl-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={goToPrev}
                    className="w-16 h-16 rounded-[2rem] bg-background/80 backdrop-blur-md border-2 border-border flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-2xl"
                  >
                    <ArrowLeft className="w-7 h-7 ml-[-2px]" />
                  </button>
                </div>
                <div className="absolute inset-y-0 right-0 w-1/4 flex items-center justify-end pr-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={goToNext}
                    className="w-16 h-16 rounded-[2rem] bg-background/80 backdrop-blur-md border-2 border-border flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-2xl"
                  >
                    <ChevronRight className="w-7 h-7 mr-[-2px]" />
                  </button>
                </div>
              </>
            )}

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full bg-background/80 backdrop-blur-md border-2 border-border shadow-2xl text-[10px] font-black italic tracking-[0.3em] flex items-center gap-4 transition-all hover:scale-105">
              <span className="text-primary italic">EXP {activeImageIndex + 1}</span>
              <span className="opacity-20 text-foreground">/</span>
              <span className="text-muted-foreground">{photographer.portfolios?.length || 0}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4 space-y-10">
              <div className="flex gap-6">
                <div className="w-20 h-20 rounded-3xl bg-muted overflow-hidden border-2 border-primary/20 flex-shrink-0 rotate-[-4deg] shadow-xl">
                  {photographer.avatar_url ? <img src={photographer.avatar_url} className="w-full h-full object-cover" /> : <ImageIcon className="w-10 h-10 m-auto h-full opacity-20" />}
                </div>
                <div className="space-y-2">
                  <h4 className="font-serif font-black italic text-2xl uppercase tracking-tighter">Manifesto</h4>
                  <p className="text-sm text-muted-foreground italic font-medium leading-relaxed">
                    "{photographer.bio || "Capturing human depth and atmospheric elegance through a refined cinematic lens."}"
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (currentUserProfile?.is_subscribed) {
                      setNotification({ message: "Relay Active: Connecting to photographer...", type: 'success' });
                      return;
                    }

                    // Start Razorpay Subscription flow
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                      setNotification({ message: "Identity Required: Please log in to subscribe.", type: 'error' });
                      return;
                    }

                    try {
                      setNotification({ message: "Iniatizing Secure Protocol: Creating payment order...", type: 'success' });

                      const res = await fetch("/api/razorpay/order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ amount: 1 }), // 1 Rupee
                      });

                      const orderData = await res.json();
                      if (orderData.error) throw new Error(orderData.error);

                      const options = {
                        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_K2v6vO6mO6mO6m",
                        amount: orderData.amount,
                        currency: orderData.currency,
                        name: "Lumina Premium",
                        description: "1 Month Elite Access - ₹1",
                        order_id: orderData.id,
                        handler: async function (response: any) {
                          try {
                            setNotification({ message: "Signal Verified: Finalizing elite status...", type: 'success' });
                            const vRes = await fetch("/api/razorpay/verify", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                ...response,
                                userId: user.id
                              }),
                            });

                            const vData = await vRes.json();
                            if (vData.message === "Payment verified successfully") {
                              setCurrentUserProfile({ ...currentUserProfile, is_subscribed: true });
                              setNotification({ message: "Premium Protocol Activated: Welcome to the elite tier.", type: 'success' });
                            } else {
                              throw new Error(vData.error || "Verification failed");
                            }
                          } catch (err: any) {
                            setNotification({ message: "Encryption Error: Payment verification failed.", type: 'error' });
                          }
                        },
                        prefill: {
                          name: currentUserProfile?.full_name,
                          email: user.email,
                        },
                        theme: { color: "#E2B853" },
                      };

                      const rzp = new (window as any).Razorpay(options);
                      rzp.open();

                    } catch (error: any) {
                      setNotification({ message: "Relay Failed: Could not initialize payment.", type: 'error' });
                    }
                  }}
                  className={cn(
                    "flex-1 h-16 gap-3 border-2 rounded-2xl font-black italic uppercase tracking-widest text-[10px] shadow-sm",
                    !currentUserProfile?.is_subscribed && "border-primary/50 text-foreground hover:border-primary"
                  )}
                >
                  <MessageSquare className="w-4 h-4" /> {currentUserProfile?.is_subscribed ? "Open Comms" : "Unlock Chat (₹1)"}
                </Button>
                <Button variant="outline" className="w-16 h-16 p-0 border-2 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all border-rose-500/20 shadow-sm">
                  <Heart className="w-6 h-6" />
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic pl-1 opacity-60">Creative Disciplines</p>
                <div className="flex flex-wrap gap-2.5">
                  {(photographer.specialty ? photographer.specialty.split(',').map((s: string) => s.trim()) : ["Portraiture", "Cinematography", "Editorial", "Noir"]).map((tag: string) => (
                    <span key={tag} className="px-5 py-2 rounded-xl bg-muted/40 border-2 border-border/50 text-[10px] font-black italic tracking-widest uppercase hover:border-primary/40 transition-colors cursor-default">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black italic tracking-tighter font-serif uppercase underline decoration-primary decoration-4 underline-offset-8">The Collection</h2>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {photographer.portfolios?.map((photo: any, idx: number) => (
                  <button
                    key={photo.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-500 hover:scale-105 shadow-md",
                      activeImageIndex === idx ? "border-primary shadow-2xl shadow-primary/20 scale-110 z-10" : "border-border/50 opacity-50 hover:opacity-100"
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

      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBookingModal(false)} className="absolute inset-0 bg-background/90 backdrop-blur-2xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-xl bg-background border-2 border-border rounded-[3.5rem] shadow-2xl p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none" />
              <div className="relative space-y-10">
                <div className="space-y-3">
                  <h2 className="text-4xl font-black italic tracking-tighter font-serif leading-none uppercase underline decoration-primary decoration-4 underline-offset-8">Initiate Protocol</h2>
                  <p className="text-muted-foreground font-black italic uppercase text-[10px] tracking-[0.2em] opacity-60">Register your session in our elite calendar.</p>
                </div>

                <form onSubmit={handleBookSession} className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic ml-2">Digital Date</p>
                      <input type="date" required className="w-full h-16 bg-muted/40 border-2 border-border/50 focus:border-primary rounded-[1.5rem] px-6 outline-none font-bold italic transition-all" value={bookingDetails.date} onChange={(e) => setBookingDetails({ ...bookingDetails, date: e.target.value })} />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic ml-2">Time Slice</p>
                      <input type="time" required className="w-full h-16 bg-muted/40 border-2 border-border/50 focus:border-primary rounded-[1.5rem] px-6 outline-none font-bold italic transition-all" value={bookingDetails.time} onChange={(e) => setBookingDetails({ ...bookingDetails, time: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic ml-2">Session Archetype</p>
                    <select className="w-full h-16 bg-muted/40 border-2 border-border/50 focus:border-primary rounded-[1.5rem] px-6 outline-none font-bold italic appearance-none transition-all" value={bookingDetails.type} onChange={(e) => setBookingDetails({ ...bookingDetails, type: e.target.value })}>
                      <option value="Portrait Session">Portrait Session</option>
                      <option value="Wedding / Engagement">Wedding / Engagement</option>
                      <option value="Cinematic Studio">Cinematic Studio</option>
                      <option value="Editorial / Fashion">Editorial / Fashion</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic ml-2">Vision Statement</p>
                    <textarea placeholder="Describe the atmosphere you wish to capture..." className="w-full min-h-[140px] bg-muted/40 border-2 border-border/50 focus:border-primary rounded-[2rem] p-7 outline-none font-medium italic resize-none transition-all" value={bookingDetails.notes} onChange={(e) => setBookingDetails({ ...bookingDetails, notes: e.target.value })} />
                  </div>

                  <div className="flex gap-6 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setShowBookingModal(false)} className="flex-1 h-16 rounded-[1.5rem] font-black italic tracking-widest uppercase border-2 text-[10px]">Decline</Button>
                    <Button type="submit" className="flex-[2] h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black italic tracking-widest uppercase shadow-2xl shadow-primary/20 text-xs">Authorize Session</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cinematic TOP Notification System */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -100, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -20, x: "-50%", scale: 0.95 }} className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] w-auto min-w-[340px] max-w-lg px-6">
            <div className={cn("relative overflow-hidden p-6 rounded-[2rem] border shadow-2xl backdrop-blur-3xl flex items-center gap-6", notification.type === 'success' ? "bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/10" : "bg-rose-500/5 border-rose-500/20 shadow-rose-500/10")}>
              <div className={cn("absolute top-0 left-0 right-0 h-1", notification.type === 'success' ? "bg-emerald-500" : "bg-rose-500")} />
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", notification.type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                {notification.type === 'success' ? <CheckCircle className="w-6 h-6 stroke-[2.5]" /> : <XCircle className="w-6 h-6 stroke-[2.5]" />}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">System Dispatch Signal</p>
                <h4 className="text-base font-black italic leading-tight tracking-tight text-foreground">{notification.message}</h4>
              </div>
              <button onClick={() => setNotification(null)} className="ml-4 p-2 rounded-xl hover:bg-muted/50 transition-colors opacity-30 hover:opacity-100"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
