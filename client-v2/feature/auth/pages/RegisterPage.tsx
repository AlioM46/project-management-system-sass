"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { register as authRegister } from "@/feature/auth/api/auth";
import ApiError from "@/shared/api/ApiError";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { isValidRegisterCredentials } from "@/shared/utils/validator";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [name, setName] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const router = useRouter();
    const next = "/dashboard";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const isValidRegister = isValidRegisterCredentials(name, username, email, password);
        if (isValidRegister !== "") {
            setError(isValidRegister);
            toast.error(isValidRegister);
            return;
        }

        setIsLoading(true);

        try {
            await authRegister({ name, username, email, password });
            toast.success("Register successful!");
            setTimeout(() => {
                router.push(next);
            }, 2000);
        } catch (e) {
            if (e instanceof ApiError) {
                setError(e.message ?? "Register failed. Try a different email or username.");
                toast.error(e.message ?? "Register failed. Try a different email or username.");
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

            <h3>Register</h3>

            <form onSubmit={handleSubmit}>
                <p className="text-destructive">{error}</p>
                <label htmlFor="name"> name</label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    id="name"
                    name="name"
                    placeholder="name"
                    disabled={isLoading}
                />

                <label htmlFor="username"> username</label>
                <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    id="username"
                    name="username"
                    placeholder="username"
                    disabled={isLoading}
                />

                <label htmlFor="email"> email</label>
                <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="text"
                    id="email"
                    name="email"
                    placeholder="email"
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

                <Button type="submit" disabled={isLoading}>Register</Button>
                <Button type="button" onClick={() => router.push("/login")} disabled={isLoading}>Already have an Account?</Button>
            </form>
        </div>
    );
}
