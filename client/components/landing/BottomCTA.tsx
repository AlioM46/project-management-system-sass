import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function BottomCTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#050505] transition-colors duration-300">
      <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-16 text-center shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to transform your workflow?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
            Join thousands of teams who trust PM SaaS to power their most important projects. 
            Start your 14-day free trial today.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" className="h-12 px-8 text-base bg-white text-blue-600 hover:bg-blue-50">
              Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white text-white hover:bg-white/10">
              Contact Sales
            </Button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
      </div>
    </section>
  );
}
