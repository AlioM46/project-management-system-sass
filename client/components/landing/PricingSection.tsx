// client/components/landing/PricingSection.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    description: "Perfect for small teams and personal projects getting started.",
    monthlyPrice: "$0",
    annualPrice: "$0",
    periodText: "forever",
    features: [
      "Up to 5 team members",
      "Up to 3 projects",
      "Up to 100 tasks per project",
      "500 MB file storage",
      "10 MB max file upload",
      "Standard built-in roles",
    ],
    cta: "Get Started Free",
    href: "/register",
    popular: false,
  },
  {
    name: "Pro",
    description: "Supercharge your team with unlimited projects, analytics, and expanded storage.",
    monthlyPrice: "$15",
    annualPrice: "$12.50",
    periodText: "/ month",
    features: [
      "Up to 25 team members",
      "Unlimited projects & tasks",
      "20 GB (20,480 MB) file storage",
      "100 MB max file upload",
      "Up to 10 custom roles",
      "Activity audit logs",
      "Advanced analytics & charts",
      "Data export (CSV / Excel)",
    ],
    cta: "Start with Pro",
    href: "/register",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Maximum scale, custom security controls, priority support, and complete flexibility.",
    monthlyPrice: "$49",
    annualPrice: "$40.83",
    periodText: "/ month",
    features: [
      "Unlimited team members",
      "Unlimited projects & tasks",
      "Unlimited file storage",
      "500 MB max file upload",
      "Unlimited custom roles",
      "Activity audit logs",
      "Advanced analytics & charts",
      "Data export (CSV / Excel)",
      "24/7 Priority dedicated support",
    ],
    cta: "Scale with Enterprise",
    href: "/register",
    popular: false,
  },
];

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-white dark:bg-[#050505] transition-colors duration-300 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] bg-blue-500/10 dark:bg-blue-600/10 rounded-[100%] blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase mb-3">
            Transparent Pricing
          </h2>
          <p className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            Choose the right plan for your team.
          </p>
          <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
            Start free, upgrade as you grow. No hidden fees. Cancel anytime.
          </p>

          <div className="mt-8 flex justify-center items-center gap-3">
            <span className={`text-xs font-semibold ${!isAnnual ? "text-zinc-900 dark:text-white" : "text-zinc-500"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 dark:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${isAnnual ? "text-zinc-900 dark:text-white" : "text-zinc-500"}`}>
              <span>Yearly</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Save 17%
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col justify-between p-8 rounded-3xl bg-white dark:bg-[#0a0a0a] border transition-all duration-300 ${
                plan.popular
                  ? "border-blue-500 dark:border-blue-500 shadow-2xl dark:shadow-[0_0_40px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20"
                  : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-md flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Most Popular</span>
                </div>
              )}

              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{plan.name}</h3>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 min-h-[36px] leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6 flex items-baseline gap-1 text-zinc-900 dark:text-white">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {plan.name === "Free" ? "forever" : isAnnual ? "/ mo (billed annually)" : plan.periodText}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 text-xs border-t border-zinc-100 dark:border-white/5 pt-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-zinc-600 dark:text-zinc-300 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link href={plan.href} className="w-full">
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className={`w-full rounded-xl h-11 font-semibold text-xs cursor-pointer ${
                    plan.popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                      : "border-zinc-200 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
