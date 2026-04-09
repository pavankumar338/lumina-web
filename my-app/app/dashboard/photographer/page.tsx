"use client";

import React, { useEffect, useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  MessageSquare,
  MoreVertical,
  Settings,
  Star,
  LayoutDashboard,
  Calendar,
  LogOut,
  Plus,
  Phone,
  Mail,
  Upload,
  User,
  CheckCircle,
  XCircle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
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

export default function PhotographerDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [bookings, setBookings] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      } else {
        const metadata = user.user_metadata;
        setProfile({
          full_name: metadata?.full_name || user.email?.split('@')[0],
          role: metadata?.role || 'PHOTOGRAPHER',
          email: user.email
        });
      }

      const [bookingsRes, portfolioRes] = await Promise.all([
        supabase.from('bookings').select('*, client:profiles!client_id(*)').eq('photographer_id', user.id),
        supabase.from('portfolios').select('*').eq('photographer_id', user.id).order('created_at', { ascending: false })
      ]);

      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (portfolioRes.data) setPortfolio(portfolioRes.data);

      setLoading(false);
    }
    getProfile();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('portfolios')
        .insert({
          photographer_id: user.id,
          image_url: publicUrl,
          title: file.name
        });

      if (dbError) throw dbError;

      const { data: refreshedPortfolio } = await supabase
        .from('portfolios')
        .select('*')
        .eq('photographer_id', user.id)
        .order('created_at', { ascending: false });

      if (refreshedPortfolio) setPortfolio(refreshedPortfolio);
      setNotification({ message: "Masterpiece Uploaded: Your collection is updated.", type: 'success' });

    } catch (error: any) {
      setNotification({ message: "Signal Loss: Upload failed - " + error.message, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setProfile({ ...profile, avatar_url: publicUrl });
      setNotification({ message: "Identity Refined: Profile portrait updated.", type: 'success' });

    } catch (error: any) {
      setNotification({ message: "Acquisition Error: Portrait failed - " + error.message, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error: dbError } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      setPortfolio(portfolio.filter(p => p.id !== photoId));
      setNotification({ message: "Vision Purged: Content removed from gallery.", type: 'success' });
    } catch (error: any) {
      setNotification({ message: "Extraction Error: " + error.message, type: 'error' });
    }
  };

  const handleBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      setNotification({ 
        message: newStatus === 'confirmed' ? "Protocol Confirmed: Session accepted." : "Mission Aborted: Session declined.", 
        type: 'success' 
      });
    } catch (error: any) {
      setNotification({ message: "Command Error: " + error.message, type: 'error' });
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          specialty: profile.specialty,
          location: profile.location,
          rate: profile.rate,
          bio: profile.bio
        })
        .eq('id', user.id);

      if (error) throw error;
      setNotification({ message: "Core Profile Synchronized: Intelligence updated.", type: 'success' });
    } catch (error: any) {
      setNotification({ message: "Sync Error: " + error.message, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

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
        <div className="p-6 border-b border-border/50 flex flex-col gap-4">
          {profile?.avatar_url && (
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-border shadow-sm">
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h2 className="font-serif font-black text-xl italic tracking-tight underline decoration-primary decoration-2 underline-offset-4">{profile?.full_name?.split(' ')[0] || 'Pro'}&apos;s Studio</h2>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">Management Console</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <SidebarItem icon={Calendar} label="All Bookings" active={activeTab === "bookings"} onClick={() => setActiveTab("bookings")} badge={bookings.length} />
          <SidebarItem icon={ImageIcon} label="Portfolio & Profile" active={activeTab === "portfolio"} onClick={() => setActiveTab("portfolio")} />
          <SidebarItem icon={Settings} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
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
              <div className="flex flex-col md:flex-row md:items-end justify-between items-center gap-6">
                <div className="space-y-1 text-center md:text-left">
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold italic tracking-wider uppercase mb-1.5 border border-primary/20 backdrop-blur-sm">
                    <Star className="w-3.5 h-3.5 fill-current" /> Premium Photographer
                  </motion.div>
                  <h1 className="text-4xl md:text-5xl font-extrabold font-serif tracking-tight text-foreground italic">
                    {profile?.full_name?.split(' ')[0] || 'Pro'}&apos;s Hub <span className="text-primary">.</span>
                  </h1>
                  <p className="text-muted-foreground max-w-md">Welcome back, {profile?.full_name}. Here is your vision command center.</p>
                </div>
                <Button onClick={() => setActiveTab("portfolio")} size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black italic shadow-xl shadow-primary/20 transition-all px-8">
                  <Plus className="w-5 h-5" /> Upload Work
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Pending Requests</p><h3 className="text-3xl font-black italic">{bookings.filter(b => b.status === 'pending').length}</h3></div>
                    <Calendar className="w-8 h-8 text-primary opacity-50" />
                  </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Confirmed Sessions</p><h3 className="text-3xl font-black italic">{bookings.filter(b => b.status === 'confirmed').length}</h3></div>
                    <CheckCircle className="w-8 h-8 text-emerald-500 opacity-50" />
                  </CardContent>
                </Card>
                <Card className="bg-purple-500/5 border-purple-500/20">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-widest text-purple-500">Gallery Items</p><h3 className="text-3xl font-black italic">{portfolio.length}</h3></div>
                    <ImageIcon className="w-8 h-8 text-purple-500 opacity-50" />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-black italic tracking-tight font-serif uppercase underline decoration-primary decoration-4 underline-offset-8">Recent Activity</h2>
                <Card className="border-none shadow-2xl ring-1 ring-border overflow-hidden">
                  <div className="divide-y divide-border/30">
                    {bookings.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground font-medium italic">No active bookings yet. Time to promote your portfolio!</div>
                    ) : bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="p-8 flex flex-col sm:flex-row items-center sm:justify-between hover:bg-muted/30 transition-all group">
                        <div className="flex items-center gap-6 mb-4 sm:mb-0">
                          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border-2 rotate-[-4deg] group-hover:rotate-0 transition-all", booking.status === 'confirmed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary")}>
                             {booking.client?.avatar_url ? <img src={booking.client.avatar_url} className="w-full h-full object-cover rounded-2xl" /> : <User className="w-7 h-7" />}
                          </div>
                          <div>
                            <h4 className="text-lg font-black italic tracking-tight text-foreground">{booking.client?.full_name || 'Client'}</h4>
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{booking.type || 'Standard Session'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="font-black text-foreground italic">{booking.date}</p>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">{booking.status === 'pending' ? 'Awaiting Protocol' : 'Elite Access Confirmed'}</p>
                          </div>
                          <div className="flex gap-2">
                             {booking.status === 'pending' ? (
                               <>
                                 <Button size="sm" onClick={() => handleBookingStatus(booking.id, 'confirmed')} className="bg-emerald-500 hover:bg-emerald-600 font-black italic h-10 px-6">Accept</Button>
                                 <Button size="sm" variant="destructive" onClick={() => handleBookingStatus(booking.id, 'rejected')} className="font-black italic h-10 px-6">Decline</Button>
                               </>
                             ) : (
                               <div className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic border", booking.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20")}>
                                 {booking.status === 'confirmed' ? 'Protocol Executed' : 'Session Terminated'}
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "bookings" && (
            <motion.div key="bookings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h1 className="text-4xl font-black italic font-serif">Customer Sessions</h1>
              <Card className="border-none shadow-2xl ring-1 ring-border overflow-hidden">
                <div className="divide-y divide-border/30">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="p-8 flex items-center justify-between hover:bg-muted/30 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary italic font-black">
                           <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black italic">{booking.client?.full_name || 'Client'}</h4>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{booking.date} @ {booking.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="text-right">
                            <p className="text-xl font-black italic text-primary">{booking.amount}</p>
                            <div className={cn("inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mt-1 border", booking.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-primary/10 text-primary border-primary/20")}>
                              {booking.status}
                            </div>
                         </div>
                         {booking.status === 'pending' && (
                           <div className="flex gap-2">
                             <Button size="sm" onClick={() => handleBookingStatus(booking.id, 'confirmed')} className="bg-emerald-500 h-10 px-6 font-black italic uppercase text-[10px] tracking-widest">Accept</Button>
                             <Button size="sm" variant="destructive" onClick={() => handleBookingStatus(booking.id, 'rejected')} className="h-10 px-6 font-black italic uppercase text-[10px] tracking-widest">Decline</Button>
                           </div>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "portfolio" && (
            <motion.div key="portfolio" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-10">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black italic font-serif leading-none">Vision Command</h2>
                  <p className="text-muted-foreground italic font-medium">Curate your elite gallery and profile identity.</p>
                </div>
                <Button onClick={handleUpdateProfile} disabled={isUploading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black italic h-14 px-10 shadow-xl shadow-primary/20">
                  {isUploading ? "Syncing..." : "Publish Vision"}
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-6">
                  <Card className="border-none shadow-2xl ring-1 ring-border p-8 bg-background/50 backdrop-blur-xl">
                    <div className="flex flex-col items-center gap-6 mb-8">
                       <div className="relative group">
                         <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-primary/10 shadow-2xl bg-muted rotate-3 group-hover:rotate-0 transition-transform duration-500">
                           {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User className="w-16 h-16 text-muted-foreground m-auto h-full" />}
                         </div>
                         <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] cursor-pointer">
                           <Upload className="text-white w-8 h-8" />
                           <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                         </label>
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">Redesign Persona Portrait</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 italic pl-1">Professional Moniker</Label>
                        <Input className="h-12 rounded-2xl border-2 font-bold italic" value={profile?.full_name || ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 italic pl-1">Artistic Specialty</Label>
                        <Input className="h-12 rounded-2xl border-2 font-bold italic" value={profile?.specialty || ""} onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 italic pl-1">HQ Location</Label>
                        <Input className="h-12 rounded-2xl border-2 font-bold italic" value={profile?.location || ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 italic pl-1">Session Investment</Label>
                        <Input className="h-12 rounded-2xl border-2 font-bold italic" value={profile?.rate || ""} onChange={(e) => setProfile({ ...profile, rate: e.target.value })} />
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="lg:col-span-8 space-y-8">
                   <Card className="border-none shadow-2xl ring-1 ring-border p-8">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-primary decoration-4 underline-offset-8">Masterpieces</h3>
                        <label className={cn("px-6 py-3 rounded-xl bg-primary text-primary-foreground font-black italic cursor-pointer shadow-lg shadow-primary/20", isUploading && "opacity-50")}>
                          {isUploading ? "Uploading..." : "Add Masterpiece"}
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {portfolio.map((photo) => (
                          <div key={photo.id} className="aspect-square rounded-3xl relative group overflow-hidden border-2 border-border shadow-md">
                            <img src={photo.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                               <Button variant="destructive" size="sm" onClick={() => handleDeletePhoto(photo.id)} className="font-black italic uppercase tracking-tighter h-10 px-6">Delete</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                   </Card>
                </div>
              </div>
            </motion.div>
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
