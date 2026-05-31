import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type TeamSectionErrorProps = {
    title: string;
    message: string;
};

export function TeamSectionError({ title, message }: TeamSectionErrorProps) {
    return (
        <Alert
            variant="destructive"
            className="rounded-2xl border-red-200/80 bg-red-50/80 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10"
        >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    );
}
