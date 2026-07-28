import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import HomePage from "@/feature/home/pages/HomePage";

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}
