import { apiClient } from "@/shared/api/apiClient";
import { User } from "@/features/auth/types";
import { UpdateProfileInput, ChangePasswordInput } from "../types";

// Update name, username, or timezone
export async function updateProfile(data: UpdateProfileInput): Promise<User> {
    const response = await apiClient.patch<{ user: User }>("/auth/profile", data);
    return response.user;
}

// Upload avatar image (uses FormData for file upload)
export async function uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await apiClient.post<{ user: User }>("/auth/profile/avatar", formData);
    return response.user;
}

// Remove current avatar
export async function removeAvatar(): Promise<User> {
    const response = await apiClient.delete<{ user: User }>("/auth/profile/avatar");
    return response.user;
}

// Change user password
export async function changePassword(data: ChangePasswordInput): Promise<void> {
    await apiClient.post("/auth/password/change-password", data);
}
