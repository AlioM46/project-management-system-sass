"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Hexagon, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { removeCookie } from "@/shared/utils/cookies";
import { useRouter } from "next/navigation";

interface MobileMenuProps {
  isLoggedIn: boolean;
}

export function MobileMenu({ isLoggedIn }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = () => {
    removeCookie("access_token");
    removeCookie("workspace_id");
    setIsOpen(false);
    router.push("/");
    router.refresh();
  };

  const toggleAccordion = (name: string) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  const navItems = [
    {
      name: "Product",
      subLinks: [
        { name: "Features", href: "#features" },
        { name: "Integrations", href: "#" },
        { name: "Security", href: "#" },
      ]
    },
    {
      name: "Solutions",
      subLinks: [
        { name: "Enterprise", href: "#" },
        { name: "Small Business", href: "#" },
        { name: "Startups", href: "#" },
      ]
    },
    { name: "Resources", href: "#" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <div className="md:hidden flex items-center gap-2">
      <ThemeToggle />
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      {mounted && createPortal(
        <div 
          className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-out Drawer */}
          <div 
            className={`absolute top-0 right-0 h-[100dvh] w-[320px] max-w-full bg-white dark:bg-[#0a0a0a] border-l border-zinc-200 dark:border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {/* Header */}
            <div className="flex justify-between items-center h-16 px-6 shrink-0 border-b border-zinc-200 dark:border-white/10">
              <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                <div className="relative flex items-center justify-center h-7 w-7 rounded bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow">
                  <Hexagon className="h-4 w-4 absolute" strokeWidth={2.5} />
                  <div className="h-1.5 w-1.5 bg-white rounded-full absolute" />
                </div>
                <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  Nexus
                </span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-6 px-6 flex flex-col gap-1">
              {navItems.map((item) => (
                <div key={item.name} className="flex flex-col">
                  {item.subLinks ? (
                    <>
                      <button 
                        onClick={() => toggleAccordion(item.name)}
                        className="flex items-center justify-between py-3 text-lg font-semibold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {item.name}
                        <ChevronDown className={`h-5 w-5 text-zinc-400 transition-transform duration-200 ${openAccordion === item.name ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`flex flex-col gap-3 pl-4 overflow-hidden transition-all duration-300 ${openAccordion === item.name ? 'max-h-48 opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
                        {item.subLinks.map(sub => (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={() => setIsOpen(false)}
                            className="text-base font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="py-3 text-lg font-semibold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Footer / Auth Actions */}
            <div className="p-6 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02]">
              {isLoggedIn ? (
                <div className="flex flex-col gap-3">
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold rounded-xl">
                      <LayoutDashboard className="h-4 w-4" />
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full h-12 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 gap-2 font-semibold rounded-xl"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/register" onClick={() => setIsOpen(false)}>
                    <Button className="w-full h-12 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold rounded-xl">
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full h-12 border-zinc-200 dark:border-white/10 dark:text-white font-semibold rounded-xl">
                      Log in
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
