import { CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create your Workspace",
    description: "Set up your first workspace in seconds. Customize it to fit your team's unique brand and workflow requirements.",
    image: "/file.svg" // Placeholder or we could use another generated image later
  },
  {
    number: "02",
    title: "Invite your Team",
    description: "Onboard your team members with ease. Assign roles and permissions to ensure everyone has the access they need.",
    image: "/globe.svg" 
  },
  {
    number: "03",
    title: "Crush your Goals",
    description: "Start creating tasks, setting milestones, and tracking progress. Watch your productivity soar as your team stays in sync.",
    image: "/window.svg"
  }
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Get up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            We've simplified the project management lifecycle so you can focus on what matters: delivering results.
          </p>
        </div>
        
        <div className="space-y-24">
          {steps.map((step, index) => (
            <div key={index} className={`flex flex-col lg:items-center gap-12 lg:gap-24 ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
              <div className="flex-1 space-y-6">
                <span className="text-6xl font-black text-blue-600/10 dark:text-blue-400/10">
                  {step.number}
                </span>
                <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {step.description}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    <span>Quick and easy setup</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    <span>Intuitive user interface</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1">
                <div className="relative aspect-video rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center p-12 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-400 dark:text-zinc-600 font-medium text-center">
                    <img src={step.image} alt={step.title} className="w-32 h-32 opacity-20 dark:invert" />
                    <p className="mt-4">[Step Visualization]</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
