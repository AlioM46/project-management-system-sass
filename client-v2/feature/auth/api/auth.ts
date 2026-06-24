import { apiClient } from "@/shared/api/apiClient";
import { AuthResponse, LoginInput, RegisterInput, User, ForgotPasswordInput, ResetPasswordInput } from "../types";
import { setCookie } from "@/shared/utils/cookies";



export async function login(loginProps: LoginInput): Promise<AuthResponse> {

    const response = await apiClient.post<AuthResponse>("/auth/login", loginProps, { skipRefresh: true });



    setCookie("access_token", response.access_token, .1);


    return response;

}



export async function register(RegisterProps: RegisterInput): Promise<AuthResponse> {

    const response = await apiClient.post<AuthResponse>("/auth/register", RegisterProps, { skipRefresh: true });



    setCookie("access_token", response.access_token, .1);


    return response;

}




export async function resetPassword(resetPasswordProps: ResetPasswordInput): Promise<string> {

    const response = await apiClient.post<{ message: string }>("/auth/password/reset-password", resetPasswordProps, { skipRefresh: true });

    return response?.message


}



export async function forgotPassword(forgetPasswordProps: ForgotPasswordInput): Promise<string> {

    const response = await apiClient.post<{ message: string }>("/auth/password/send-reset-link", forgetPasswordProps, { skipRefresh: true });

    return response?.message || "If your email is registered, you will receive a password reset link shortly.";

}

export async function getMe(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");

    return response;
}