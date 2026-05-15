import Link from "next/link";
import { Globe, Send, Users } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-zinc-200 dark:bg-[#050505] dark:border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link href="#" className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300">
            <span className="sr-only">Twitter</span>
            <Send className="h-6 w-6" />
          </Link>
          <Link href="#" className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300">
            <span className="sr-only">GitHub</span>
            <Globe className="h-6 w-6" />
          </Link>
          <Link href="#" className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300">
            <span className="sr-only">LinkedIn</span>
            <Users className="h-6 w-6" />
          </Link>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-zinc-400">
            &copy; {new Date().getFullYear()} Project Management SaaS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
