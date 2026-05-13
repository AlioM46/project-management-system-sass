// This file defines the "Blueprints" for our data. 
// In TypeScript, we use 'interfaces' to tell the computer exactly what fields an object should have.

/** 
 * Represents a User in our system 
 */
export interface User {
    id: string;         // A unique ID for the user
    name: string;       // The user's full name
    username: string;   // The user's unique username
    email: string;      // The user's email address
    avatar?: string;    // The '?' means this is optional (they might not have an image)
    role?: string;      // What they can do in the app
    created_at: string; // When the account was made
    updated_at: string; // When the account was last changed
}

/** 
 * The data we get back from the server when we log in or register 
 */
export interface AuthResponse {
    user: User;           // The user object we defined above
    access_token: string; // The "VIP Pass" used to talk to the server later
    token_type: string;   // Usually "Bearer"
    expires_in: number;   // How long until the token expires
}

/** 
 * The data we need to collect from a user when they register 
 */
export interface RegisterInput {
    name: string;                  // Full name
    username: string;              // Unique username for the user
    email: string;                 // Email
    password: string;              // Password
}
export interface LoginInput {
    login: string;                 // Email or username
    password: string;              // Password
}

/**
 * Data for requesting a password reset link
 */
export interface ForgotPasswordInput {
    email: string;
}

/**
 * Data for resetting the password using the link token
 */
export interface ResetPasswordInput {
    email: string;
    plain_token: string;
    password: string;
    password_confirmation: string;
}
