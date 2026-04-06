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
  Upload,
  User,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
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
  const [messages, setMessages] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Pre-set profile from auth metadata for immediate display
      const metadata = user.user_metadata;
      setProfile({
        full_name: metadata?.full_name || user.email?.split('@')[0],
        role: metadata?.role || 'PHOTOGRAPHER',
        email: user.email
      });

      // Try to fetch official profile from the database
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch Realtime Photographer Data
      const [bookingsRes, msgRes, portfolioRes] = await Promise.all([
        supabase.from('bookings').select('*').eq('photographer_id', user.id),
        supabase.from('messages').select('*').eq('receiver_id', user.id),
        supabase.from('portfolios').select('*').eq('photographer_id', user.id).order('created_at', { ascending: false })
      ]);

      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (msgRes.data) setMessages(msgRes.data);
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

      // 1. Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('portfolio-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(filePath);

      // 3. Save Record to Portfolios table
      const { error: dbError } = await supabase
        .from('portfolios')
        .insert({
          photographer_id: user.id,
          image_url: publicUrl,
          title: file.name
        });

      if (dbError) throw dbError;

      // 4. Refresh Portfolio
      const { data: refreshedPortfolio } = await supabase
        .from('portfolios')
        .select('*')
        .eq('photographer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (refreshedPortfolio) setPortfolio(refreshedPortfolio);

    } catch (error: any) {
      alert("Error uploading image: " + error.message);
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

      // 1. Upload to Supabase Storage - Use portfolio-images bucket
      // Check if bucket exists or just try to upload
      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(filePath);

      // 3. Update profile record
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // 4. Update UI
      setProfile({ ...profile, avatar_url: publicUrl });
      alert("Profile picture updated successfully!");

    } catch (error: any) {
      alert("Error uploading avatar: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    try {
      // 1. Delete DB entry
      const { error: dbError } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', photoId);
      
      if (dbError) throw dbError;

      // 2. Update UI
      setPortfolio(portfolio.filter(p => p.id !== photoId));
    } catch (error: any) {
      alert("Error deleting image: " + error.message);
    }
  };

  const handleBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
      
      if (error) throw error;

      // Update UI state
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      alert(`Booking ${newStatus} successfully!`);
    } catch (error: any) {
      alert("Error updating booking: " + error.message);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsUploading(true); // Reusing isUploading for profile progress
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
      alert("Profile updated successfully!");
    } catch (error: any) {
      alert("Error updating profile: " + error.message);
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
      {/* Dynamic Sidebar */}
      <aside className="w-64 bg-background border-r border-border hidden lg:flex flex-col sticky top-20 h-[calc(100vh-5rem)]">
        <div className="p-6 border-b border-border/50 flex flex-col gap-4">
          {profile?.avatar_url && (
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-border shadow-sm">
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h2 className="font-serif font-black text-xl italic tracking-tight">{profile?.full_name?.split(' ')[0] || 'Pro'}&apos;s Studio</h2>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">Management Console</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <SidebarItem icon={Calendar} label="All Bookings" active={activeTab === "bookings"} onClick={() => setActiveTab("bookings")} badge={bookings.length} />
          <SidebarItem icon={ImageIcon} label="Portfolio & Profile" active={activeTab === "portfolio"} onClick={() => setActiveTab("portfolio")} />
          <SidebarItem icon={MessageSquare} label="Messages" active={activeTab === "messages"} onClick={() => setActiveTab("messages")} badge={messages.length} />
          <SidebarItem icon={Settings} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </nav>

        <div className="p-4 border-t border-border/50">
          <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-3 font-semibold">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 px-6 lg:px-12 py-10 overflow-y-auto w-full max-w-7xl mx-auto">
        
        {/* ===================== OVERVIEW TAB ===================== */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 group">
            <div className="flex flex-col md:flex-row md:items-end justify-between items-center gap-6">
              <div className="space-y-1 text-center md:text-left">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold italic tracking-wider uppercase mb-1.5 border border-primary/20 backdrop-blur-sm">
                  <Star className="w-3.5 h-3.5 fill-current" /> Premium Photographer
                </motion.div>
                <div className="flex items-center gap-6 mb-2">
                  <h1 className="text-4xl md:text-5xl font-extrabold font-serif tracking-tight text-foreground">
                    {profile?.full_name?.split(' ')[0] || 'Pro'}&apos;s Hub <span className="text-primary italic opacity-90 inline-block rotate-[-2deg] transition-transform group-hover:rotate-0 duration-500">.</span>
                  </h1>
                </div>
                <p className="text-muted-foreground max-w-md">Welcome back, {profile?.full_name}. Here is your vision command center.</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <Button onClick={() => setActiveTab("portfolio")} size="lg" className="flex-1 md:flex-none gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20 transition-all px-8 border-2">
                  <ImageIcon className="w-4.5 h-4.5" /> Upload Work
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Recent Bookings */}
              <div className="lg:col-span-8 space-y-6">
                <Card className="border-none shadow-2xl shadow-black/5 bg-background overflow-hidden ring-1 ring-border">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 px-8 py-7 bg-muted/[0.15]">
                    <div>
                      <CardTitle className="text-2xl font-serif font-black italic tracking-tight">Recent Sessions</CardTitle>
                      <CardDescription className="font-medium mt-0.5">Your most recent customer requests</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/30">
                      {bookings.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground font-medium italic">No active bookings yet. Time to promote your portfolio!</div>
                      ) : bookings.slice(0, 3).map((booking) => (
                        <div key={booking.id} className="p-8 flex flex-col sm:flex-row items-center sm:justify-between hover:bg-muted/30 transition-all cursor-pointer group/row">
                          <div className="flex items-center gap-6 w-full sm:w-auto mb-4 sm:mb-0">
                            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center border border-border group-hover/row:border-primary/30 group-hover/row:bg-primary/5 transition-all rotate-[-3deg] group-hover/row:rotate-0">
                              <ImageIcon className="w-7 h-7 text-muted-foreground group-hover/row:text-primary transition-colors" />
                            </div>
                            <div>
                              <h4 className="text-lg font-black italic tracking-tight text-foreground">{booking.client?.full_name || 'Client'}</h4>
                              <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> {booking.type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between w-full sm:w-auto gap-8 sm:gap-12">
                            <div className="text-left sm:text-right">
                              <p className="font-black text-foreground italic">{booking.date}</p>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{booking.time}</p>
                              <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary italic">{booking.status}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              {booking.status === 'pending' ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="bg-emerald-500 hover:bg-emerald-600 font-bold italic h-9 px-4"
                                    onClick={() => handleBookingStatus(booking.id, 'confirmed')}
                                  >
                                    Accept
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="font-bold italic h-9 px-4"
                                    onClick={() => handleBookingStatus(booking.id, 'rejected')}
                                  >
                                    Reject
                                  </Button>
                                </>
                              ) : (
                                <div className="h-10 w-[2px] bg-border/40 hidden sm:block" />
                              )}
                              <p className="text-xl font-black italic text-foreground tracking-tighter ml-2">{booking.amount}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Inbox Summary */}
              <div className="lg:col-span-4">
                 <Card className="border-none shadow-2xl shadow-black/5 bg-background ring-1 ring-border group/tools">
                  <CardHeader className="border-b border-border/50 px-7 py-6">
                    <CardTitle className="text-xl font-serif font-black italic">Inbox</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/30">
                      {messages.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground italic">Your inbox is quiet.</div>
                      ) : messages.map((msg) => (
                        <div key={msg.id} className="p-6 flex items-start gap-4 hover:bg-muted/30 transition-all cursor-pointer relative overflow-hidden group/msg">
                          <div className="w-11 h-11 min-w-[44px] bg-muted rounded-xl flex items-center justify-center font-black italic">
                            {msg.sender?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-black italic text-foreground truncate">{msg.sender?.full_name || 'Unknown'}</p>
                            <p className="text-xs line-clamp-1 italic text-muted-foreground font-medium">"{msg.text}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===================== ALL BOOKINGS TAB ===================== */}
        {activeTab === "bookings" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-3xl font-extrabold font-serif italic mb-6">Customer Bookings</h2>
            <Card className="border-none shadow-xl overflow-hidden ring-1 ring-border">
              <CardContent className="p-0">
                 <div className="divide-y divide-border/30">
                      {bookings.length === 0 ? (
                        <div className="p-16 text-center text-muted-foreground font-medium italic">You have no booking history.</div>
                      ) : bookings.map((booking) => (
                        <div key={booking.id} className="p-8 flex items-center justify-between hover:bg-muted/30 transition-all">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary">
                              <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xl font-bold">{booking.client?.full_name || 'Client'}</h4>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest italic",
                                  booking.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-500" :
                                  booking.status === 'rejected' ? "bg-destructive/10 text-destructive" :
                                  "bg-primary/10 text-primary"
                                )}>
                                  {booking.status}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-muted-foreground">{booking.type}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <div className="text-right">
                              <p className="font-bold text-lg">{booking.date}</p>
                              <p className="text-sm font-bold text-muted-foreground uppercase">{booking.time} • <span className="text-foreground">{booking.amount}</span></p>
                            </div>
                            {booking.status === 'pending' && (
                              <div className="flex gap-2">
                                 <Button 
                                    size="sm" 
                                    className="bg-emerald-500 hover:bg-emerald-600 font-bold italic h-8 px-3 text-[10px]"
                                    onClick={() => handleBookingStatus(booking.id, 'confirmed')}
                                  >
                                    Accept
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="font-bold italic h-8 px-3 text-[10px]"
                                    onClick={() => handleBookingStatus(booking.id, 'rejected')}
                                  >
                                    Reject
                                  </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ===================== PORTFOLIO & PROFILE TAB ===================== */}
        {activeTab === "portfolio" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex justify-between items-end">
              <h2 className="text-3xl font-extrabold font-serif italic">Portfolio Management</h2>
              <Button 
                onClick={handleUpdateProfile} 
                disabled={isUploading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20 gap-2"
              >
                 {isUploading ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Details */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-xl ring-1 ring-border">
                  <CardHeader>
                    <CardTitle className="italic font-serif">Public Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-4 mb-4">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl bg-muted">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted-foreground/10">
                              <User className="w-12 h-12" />
                            </div>
                          )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                          <Upload className="text-white w-6 h-6" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Click to update portrait</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Display Name</Label>
                      <Input 
                        value={profile?.full_name || ""} 
                        onChange={(e) => setProfile({...profile, full_name: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Specialty (e.g. Wedding, Portrait)</Label>
                      <Input 
                        value={profile?.specialty || ""} 
                        onChange={(e) => setProfile({...profile, specialty: e.target.value})} 
                        placeholder="Wedding & Commercial" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Operational Location (City, State)</Label>
                      <Input 
                        value={profile?.location || ""} 
                        onChange={(e) => setProfile({...profile, location: e.target.value})} 
                        placeholder="Los Angeles, CA" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hourly Rate / Minimum</Label>
                      <Input 
                        value={profile?.rate || ""} 
                        onChange={(e) => setProfile({...profile, rate: e.target.value})} 
                        placeholder="$250 / session" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <textarea 
                        className="w-full h-32 rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                        value={profile?.bio || ""} 
                        onChange={(e) => setProfile({...profile, bio: e.target.value})} 
                        placeholder="Capturing raw moments and natural lighting." 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Photos Gallery */}
              <div className="lg:col-span-2 space-y-6">
                 <Card className="border-none shadow-xl ring-1 ring-border">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-serif font-bold italic">Gallery Images</h3>
                      <Button variant="outline" size="sm" className="gap-2 font-bold"><Plus className="w-4 h-4" /> Add Photo</Button>
                    </div>

                    {/* Real Portfolio Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {portfolio.map((photo) => (
                           <div key={photo.id} className="aspect-square bg-muted rounded-2xl relative group overflow-hidden border border-border shadow-sm">
                             <img src={photo.image_url} alt={photo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="font-bold shrink-0 shadow-lg"
                                  onClick={() => handleDeletePhoto(photo.id, photo.image_url)}
                                >
                                  Remove
                                </Button>
                             </div>
                           </div>
                        ))}
                        
                        <label className={cn(
                          "aspect-square bg-muted/30 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors text-muted-foreground hover:text-primary",
                          isUploading && "opacity-50 pointer-events-none"
                        )}>
                          {isUploading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                          ) : (
                            <>
                              <Plus className="w-8 h-8" />
                              <span className="text-xs font-bold uppercase tracking-widest">Add Photo</span>
                            </>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileUpload}
                            disabled={isUploading}
                          />
                        </label>
                    </div>
                  </CardContent>
                 </Card>
              </div>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}
