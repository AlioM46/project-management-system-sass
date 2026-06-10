// This file creates the actual URL for your app. 
// Because it's in 'app/register/page.tsx', it will be visible at 'http://localhost:3000/register'

import { Suspense } from "react";
import Register from "@/features/auth/pages/Register";

/**
 * In Next.js App Router, every page must be named 'Page' or exported as 'default'.
 */
export default function RegisterPage() {
    // We just show the Register component we built in the 'features' folder
    return (
        <Suspense fallback={null}>
            <Register />
        </Suspense>
    );
}
