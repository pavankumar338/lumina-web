import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { FeaturedPhotographers } from "@/components/FeaturedPhotographers";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { ArrowRight, Star, ShieldCheck, HeartPulse } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-black overflow-x-hidden">
      <Navbar />
      <Hero />
      <Categories />
      <FeaturedPhotographers />
      
      {/* Why Choose Lumina Section */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?q=80&w=3540&auto=format&fit=crop"
                alt="Photographer at work"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-10 left-10 p-8 glass-morphism rounded-3xl max-w-sm">
                <p className="text-white text-xl font-medium tracking-tight leading-relaxed italic">
                  &quot;The quality of professionals on Lumina is simply unmatched. It&apos;s my go-to platform for every brand shoot.&quot;
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary" />
                  <div>
                    <div className="text-white font-bold">Sarah Jenkins</div>
                    <div className="text-zinc-400 text-sm italic">Creative Director, Vogue</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl leading-tight text-serif">
                Why <span className="italic text-primary">Lumina</span> is the preferred choice for elite clients.
              </h2>
              <div className="mt-12 space-y-10">
                <FeatureItem 
                  icon={ShieldCheck}
                  title="Verified Professionals"
                  description="Every photographer undergoes a rigorous background check and portfolio review process before joining our network."
                />
                <FeatureItem 
                  icon={HeartPulse}
                  title="Seamless Experience"
                  description="From instant booking to secure payments and real-time chat, we handle the logistics so you can focus on the moment."
                />
                <FeatureItem 
                  icon={Star}
                  title="Unmatched Quality"
                  description="Access a curated selection of award-winning artists who specialize in capturing high-end, cinematic visuals."
                />
              </div>
              <div className="mt-16">
                <Button size="lg" variant="premium" className="rounded-2xl h-16 px-10 group">
                  Get Started Now
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="relative bg-primary rounded-[3rem] p-12 md:p-24 overflow-hidden shadow-2xl shadow-primary/30">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white opacity-10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                Ready to find <br />
                your <span className="text-serif italic">perfect</span> artist?
              </h2>
              <p className="mt-8 text-xl text-primary-foreground opacity-90 max-w-xl leading-relaxed">
                Join thousands of customers who trust Lumina to find world-class
                photographers for their most important life events.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row gap-6">
                <Button size="lg" className="bg-white text-primary border-none hover:bg-zinc-100 shadow-xl rounded-2xl h-16">
                  Book a Photographer
                </Button>
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 rounded-2xl h-16 px-8">
                  Become a Partner
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function FeatureItem({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex gap-6 group">
      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-black">
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
          {description}
        </p>
      </div>
    </div>
  );
}
