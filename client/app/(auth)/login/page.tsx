import { Suspense } from "react";
import Login from "@/features/auth/pages/Login";

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Login />
        </Suspense>
    )
}
