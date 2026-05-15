import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutDashboard, Users, Zap, Shield, BarChart3, MessageSquare } from "lucide-react";

const features = [
  {
    title: "Seamless Workspace Management",
    description: "Organize your projects, teams, and assets in dedicated workspaces. Switch contexts instantly.",
    icon: LayoutDashboard,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    title: "Advanced Roles & Permissions",
    description: "Fine-grained control over who can see and do what. Enterprise-grade security for teams of all sizes.",
    icon: Shield,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  {
    title: "Real-time Collaboration",
    description: "Work together with your team in real-time. Comments, mentions, and activity feeds keep everyone in sync.",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    title: "Lightning Fast Performance",
    description: "Built with the latest technologies for a smooth, lag-free experience. No more waiting for pages to load.",
    icon: Zap,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    title: "Insightful Analytics",
    description: "Track progress and identify bottlenecks with powerful data visualizations and reports.",
    icon: BarChart3,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    title: "Centralized Communication",
    description: "Keep project-related discussions where they belong. Integrated messaging and notification system.",
    icon: MessageSquare,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Everything you need to deliver on time
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            A comprehensive suite of tools designed to streamline your workflow and boost your team's productivity.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-md hover:shadow-xl transition-shadow duration-300 dark:bg-black overflow-hidden group">
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
