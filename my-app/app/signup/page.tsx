"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, User, Check, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

import { createClient } from "@/lib/supabase/client";

type UserRole = "USER" | "PHOTOGRAPHER";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<UserRole>("USER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          role: role,
          username: email
        }
      }
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    // Explicitly update the profile in case the SQL trigger inserted NULL for the username
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([
          {
            id: data.user.id,
            full_name: `${firstName} ${lastName}`,
            role: role,
            username: email
          }
        ]);
        
      if (profileError) {
        console.error("Failed to insert profile:", profileError.message, profileError.code, profileError.details);
        setError(`Database Error: ${profileError.message || "Could not insert profile"}`);
      }
    }

    if (role === "PHOTOGRAPHER") {
      router.push("/dashboard/photographer");
    } else {
      router.push("/dashboard/user");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-28 pb-12 px-6 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_25%)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-none bg-background/60 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-amber-500 to-primary/80" />
          
          <CardHeader className="space-y-4 pt-10 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 flex items-center justify-center rounded-2xl mb-2">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl font-serif">Join Menorify</CardTitle>
              <CardDescription className="text-base mt-2">
                Join our premium community of visual storytellers
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium italic">
                {error}
              </div>
            )}
            <form onSubmit={handleSignup} className="space-y-6">
              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("USER")}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                    role === "USER" 
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50" 
                      : "border-border hover:border-primary/50 bg-background/40"
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-xl transition-colors",
                    role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold italic">Client</span>
                  {role === "USER" && (
                    <motion.div 
                      layoutId="roleCheck"
                      className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </motion.div>
                  )}
                  <p className="text-[10px] text-muted-foreground text-center line-clamp-1">Booking & Sessions</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("PHOTOGRAPHER")}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                    role === "PHOTOGRAPHER" 
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/50" 
                      : "border-border hover:border-primary/50 bg-background/40"
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-xl transition-colors",
                    role === "PHOTOGRAPHER" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold">Photographer</span>
                  {role === "PHOTOGRAPHER" && (
                    <motion.div 
                      layoutId="roleCheck"
                      className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </motion.div>
                  )}
                  <p className="text-[10px] text-muted-foreground text-center line-clamp-1">Portfolio & Bookings</p>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" placeholder="Jane" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" placeholder="Doe" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" name="email" type="email" placeholder="jane@example.com" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>

              <Button 
                type="submit" 
                className="w-full text-base py-6 rounded-2xl" 
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pb-8">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
