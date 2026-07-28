import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import RegisterPage from "@/feature/auth/pages/RegisterPage";

export default function Register() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading registration form...</p>
      </div>
    }>
      <RegisterPage />
    </Suspense>
  );
}
