import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white dark:bg-[#050505] transition-colors duration-300">
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-500/10 to-transparent dark:from-blue-500/5" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-900 mb-8 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 animate-fade-in-up">
            <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
            <span className="flex gap-2">
              Introducing PM SaaS 2.0 <span className="hidden sm:inline text-zinc-400 dark:text-zinc-500">•</span>
              <Link href="#" className="hidden sm:inline font-semibold text-blue-600 dark:text-blue-400 hover:underline">Read the launch notes</Link>
            </span>
          </div>

          <h1 className="max-w-4xl text-5xl sm:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white animate-fade-in-up animate-delay-200">
            Manage projects with <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
              unmatched clarity.
            </span>
          </h1>
          
          <p className="mt-8 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 animate-fade-in-up animate-delay-400 leading-relaxed">
            The enterprise-grade platform that brings your teams, tasks, and timelines into perfect alignment. Built for scale, designed for speed.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in-up animate-delay-600 w-full sm:w-auto">
            <Button size="lg" className="h-14 px-8 text-base bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-full font-semibold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02]">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-full font-medium border-zinc-300 dark:border-white/20 dark:text-white dark:hover:bg-white/5 transition-all hover:scale-[1.02]">
              Contact Sales
            </Button>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-zinc-500 dark:text-zinc-400 animate-fade-in-up animate-delay-600">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> No credit card required</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 14-day free trial</div>
          </div>
        </div>
        
        {/* Abstract UI Representation */}
        <div className="mt-20 relative mx-auto max-w-5xl animate-fade-in-up animate-delay-800 perspective-[2000px]">
          <div className="relative rounded-2xl sm:rounded-[2rem] border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] shadow-2xl overflow-hidden transform-gpu rotate-x-[5deg] scale-[1.02] hover:rotate-x-0 hover:scale-100 transition-all duration-700 ease-out">
            
            {/* Fake Mac Toolbar */}
            <div className="h-12 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#0f0f0f] flex items-center px-6 gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>

            {/* Abstract Dashboard Grid */}
            <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 relative min-h-[400px]">
              {/* Sidebar abstract */}
              <div className="hidden md:flex flex-col gap-4 border-r border-zinc-100 dark:border-white/5 pr-6">
                <div className="h-8 w-2/3 rounded-md bg-zinc-100 dark:bg-white/5 mb-4" />
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-6 w-full rounded-md bg-zinc-50 dark:bg-white/[0.02]" />
                ))}
              </div>
              
              {/* Main content abstract */}
              <div className="md:col-span-2 flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="h-24 flex-1 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20" />
                  <div className="h-24 flex-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20" />
                  <div className="h-24 flex-1 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 hidden sm:block" />
                </div>
                <div className="h-64 w-full rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 relative overflow-hidden">
                   {/* Fake chart bars */}
                   <div className="absolute bottom-0 left-0 w-full flex items-end justify-between px-8 gap-4 h-full pt-10">
                     {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                       <div key={i} className="w-full bg-blue-500/20 dark:bg-blue-500/40 rounded-t-sm" style={{ height: `${h}%` }}>
                         <div className="w-full bg-blue-500 dark:bg-blue-400 h-1 rounded-t-sm" />
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 dark:via-white/5 opacity-0 hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          </div>
          
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] bg-blue-500/20 dark:bg-blue-600/20 rounded-[100%] blur-[100px] -z-10" />
        </div>
      </div>
      
      {/* Premium Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-20" />
    </section>
  );
}
