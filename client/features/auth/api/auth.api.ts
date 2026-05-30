// Import the 'apiClient' which is a helper tool to talk to our backend server
import { apiClient } from "@/shared/api/apiClient";
// Import helpers to save or remove "Cookies" (tiny pieces of data saved in the browser)
import { setCookie } from "@/shared/utils/cookies";
import { AuthResponse, LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput, User } from "../types";

/**
 * This function sends the registration data to the backend.
 * 'async' means this function might take some time to finish (talking to the server).
 */
export async function register(data: RegisterInput): Promise<AuthResponse> {
    // 1. Send a "POST" request to the server at "/auth/register" with the user's data
    // 'await' tells the code to pause and wait for the server to answer
    const response = await apiClient.post<AuthResponse>("/auth/register", data, { skipRefresh: true });

    // 2. The server sends back a 'token' (a secret key). 
    // We save this key in a 'Cookie' named "access_token" so we stay logged in.
    console.log("response_register", response);

    setCookie("access_token", response.access_token);

    // 3. Return the server's response so the Page can use it (e.g. to show the user's name)
    return response;
}
export async function Login(data: LoginInput): Promise<AuthResponse> {
    // 1. Send a "POST" request to the server at "/auth/login" with the user's data
    // 'await' tells the code to pause and wait for the server to answer
    const response = await apiClient.post<AuthResponse>("/auth/login", data, { skipRefresh: true });

    // 2. The server sends back a 'token' (a secret key). 
    // We save this key in a 'Cookie' named "access_token" so we stay logged in.
    console.log("response_login", response);
    setCookie("access_token", response.access_token);

    // 3. Return the server's response so the Page can use it (e.g. to show the user's name)
    return response;
}

export async function forgotPassword(data: ForgotPasswordInput): Promise<string> {
    const response = await apiClient.post<{ message?: string }>("/auth/password/send-reset-link", data, { skipRefresh: true });
    return response?.message || "Reset link sent successfully";
}

export async function resetPassword(data: ResetPasswordInput): Promise<string> {
    const response = await apiClient.post<{ message?: string }>("/auth/password/reset-password", data, { skipRefresh: true });
    return response?.message || "Password reset successfully";
}

export async function getMe(): Promise<User> {
    return apiClient.get<User>("/auth/me");
}
