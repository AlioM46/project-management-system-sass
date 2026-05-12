// Import the 'apiClient' which is a helper tool to talk to our backend server
import { apiClient } from "@/shared/api/apiClient";
// Import helpers to save or remove "Cookies" (tiny pieces of data saved in the browser)
import { setCookie } from "@/shared/utils/cookies";
// Import the 'RegisterInput' blueprint we just made
import { AuthResponse, RegisterInput } from "../types";

/**
 * This function sends the registration data to the backend.
 * 'async' means this function might take some time to finish (talking to the server).
 */
export async function register(data: RegisterInput): Promise<AuthResponse> {
    // 1. Send a "POST" request to the server at "/auth/register" with the user's data
    // 'await' tells the code to pause and wait for the server to answer
    const response = await apiClient.post("/auth/register", data);

    // 2. The server sends back a 'token' (a secret key). 
    // We save this key in a 'Cookie' named "access_token" so we stay logged in.
    setCookie("access_token", response.access_token);

    // 3. Return the server's response so the Page can use it (e.g. to show the user's name)
    return response;
}