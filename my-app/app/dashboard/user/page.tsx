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
  User,
  Image as ImageIcon,
  DollarSign
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
  const [messages, setMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(profileData || { full_name: user.user_metadata?.full_name || user.email?.split('@')[0] });

      // 2. Fetch Photographers with their portfolios
      const { data: photographersData } = await supabase
        .from('profiles')
        .select(`
          *,
          portfolios (*)
        `)
        .eq('role', 'PHOTOGRAPHER');

      setPhotographers(photographersData || []);

      // 3. Fetch User's Personal Data
      const [bookingsRes, favRes, msgRes] = await Promise.all([
        supabase.from('bookings').select('*, photographer:profiles!photographer_id(*)').eq('client_id', user.id),
        supabase.from('favorites').select('*, photographer:profiles!photographer_id(*)').eq('client_id', user.id),
        supabase.from('messages').select('*').eq('receiver_id', user.id)
      ]);

      setBookings(bookingsRes.data || []);
      setFavorites(favRes.data || []);
      setMessages(msgRes.data || []);

      setLoading(false);
    }
    fetchData();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredPhotographers = photographers.filter(p =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      {/* User Sidebar */}
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
          <SidebarItem icon={MessageSquare} label="Messages" active={activeTab === "messages"} onClick={() => setActiveTab("messages")} badge={messages.length} />
        </nav>

        <div className="p-4 border-t border-border/50">
          <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-3 font-semibold italic">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Areas */}
      <main className="flex-1 px-6 lg:px-12 py-10 overflow-y-auto w-full max-w-7xl mx-auto">
        <AnimatePresence mode="wait">

          {/* ===================== OVERVIEW TAB ===================== */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-extrabold font-serif tracking-tight text-foreground italic">
                  Welcome, {profile?.full_name?.split(' ')[0]} <span className="text-primary">.</span>
                </h1>
                <p className="text-muted-foreground max-w-lg">Manage your photography sessions and explore elite creators.</p>
              </div>

              {/* Quick Stats */}
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
                <Card className="bg-amber-500/5 border-amber-500/20">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-widest text-amber-500">New Messages</p><h3 className="text-3xl font-black italic">{messages.length}</h3></div>
                    <MessageSquare className="w-8 h-8 text-amber-500 opacity-50" />
                  </CardContent>
                </Card>
              </div>

              {/* Discover Snippet */}
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
                      </div>
                      <CardContent className="p-5 space-y-3">
                        <div>
                          <h4 className="text-lg font-black italic tracking-tight">{p.full_name}</h4>
                          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground italic">Professional Storyteller</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black italic text-xs h-10 shadow-lg shadow-primary/20"
                            onClick={() => router.push(`/photographer/${p.id}`)}
                          >
                            Book Session
                          </Button>
                          <Button variant="outline" className="w-10 h-10 p-0 border-2"><Heart className="w-4 h-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===================== DISCOVER TAB ===================== */}
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
                          <p className="text-white/80 text-xs italic line-clamp-3 mb-4">"Capturing the raw beauty of human connection through natural light and cinematic composition."</p>
                          <Button className="w-full bg-white text-black hover:bg-primary hover:text-white font-black italic tracking-widest uppercase py-6">View Portfolio</Button>
                        </div>
                      </div>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="cursor-pointer" onClick={() => router.push(`/photographer/${p.id}`)}>
                            <h4 className="text-xl font-black italic tracking-tight group-hover:text-primary transition-colors">{p.full_name}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="flex items-center gap-1 text-primary"><Star className="w-3 h-3 fill-current" /><span className="text-xs font-black italic">5.0</span></div>
                              <div className="w-1 h-1 rounded-full bg-border" />
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Wedding • Portrait</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black italic text-foreground tracking-tighter">$250</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">per session</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-border/50 flex gap-3">
                          <Button className="flex-1 rounded-xl font-bold bg-primary italic text-xs" onClick={() => router.push(`/photographer/${p.id}`)}>Book Discovery</Button>
                          <Button variant="ghost" className="w-10 h-10 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"><Heart className="w-5 h-5" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===================== APPOINTMENTS TAB ===================== */}
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
                      <p className="text-muted-foreground max-w-xs mx-auto">Your visual story is waiting to be told. Discover elite photographers today.</p>
                    </div>
                    <Button onClick={() => setActiveTab("discover")} className="px-10 py-6 text-lg font-black italic bg-primary shadow-xl shadow-primary/20">Browse Elite Pros</Button>
                  </Card>
                ) : bookings.map((booking) => (
                  <Card key={booking.id} className="group hover:bg-muted/30 transition-all border-none ring-1 ring-border shadow-lg overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center">
                      <div className="w-full md:w-48 aspect-square bg-muted flex-shrink-0">
                        <img src={booking.photographer?.avatar_url || "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=400&q=80"} className="w-full h-full object-cover" />
                      </div>
                      <CardContent className="p-8 flex-1 flex flex-col md:flex-row justify-between w-full gap-8">
                        <div className="space-y-3">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            booking.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              booking.status === 'rejected' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                "bg-primary/10 text-primary border-primary/20"
                          )}>
                            {booking.status === 'confirmed' ? 'Confirmed Session' :
                              booking.status === 'rejected' ? 'Session Declined' :
                                'Pending Approval'}
                          </div>
                          <h4 className="text-2xl font-black italic tracking-tight">{booking.photographer?.full_name}</h4>
                          <p className="text-muted-foreground font-semibold flex items-center gap-2 italic">{booking.type}</p>
                          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> {booking.date}</span>
                            <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-primary" /> 10:00 AM</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center gap-4 border-t md:border-t-0 md:border-l border-border md:pl-12 pt-6 md:pt-0">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 italic">Investment Paid</p>
                            <h3 className="text-3xl font-black italic text-primary">{booking.amount}</h3>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="font-bold italic text-xs h-12 px-6">Modify</Button>
                            <Button className="bg-primary font-bold italic text-xs h-12 px-6">Enter Studio</Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
