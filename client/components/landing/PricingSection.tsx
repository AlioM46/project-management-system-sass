"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    description: "Perfect for small teams getting started with project management.",
    monthlyPrice: "$0",
    annualPrice: "$0",
    features: [
      "Up to 5 team members",
      "1 Workspace",
      "Basic task management",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "Advanced features for growing teams that need more power.",
    monthlyPrice: "$29",
    annualPrice: "$24",
    features: [
      "Up to 50 team members",
      "Unlimited Workspaces",
      "Advanced permissions",
      "Real-time collaboration",
      "Priority email support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Custom solutions for large organizations with complex needs.",
    monthlyPrice: "$99",
    annualPrice: "$89",
    features: [
      "Unlimited team members",
      "Custom integrations",
      "Dedicated account manager",
      "SSO & SAML",
      "24/7 Phone support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-white dark:bg-[#050505] transition-colors duration-300">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] bg-blue-500/10 dark:bg-blue-600/10 rounded-[100%] blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase mb-3">Simple Pricing</h2>
          <p className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            Choose the perfect plan.
          </p>
          <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
            No hidden fees. No surprise charges. Cancel anytime.
          </p>

          <div className="mt-10 flex justify-center items-center gap-3">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 dark:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#050505]"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
              Annually <span className="ml-1.5 inline-flex items-center rounded-full bg-green-100 dark:bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center animate-fade-in-up animate-delay-200">
          {plans.map((plan, index) => (
            <div 
              key={plan.name} 
              className={`relative flex flex-col p-8 rounded-3xl bg-white dark:bg-[#0a0a0a] border transition-all duration-300 ${
                plan.popular 
                  ? 'border-blue-500 dark:border-blue-500 shadow-2xl dark:shadow-[0_0_40px_rgba(59,130,246,0.2)] scale-100 md:scale-105 z-10' 
                  : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 text-center text-xs font-bold text-white shadow-sm">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{plan.name}</h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 min-h-[40px]">{plan.description}</p>
              </div>
              
              <div className="mb-8 flex items-baseline text-zinc-900 dark:text-white">
                <span className="text-5xl font-extrabold tracking-tight">
                  {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                </span>
                <span className="ml-1 text-xl font-semibold text-zinc-500 dark:text-zinc-400">/mo</span>
              </div>
              
              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mr-3" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={plan.popular ? "default" : "outline"} 
                className={`w-full rounded-full h-12 font-semibold ${
                  plan.popular 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                    : 'border-zinc-200 dark:border-white/20 dark:text-white dark:hover:bg-white/5'
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
