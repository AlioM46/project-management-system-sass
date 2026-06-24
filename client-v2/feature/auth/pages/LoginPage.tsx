"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { login as authLogin } from "@/feature/auth/api/auth";
import ApiError from "@/shared/api/ApiError";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { isValidLoginCredentials } from "@/shared/utils/validator";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [login, setLogin] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const router = useRouter();
    const next = "/dashboard";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const isValidLogin = isValidLoginCredentials(login, password);
        if (isValidLogin !== "") {
            setError(isValidLogin);
            toast.error(isValidLogin);
            return;
        }

        setIsLoading(true);

        try {
            await authLogin({ login, password });
            toast.success("Login successful!");
            setTimeout(() => {
                router.push(next);
            }, 2000);
        } catch (e) {
            if (e instanceof ApiError) {
                setError(e.message ?? "Login failed. Try a different email or username.");
                toast.error(e.message ?? "Login failed. Try a different email or username.");
            } else {
                setError("An unexpected error occurred.");
                toast.error("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!error) return;

        const timer = setTimeout(() => {
            setError("");
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    }, [error]);

    return (
        <div>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

            <h3>Login</h3>

            <form onSubmit={handleSubmit}>
                <p className="text-destructive">{error}</p>
                <label htmlFor="login"> email or username</label>
                <Input
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    type="text"
                    id="login"
                    name="login"
                    placeholder="email or username"
                    disabled={isLoading}
                />

                <label htmlFor="password"> password</label>
                <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    id="password"
                    name="password"
                    placeholder="password"
                    disabled={isLoading}
                />

                <Button type="submit" disabled={isLoading}>Login</Button>
                <Button type="button" onClick={() => router.push("/register")} disabled={isLoading}>Register</Button>
                <Button type="button" onClick={() => router.push("/forgot-password")} disabled={isLoading}>Forgot Password</Button>
            </form>
        </div>
    );
}
