"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "How does the 14-day free trial work?",
    answer: "You get full access to all Pro features for 14 days, completely free. No credit card is required to sign up. If you choose not to upgrade after 14 days, your account will automatically downgrade to the free Starter plan."
  },
  {
    question: "Can I change my plan later?",
    answer: "Absolutely. You can upgrade, downgrade, or cancel your plan at any time from your billing settings. If you upgrade, the new pricing will be prorated for the remainder of your billing cycle."
  },
  {
    question: "What kind of support do you offer?",
    answer: "Starter plans include access to our community forum and extensive knowledge base. Pro plans get priority email support with a 24-hour SLA. Enterprise plans include 24/7 phone support and a dedicated account manager."
  },
  {
    question: "Is my data secure?",
    answer: "Security is our top priority. All data is encrypted at rest and in transit. We are SOC2 Type II compliant and perform regular third-party penetration testing. Enterprise customers also get SAML SSO and custom data residency options."
  },
  {
    question: "Do you offer discounts for non-profits or educational institutions?",
    answer: "Yes! We offer a 50% discount on all paid plans for qualifying non-profits, students, and educators. Please contact our sales team with your organization's details to apply."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 sm:py-32 bg-white dark:bg-[#050505] transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Everything you need to know about the product and billing.
          </p>
        </div>

        <div className="space-y-4 animate-fade-in-up animate-delay-200">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'border-blue-500/50 bg-blue-50/30 dark:border-blue-500/30 dark:bg-blue-500/5' 
                    : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 bg-transparent'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left focus:outline-none"
                >
                  <span className={`text-base font-semibold ${isOpen ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-900 dark:text-white'}`}>
                    {faq.question}
                  </span>
                  <span className={`ml-6 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${isOpen ? 'border-blue-200 bg-blue-100 text-blue-600 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-400' : 'border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500'}`}>
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
