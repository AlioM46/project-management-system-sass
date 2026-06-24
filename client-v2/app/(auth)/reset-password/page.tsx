import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ResetPasswordPage from "@/feature/auth/pages/ResetPasswordPage";

interface PageProps {
    searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPassword({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const token = resolvedSearchParams.token ?? "";
    const email = resolvedSearchParams.email ?? "";

    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading password reset form...</p>
            </div>
        }>
            <ResetPasswordPage token={token} email={email} />
        </Suspense>
    );
}
