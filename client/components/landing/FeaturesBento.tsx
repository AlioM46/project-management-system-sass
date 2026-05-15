import { LayoutDashboard, Users, Shield, Zap, Globe, MessageSquare } from "lucide-react";

export default function FeaturesBento() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-zinc-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase mb-3">Power & Flexibility</h2>
          <p className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            Everything you need to scale.
          </p>
          <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
            A comprehensive suite of tools perfectly engineered for modern product teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto animate-fade-in-up animate-delay-200">
          
          {/* Large Card 1 */}
          <div className="md:col-span-2 relative group overflow-hidden rounded-3xl bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-8 sm:p-10 z-10 relative">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-6">
                <LayoutDashboard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Infinite Workspaces</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-md">
                Create dedicated spaces for every team, client, or project. Isolate context while maintaining global visibility across your entire organization.
              </p>
            </div>
            {/* Abstract UI inside card */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl transform rotate-12 group-hover:rotate-6 transition-transform duration-500 flex flex-col p-4 gap-3">
               <div className="h-8 w-3/4 bg-zinc-200 dark:bg-white/10 rounded-md" />
               <div className="h-4 w-full bg-zinc-100 dark:bg-white/5 rounded-sm" />
               <div className="h-4 w-5/6 bg-zinc-100 dark:bg-white/5 rounded-sm" />
            </div>
          </div>

          {/* Small Card 1 */}
          <div className="relative group overflow-hidden rounded-3xl bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
            <div className="p-8 sm:p-10 z-10 relative h-full flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Enterprise Security</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Granular role-based access control. Ensure the right people see the right data at the right time.
                </p>
              </div>
            </div>
          </div>

          {/* Small Card 2 */}
          <div className="relative group overflow-hidden rounded-3xl bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
            <div className="p-8 sm:p-10 z-10 relative h-full flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Lightning Fast</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Built on modern edge architecture. Experience zero-latency updates and instant page loads.
                </p>
              </div>
            </div>
          </div>

          {/* Large Card 2 */}
          <div className="md:col-span-2 relative group overflow-hidden rounded-3xl bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-8 sm:p-10 z-10 relative">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Real-time Collaboration</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-md">
                No more stepping on toes. See who is working on what in real-time. Leave comments, tag teammates, and move faster together.
              </p>
            </div>
            {/* Abstract avatars */}
            <div className="absolute top-8 right-8 flex -space-x-3 group-hover:space-x-1 transition-all duration-500">
               <div className="h-12 w-12 rounded-full border-2 border-white dark:border-[#111] bg-gradient-to-br from-red-400 to-rose-600 shadow-md" />
               <div className="h-12 w-12 rounded-full border-2 border-white dark:border-[#111] bg-gradient-to-br from-blue-400 to-indigo-600 shadow-md" />
               <div className="h-12 w-12 rounded-full border-2 border-white dark:border-[#111] bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
