"use client";

import React, { useEffect, useState } from "react";
import {
  Camera,
  Search,
  Calendar,
  Heart,
  MessageSquare,
  Star,
  LogOut,
  LayoutDashboard,
  ChevronRight,
  Filter,
  DollarSign,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  X,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

function SidebarItem({ icon: Icon, label, active, onClick, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-semibold italic",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        {label}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-black",
          active ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-foreground"
        )}>{badge}</span>
      )}
    </button>
  );
}

export default function UserDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("overview");
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentBookingForRating, setCurrentBookingForRating] = useState<any>(null);
  const [ratingDetails, setRatingDetails] = useState({ score: 5, comment: "" });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Chat State
  const [activeChatPhotographer, setActiveChatPhotographer] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (activeChatPhotographer && profile) {
      fetchChatMessages();

      const channel = supabase
        .channel(`chat-${activeChatPhotographer.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile.id},sender_id=eq.${activeChatPhotographer.id}`
        }, (payload) => {
          setChatMessages((prev) => [...prev, payload.new]);
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${profile.id},receiver_id=eq.${activeChatPhotographer.id}`
        }, (payload) => {
          setChatMessages((prev) => [...prev, payload.new]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [activeChatPhotographer, profile]);

  const fetchChatMessages = async () => {
    if (!profile || !activeChatPhotographer) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${activeChatPhotographer.id}),and(sender_id.eq.${activeChatPhotographer.id},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true });
    
    if (data) setChatMessages(data);
  };

  const sendMessage = async (content: string) => {
    if (!profile || !activeChatPhotographer) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: profile.id,
        receiver_id: activeChatPhotographer.id,
        content
      });

    if (error) {
      setNotification({ message: "Signal Failed: Message not delivered.", type: 'error' });
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileData && !profileFetchError) {
        const { data: newProfile, error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            role: 'USER',
            username: user.email
          })
          .select()
          .single();

        if (!profileInsertError) {
          setProfile(newProfile);
        } else {
          setProfile({ full_name: user.user_metadata?.full_name || user.email?.split('@')[0] });
        }
      } else {
        setProfile(profileData || { full_name: user.user_metadata?.full_name || user.email?.split('@')[0] });
        setIsSubscribed(profileData?.is_subscribed || false);
      }

      const { data: photographersData } = await supabase
        .from('profiles')
        .select(`*, portfolios (*)`)
        .eq('role', 'PHOTOGRAPHER');

      setPhotographers(photographersData || []);

      const [bookingsRes, favRes] = await Promise.all([
        supabase.from('bookings').select('*, photographer:profiles!photographer_id(*)').eq('client_id', user.id),
        supabase.from('favorites').select('*, photographer:profiles!photographer_id(*)').eq('client_id', user.id)
      ]);

      setBookings(bookingsRes.data || []);
      setFavorites(favRes.data || []);

      setLoading(false);
    }
    fetchData();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const toggleFavorite = async (photographerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const favoriteEntry = favorites.find(f => f.photographer_id === photographerId);

    if (favoriteEntry) {
      const { error } = await supabase.from('favorites').delete().eq('id', favoriteEntry.id);
      if (!error) {
        setFavorites(favorites.filter(f => f.id !== favoriteEntry.id));
        setNotification({ message: "Sovereign Removal: Artist removed from your collection.", type: 'success' });
      } else {
        setNotification({ message: "Signal Error: Could not update collection.", type: 'error' });
      }
    } else {
      const { data, error } = await supabase
        .from('favorites')
        .insert({ client_id: user.id, photographer_id: photographerId })
        .select('*, photographer:profiles!photographer_id(*)')
        .single();

      if (!error && data) {
        setFavorites([...favorites, data]);
        setNotification({ message: "Curated Addition: Artist added to favorites.", type: 'success' });
      } else {
        setNotification({ message: "Acquisition Error: Artist signal lost.", type: 'error' });
      }
    }
  };

  const handleSubscribe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotification({ message: "Identity Required: Please log in to subscribe.", type: 'error' });
      return;
    }

    try {
      setNotification({ message: "Iniatizing Secure Protocol: Creating payment order...", type: 'success' });

      // 1. Create Order
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1 }), // 1 Rupee / month
      });

      const orderData = await res.json();
      if (orderData.error) throw new Error(orderData.error);

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_K2v6vO6mO6mO6m", // Use your public key
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Lumina Premium",
        description: "1 Month Elite Access - ₹1",
        image: "/logo.png",
        order_id: orderData.id,
        handler: async function (response: any) {
          // 3. Verify Payment
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
              setIsSubscribed(true);
              setNotification({ message: "Premium Protocol Activated: Welcome to the elite tier.", type: 'success' });
            } else {
              throw new Error(vData.error || "Verification failed");
            }
          } catch (err: any) {
            setNotification({ message: "Encryption Error: Payment verification failed.", type: 'error' });
          }
        },
        prefill: {
          name: profile?.full_name,
          email: user.email,
        },
        theme: {
          color: "#E2B853", // Match Lumina brand color
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      setNotification({ message: "Relay Failed: Could not initialize payment.", type: 'error' });
    }
  };

  const filteredPhotographers = photographers.filter(p =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-20 flex">
      <aside className="w-64 bg-background border-r border-border hidden lg:flex flex-col sticky top-20 h-[calc(100vh-5rem)]">
        <div className="p-6 border-b border-border/50">
          <h2 className="font-serif font-black text-xl italic tracking-tight underline decoration-primary decoration-2 underline-offset-4">Studio View</h2>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">Client Command Center</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <SidebarItem icon={Search} label="Discover Pros" active={activeTab === "discover"} onClick={() => setActiveTab("discover")} />
          <SidebarItem icon={Calendar} label="Appointments" active={activeTab === "appointments"} onClick={() => setActiveTab("appointments")} badge={bookings.length} />
          <SidebarItem icon={Heart} label="Favorites" active={activeTab === "favorites"} onClick={() => setActiveTab("favorites")} badge={favorites.length} />
          <SidebarItem icon={MessageSquare} label="Premium Chat" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} badge={isSubscribed ? 0 : 1} />
        </nav>

        <div className="px-6 py-4 space-y-3 mt-auto border-t border-border/50">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Support & Help</p>
          <div className="space-y-2">
            <a href="tel:8309768825" className="flex items-center gap-2 text-[11px] font-bold italic text-foreground hover:text-primary transition-colors">
              <Phone className="w-3.5 h-3.5 text-primary" /> 8309768825
            </a>
            <a href="mailto:bellapukondatejavardhan@gmail.com" className="flex items-center gap-2 text-[10px] font-bold italic text-muted-foreground hover:text-primary transition-colors truncate">
              <Mail className="w-3.5 h-3.5 text-primary shrink-0" /> bellapukondatejavardhan@gmail.com
            </a>
          </div>
        </div>

        <div className="p-4 border-t border-border/50">
          <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-3 font-semibold italic">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 px-6 lg:px-12 py-10 overflow-y-auto w-full max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-extrabold font-serif tracking-tight text-foreground italic">
                  Welcome, {profile?.full_name?.split(' ')[0]} <span className="text-primary">.</span>
                </h1>
                <p className="text-muted-foreground max-w-lg">Manage your photography sessions and explore elite creators.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Active Sessions</p><h3 className="text-3xl font-black italic">{bookings.length}</h3></div>
                    <Calendar className="w-8 h-8 text-primary opacity-50" />
                  </CardContent>
                </Card>
                <Card className="bg-rose-500/5 border-rose-500/20">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-widest text-rose-500">Saved Storytellers</p><h3 className="text-3xl font-black italic">{favorites.length}</h3></div>
                    <Heart className="w-8 h-8 text-rose-500 opacity-50" />
                  </CardContent>
                </Card>
                <Card className={cn("border-none ring-1", isSubscribed ? "bg-emerald-500/5 ring-emerald-500/20" : "bg-amber-500/5 ring-amber-500/20")}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className={cn("text-xs font-bold uppercase tracking-widest", isSubscribed ? "text-emerald-500" : "text-amber-500")}>
                        {isSubscribed ? "Premium Active" : "Chat Access"}
                      </p>
                      <h3 className="text-3xl font-black italic">{isSubscribed ? "Pro" : "Basic"}</h3>
                    </div>
                    <MessageSquare className={cn("w-8 h-8 opacity-50", isSubscribed ? "text-emerald-500" : "text-amber-500")} />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <div className="flex items-end justify-between px-2">
                  <h2 className="text-2xl font-black italic tracking-tight font-serif uppercase underline decoration-primary decoration-4 underline-offset-8">Elite Photographers</h2>
                  <Button variant="ghost" onClick={() => setActiveTab("discover")} className="text-primary font-bold italic gap-1">Explore All <ChevronRight className="w-4 h-4" /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {photographers.slice(0, 3).map((p) => (
                    <Card key={p.id} className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-500 shadow-lg hover:shadow-primary/5">
                      <div className="h-48 bg-muted relative overflow-hidden">
                        {p.portfolios?.[0] ? (
                          <img src={p.portfolios[0].image_url} alt="Work" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-12 h-12" /></div>
                        )}
                        <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full border border-border flex items-center gap-1.5 shadow-sm text-xs font-black italic">
                          <Star className="w-3 h-3 text-primary fill-current" /> 5.0
                        </div>
                        {p.avatar_url && (
                          <div className="absolute bottom-3 left-3 w-12 h-12 rounded-full border-2 border-background shadow-lg overflow-hidden">
                            <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5 space-y-3">
                        <div className={cn(p.avatar_url ? "pl-2" : "")}>
                          <h4 className="text-lg font-black italic tracking-tight">{p.full_name}</h4>
                          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground italic flex items-center gap-1">
                            {p.location || 'Global Artist'} • Professional Storyteller
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black italic text-xs h-10 shadow-lg shadow-primary/20" onClick={() => router.push(`/photographer/${p.id}`)}>Book Session</Button>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-10 h-10 p-0 border-2 transition-colors",
                              favorites.some(f => f.photographer_id === p.id) ? "border-rose-500 text-rose-500 bg-rose-500/5" : "border-border"
                            )}
                            onClick={() => toggleFavorite(p.id)}
                          >
                            <Heart className={cn("w-4 h-4", favorites.some(f => f.photographer_id === p.id) && "fill-current")} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "discover" && (
            <motion.div key="discover" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-background p-6 rounded-3xl border border-border shadow-md">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    placeholder="Search by name, location or specialty..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary/50 focus:bg-background transition-all outline-none italic font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="h-14 px-8 gap-2 border-2 text-foreground/80 hover:text-primary hover:border-primary/40"><Filter className="w-4 h-4" /> Filters</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredPhotographers.map((p) => (
                  <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-500 bg-background/80 backdrop-blur-xl">
                      <div className="aspect-[4/5] bg-muted relative overflow-hidden cursor-pointer" onClick={() => router.push(`/photographer/${p.id}`)}>
                        <div className="grid grid-cols-2 grid-rows-2 h-full">
                          {p.portfolios?.slice(0, 4).map((img: any, i: number) => (
                            <img key={img.id} src={img.image_url} className={cn("w-full h-full object-cover", i === 0 && "col-span-1 row-span-1")} />
                          ))}
                          {(!p.portfolios || p.portfolios.length === 0) && <div className="col-span-2 row-span-2 flex items-center justify-center text-muted-foreground"><ImageIcon className="w-16 h-16 opacity-20" /></div>}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                          <p className="text-white/80 text-xs italic line-clamp-3 mb-4">"Capturing raw beauty and cinematic stories."</p>
                          <Button className="w-full bg-white text-black hover:bg-primary hover:text-white font-black italic tracking-widest uppercase py-6">View Portfolio</Button>
                        </div>
                      </div>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="cursor-pointer" onClick={() => router.push(`/photographer/${p.id}`)}>
                            <h4 className="text-xl font-black italic tracking-tight group-hover:text-primary transition-colors">{p.full_name}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Star className="w-3 h-3 text-primary fill-current" /><span className="text-xs font-black italic">5.0</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{p.location || 'Global'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black italic text-foreground tracking-tighter">$250</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">per session</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-border/50 flex gap-3">
                          <Button className="flex-1 rounded-xl font-bold bg-primary italic text-xs" onClick={() => router.push(`/photographer/${p.id}`)}>Book Discovery</Button>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-10 h-10 p-0 transition-colors",
                              favorites.some(f => f.photographer_id === p.id) ? "text-rose-500 bg-rose-500/10" : "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                            )}
                            onClick={() => toggleFavorite(p.id)}
                          >
                            <Heart className={cn("w-5 h-5", favorites.some(f => f.photographer_id === p.id) && "fill-current")} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "favorites" && (
            <motion.div key="favorites" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-4xl font-black italic font-serif">Saved Storytellers</h2>
                <p className="text-muted-foreground font-medium italic">Your curated collection of visual artists.</p>
              </div>

              {favorites.length === 0 ? (
                <Card className="border-none shadow-xl ring-1 ring-border p-20 text-center space-y-4 bg-muted/20">
                  <Heart className="w-16 h-16 text-muted-foreground mx-auto opacity-30" />
                  <div className="space-y-2">
                    <h3 className="text-2xl font-serif font-black italic">No favorites yet</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">Explore our elite community and save the photographers that inspire you.</p>
                  </div>
                  <Button onClick={() => setActiveTab("discover")} className="px-10 py-6 text-lg font-black italic bg-primary shadow-xl shadow-primary/20">Discover Pros</Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {favorites.map((fav) => {
                    const p = fav.photographer;
                    return (
                      <Card key={fav.id} className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-500 bg-background/80 backdrop-blur-xl">
                        <div className="aspect-[4/5] bg-muted relative overflow-hidden cursor-pointer" onClick={() => router.push(`/photographer/${p.id}`)}>
                          {p.portfolios?.[0] ? (
                            <img src={p.portfolios[0].image_url} alt="Work" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-16 h-16 opacity-20" /></div>
                          )}
                           {p.avatar_url && (
                             <div className="absolute bottom-3 left-3 w-12 h-12 rounded-full border-2 border-background shadow-lg overflow-hidden">
                               <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
                             </div>
                           )}
                        </div>
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="cursor-pointer" onClick={() => router.push(`/photographer/${p.id}`)}>
                              <h4 className="text-xl font-black italic tracking-tight group-hover:text-primary transition-colors">{p.full_name}</h4>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Wedding • Portrait</p>
                            </div>
                            <Button variant="ghost" className="text-rose-500 hover:bg-rose-500/10 text-xs font-bold italic" onClick={() => toggleFavorite(p.id)}>Remove</Button>
                          </div>
                          <Button className="w-full rounded-xl font-bold bg-primary italic text-xs h-12" onClick={() => router.push(`/photographer/${p.id}`)}>Book Session</Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "appointments" && (
            <motion.div key="appointments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex justify-between items-end mb-8">
                <h2 className="text-4xl font-black italic font-serif">My Appointments</h2>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-full shadow-sm">Upcoming</Button>
                  <Button variant="ghost" className="rounded-full text-muted-foreground">Past Sessions</Button>
                </div>
              </div>

              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <Card className="border-none shadow-xl ring-1 ring-border p-20 text-center space-y-4 bg-muted/20">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto opacity-30" />
                    <div className="space-y-2">
                      <h3 className="text-2xl font-serif font-black italic">No upcoming sessions</h3>
                      <p className="text-muted-foreground max-w-xs mx-auto">Your story is waiting to be told. Discover elite photographers today.</p>
                    </div>
                    <Button onClick={() => setActiveTab("discover")} className="px-10 py-6 text-lg font-black italic bg-primary shadow-xl shadow-primary/20">Browse Elite Pros</Button>
                  </Card>
                ) : bookings.map((booking) => (
                  <Card key={booking.id} className="group hover:bg-muted/30 transition-all border-none ring-1 ring-border shadow-lg overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center">
                      <div className="w-full md:w-48 aspect-square bg-muted flex-shrink-0">
                        <img src={booking.photographer?.avatar_url || "https://images.unsplash.com/"} className="w-full h-full object-cover" />
                      </div>
                      <CardContent className="p-8 flex-1 flex flex-col md:flex-row justify-between w-full gap-8">
                        <div className="space-y-3">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            booking.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              booking.status === 'rejected' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                "bg-primary/10 text-primary border-primary/20"
                          )}>
                            {booking.status === 'confirmed' ? 'Confirmed Session' : booking.status === 'rejected' ? 'Session Declined' : 'Pending Approval'}
                          </div>
                          <h4 className="text-2xl font-black italic tracking-tight">{booking.photographer?.full_name}</h4>
                          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> {booking.date}</span>
                            <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-primary" /> 10:00 AM</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center gap-4">
                          <h3 className="text-3xl font-black italic text-primary">{booking.amount}</h3>
                          <div className="flex gap-2">
                             {booking.status === 'confirmed' ? (
                               <>
                                 <Button variant="outline" className="font-bold italic text-xs h-12 px-6 border-2" onClick={() => { setCurrentBookingForRating(booking); setShowRatingModal(true); }}>Rate Session</Button>
                                 <Button className="bg-primary font-bold italic text-xs h-12 px-6 shadow-lg shadow-primary/20" onClick={() => { setCurrentBookingForRating(booking); setShowRatingModal(true); }}>Add Comments</Button>
                               </>
                             ) : (
                               <div className="h-12 px-6 rounded-xl bg-muted/30 border border-border flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                                 {booking.status === 'rejected' ? 'Session Declined' : 'Awaiting Artist Acceptance'}
                               </div>
                             )}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="h-full">
              {!isSubscribed ? (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <Card className="max-w-2xl w-full border-none shadow-2xl ring-2 ring-primary/20 overflow-hidden bg-background/60 backdrop-blur-xl p-12 text-center space-y-8">
                      <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto rotate-12 transition-transform duration-500">
                        <MessageSquare className="w-12 h-12 text-primary" />
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-4xl font-black italic font-serif leading-tight">Unlock Elite Access <br /> <span className="text-primary italic">to Global Storytellers</span></h2>
                        <p className="text-muted-foreground font-medium max-w-sm mx-auto italic">Direct communication is a premium feature.</p>
                      </div>
                      <Button onClick={handleSubscribe} className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black italic text-lg shadow-xl shadow-primary/30">Subscribe Now</Button>
                  </Card>
                </div>
              ) : (
                <div className="h-full flex gap-6 mt-8">
                   {/* Conversations List */}
                   <div className="w-[380px] flex flex-col gap-4">
                      <Card className="flex-1 bg-background/40 backdrop-blur-xl border-2 border-border/50 rounded-[2.5rem] overflow-hidden flex flex-col">
                        <div className="p-8 border-b-2 border-border/50 bg-muted/20">
                          <h3 className="text-xl font-black italic tracking-tighter uppercase font-serif">Comms Station</h3>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic mt-1">Satellite Relay Active</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                          {photographers.length === 0 ? (
                            <div className="p-8 text-center opacity-30 mt-20">
                              <p className="text-[10px] font-black uppercase tracking-widest italic">Scanning for artists...</p>
                            </div>
                          ) : (
                            photographers.map((p: any) => (
                              <button
                                key={p.id}
                                onClick={() => setActiveChatPhotographer(p)}
                                className={cn(
                                  "w-full p-5 rounded-[1.5rem] flex items-center gap-4 transition-all border-2",
                                  activeChatPhotographer?.id === p.id 
                                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                    : "hover:bg-muted/50 border-transparent text-foreground"
                                )}
                              >
                                <div className="w-12 h-12 rounded-xl bg-muted/20 overflow-hidden border border-border/20">
                                  {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-xs uppercase">{p.full_name[0]}</div>}
                                </div>
                                <div className="text-left overflow-hidden">
                                  <h4 className="font-bold italic tracking-tight line-clamp-1">{p.full_name}</h4>
                                  <p className={cn("text-[8px] font-black uppercase tracking-widest italic opacity-50", activeChatPhotographer?.id === p.id && "text-primary-foreground")}>{p.specialty || "Elite Storyteller"}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </Card>
                   </div>

                   {/* Active Chat Station */}
                   <div className="flex-1 flex flex-col gap-4">
                      {activeChatPhotographer ? (
                        <Card className="flex-1 bg-background/40 backdrop-blur-xl border-2 border-border/50 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
                          <div className="p-8 border-b-2 border-border/50 bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                              </div>
                              <div>
                                <h3 className="text-xl font-black italic tracking-tighter uppercase">{activeChatPhotographer.full_name}</h3>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Encrypted Relay Protocol</p>
                              </div>
                            </div>
                            <Button variant="ghost" onClick={() => setActiveChatPhotographer(null)} className="p-3 text-muted-foreground hover:text-foreground">
                              <X className="w-6 h-6" />
                            </Button>
                          </div>

                          <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                            {chatMessages.length === 0 ? (
                               <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
                                  <MessageSquare className="w-16 h-16" />
                                  <p className="text-xs font-black uppercase tracking-[0.3em] font-serif">Open the floor for visual dialogue</p>
                               </div>
                            ) : (
                              chatMessages.map((msg, i) => {
                                const isMe = msg.sender_id === profile?.id;
                                return (
                                  <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                                  >
                                    <div className={cn(
                                      "max-w-[70%] p-5 rounded-[1.5rem] text-sm font-medium italic shadow-sm border-2",
                                      isMe ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border/20 text-foreground"
                                    )}>
                                      {msg.content}
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-30 mt-2 px-1">
                                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </motion.div>
                                );
                              })
                            )}
                          </div>

                          <div className="p-8 border-t-2 border-border/50 bg-muted/10">
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              if (!newMessage.trim()) return;
                              sendMessage(newMessage.trim());
                              setNewMessage("");
                            }} className="relative">
                              <input
                                placeholder="Transmit your request or vision..."
                                className="w-full bg-background/50 border-2 border-border/50 focus:border-primary rounded-2xl py-5 pl-8 pr-20 outline-none font-bold italic shadow-inner transition-all"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                              />
                              <button
                                type="submit"
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
                              >
                                <ChevronRight className="w-6 h-6 ml-0.5" />
                              </button>
                            </form>
                          </div>
                        </Card>
                      ) : (
                        <Card className="flex-1 bg-background/20 backdrop-blur-xl border-2 border-dashed border-border flex flex-col items-center justify-center space-y-6 rounded-[3rem]">
                           <div className="w-24 h-24 bg-muted/20 rounded-[2.5rem] flex items-center justify-center opacity-30">
                             <MessageSquare className="w-10 h-10" />
                           </div>
                           <div className="text-center space-y-2">
                             <h3 className="text-xl font-black italic uppercase tracking-tighter opacity-50">Select Participant</h3>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">Confirmed artist connections will appear here.</p>
                           </div>
                        </Card>
                      )}
                   </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rating & Comments Modal */}
        <AnimatePresence>
          {showRatingModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRatingModal(false)} className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-background border-2 border-border rounded-[3rem] shadow-2xl p-10">
                <div className="space-y-8">
                  <h2 className="text-4xl font-black italic tracking-tighter font-serif leading-none uppercase underline decoration-primary decoration-4 underline-offset-8">Rate Your Artist</h2>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRatingDetails({ ...ratingDetails, score: star })} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2", ratingDetails.score >= star ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg" : "bg-muted/40 border-border/50 text-muted-foreground")}>
                        <Star className={cn("w-5 h-5", ratingDetails.score >= star && "fill-current")} />
                      </button>
                    ))}
                  </div>
                  <textarea placeholder="Share the magic of your session..." className="w-full min-h-[150px] bg-muted/40 border-2 border-border/50 focus:border-primary rounded-[2rem] p-6 outline-none font-medium italic resize-none" value={ratingDetails.comment} onChange={(e) => setRatingDetails({ ...ratingDetails, comment: e.target.value })} />
                  <div className="flex gap-4">
                    <Button variant="ghost" onClick={() => setShowRatingModal(false)} className="flex-1 h-16 rounded-2xl font-black italic uppercase border-2 text-xs">Cancel</Button>
                    <Button onClick={() => { setNotification({ message: "Exquisite Feedback Received: Your review is live.", type: 'success' }); setShowRatingModal(false); setRatingDetails({ score: 5, comment: "" }); }} className="flex-[2] h-16 rounded-2xl bg-primary text-primary-foreground font-black italic uppercase shadow-xl">Submit Review</Button>
                  </div>
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
      </main>
    </div>
  );
}
