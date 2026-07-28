import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import LoginPage from "@/feature/auth/pages/LoginPage";

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading login form...</p>
      </div>
    }>
      <LoginPage />
    </Suspense>
  );
}
