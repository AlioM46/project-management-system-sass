import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cookies } from "next/headers";
import { ChevronDown, Hexagon, LayoutDashboard } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { MobileMenu } from "./MobileMenu";

export default async function Navbar() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has("access_token");

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg group-hover:scale-105 transition-transform">
                <Hexagon className="h-5 w-5 absolute" strokeWidth={2.5} />
                <div className="h-2 w-2 bg-white rounded-full absolute" />
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Nexus
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              <div className="relative group/nav px-3 py-2">
                <button className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                  Product <ChevronDown className="h-3 w-3 opacity-50 group-hover/nav:rotate-180 transition-transform duration-200" />
                </button>
                {/* Dropdown for Product */}
                <div className="absolute top-full left-0 w-48 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:pointer-events-auto transition-all duration-200">
                  <div className="bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden p-2 flex flex-col gap-1">
                    <Link href="#features" className="px-3 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-white/5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Features</Link>
                    <Link href="#" className="px-3 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-white/5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Integrations</Link>
                    <Link href="#" className="px-3 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-white/5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Security</Link>
                  </div>
                </div>
              </div>

              <div className="relative group/nav px-3 py-2">
                <button className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                  Solutions <ChevronDown className="h-3 w-3 opacity-50 group-hover/nav:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute top-full left-0 w-48 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:pointer-events-auto transition-all duration-200">
                  <div className="bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden p-2 flex flex-col gap-1">
                    <Link href="#" className="px-3 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-white/5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Enterprise</Link>
                    <Link href="#" className="px-3 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-white/5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Small Business</Link>
                    <Link href="#" className="px-3 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-white/5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Startups</Link>
                  </div>
                </div>
              </div>

              <Link href="#" className="px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                Resources
              </Link>
              <Link href="#pricing" className="px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                Pricing
              </Link>
            </div>
          </div>

          {/* Desktop Navigation Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />

            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-full px-5 font-semibold shadow-[0_0_15px_rgba(37,99,235,0.3)] gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <LogoutButton />
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full px-4">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-full px-5 font-semibold shadow-md">
                    Start Free Trial
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <MobileMenu isLoggedIn={isLoggedIn} />

        </div>
      </div>
    </nav>
  );
}
