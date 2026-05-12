"use client"; // This tells Next.js: "This page is interactive (uses buttons, forms, state)"

import React, { useState } from "react"; // 'useState' is how React remembers what you type
import Link from "next/link"; // 'Link' is how we navigate between pages without refreshing
import { register } from "../api/auth.api"; // Import our function that talks to the server

export default function Register() {
    // These 'States' are React's "memory". We create a memory for each box in the form.
    const [name, setName] = useState(""); // Holds the Name
    const [username, setUsername] = useState(""); // Holds the Username
    const [email, setEmail] = useState(""); // Holds the Email
    const [password, setPassword] = useState(""); // Holds the Password
    const [error, setError] = useState<string | null>(null); // Holds any error messages we want to show
    const [isLoading, setIsLoading] = useState(false); // Remembers if we are currently "Waiting" for the server

    // This function runs when the user clicks the "Create Account" button
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault(); // Stop the browser from refreshing the page automatically
        setError(null); // Clear any old errors

        // Check username format based on backend rules (alphanumeric, dashes, underscores)
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
            setError("Username can only contain letters, numbers, dashes, and underscores.");
            return;
        }

        // Check username length
        if (username.length < 3 || username.length > 12) {
            setError("Username must be between 3 and 12 characters.");
            return;
        }

        // Check password length
        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true); // Start the "Loading" state (shows a spinner or disables buttons)

        try {
            // Call the API function we wrote earlier
            await register({
                name: name,
                username: username,
                email: email,
                password: password
            });

            // If it worked, we can redirect the user to the login or dashboard
            window.location.href = "/dashboard"; // Simple way to move to another page
        } catch (err: any) {
            // If the server says "No", we catch the error here
            setError(err?.message || "Registration failed. Try a different email.");
        } finally {
            setIsLoading(false); // Stop the "Loading" state regardless of success or failure
        }
    };

    return (
        // These 'className' strings are Tailwind CSS. They style the page!
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-2xl rounded-3xl border border-gray-100">
                {/* Header Section */}
                <div className="text-center">
                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Join Us</h2>
                    <p className="mt-3 text-gray-500">Create your workspace in seconds.</p>
                </div>

                {/* The Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {/* Error Message Display (Only shows if 'error' has text) */}
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 animate-pulse">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Name Input */}
                        <div>
                            <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name} // Connect the input to our 'name' memory
                                onChange={(e) => setName(e.target.value)} // Update 'name' memory when user types
                                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Username Input */}
                        <div>
                            <label className="text-sm font-semibold text-gray-700 ml-1">Username</label>
                            <input
                                type="text"
                                required
                                value={username} // Connect to 'username' memory
                                onChange={(e) => setUsername(e.target.value)} // Update 'username' memory
                                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                placeholder="johndoe123"
                            />
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email} // Connect to 'email' memory
                                onChange={(e) => setEmail(e.target.value)} // Update 'email' memory
                                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                placeholder="name@company.com"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password} // Connect to 'password' memory
                                onChange={(e) => setPassword(e.target.value)} // Update 'password' memory
                                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading} // Disable button while waiting for server
                        className={`w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {isLoading ? "Creating Account..." : "Get Started"}
                    </button>

                    {/* Link to Login */}
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Already have an account?{" "}
                        <Link href="/login" className="text-indigo-600 font-bold hover:underline">
                            Log In
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
