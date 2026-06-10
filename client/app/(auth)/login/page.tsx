// This will be your Login page at 'http://localhost:3000/login'
import { Suspense } from "react";
import Login from "@/features/auth/pages/Login";

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <Login />
        </Suspense>
    )
}
