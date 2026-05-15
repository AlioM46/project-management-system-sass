import { Star } from "lucide-react";

const testimonials = [
  {
    content: "PM SaaS has completely transformed how our engineering team operates. We've cut our planning time in half and shipping velocity is up 40%.",
    author: "Sarah Chen",
    role: "VP of Engineering, TechFlow",
    initials: "SC",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
  },
  {
    content: "The real-time collaboration features are unmatched. It finally feels like our remote team is working in the same room together.",
    author: "Marcus Rodriguez",
    role: "Product Manager, StartupX",
    initials: "MR",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
  },
  {
    content: "We evaluated dozens of tools before choosing PM SaaS. The security features and granular permissions were exactly what our enterprise needed.",
    author: "Emily Watson",
    role: "Director of IT, GlobalCorp",
    initials: "EW",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 sm:py-32 bg-zinc-50 dark:bg-[#0a0a0a] transition-colors duration-300 border-t border-zinc-200 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase mb-3">Loved by Teams</h2>
          <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Don't just take our word for it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto animate-fade-in-up animate-delay-200">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="flex flex-col p-8 rounded-3xl bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="flex-1 text-lg text-zinc-700 dark:text-zinc-300 mb-8 font-medium leading-relaxed">
                "{testimonial.content}"
              </blockquote>
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${testimonial.color}`}>
                  {testimonial.initials}
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-white">{testimonial.author}</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Trusted By Marquee (Simplified static version for mockup) */}
        <div className="mt-24 pt-10 border-t border-zinc-200 dark:border-white/5 animate-fade-in-up animate-delay-400">
          <p className="text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-8">Trusted by innovative teams worldwide</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale contrast-200 dark:invert">
            {/* Using text logos for demonstration since we don't have SVGs */}
            <span className="text-xl font-black tracking-tighter">ACME Corp</span>
            <span className="text-xl font-black tracking-tighter">GLOBAL</span>
            <span className="text-xl font-black tracking-tighter">TechFlow</span>
            <span className="text-xl font-black tracking-tighter">StudioX</span>
            <span className="text-xl font-black tracking-tighter">QUANTUM</span>
          </div>
        </div>
      </div>
    </section>
  );
}
