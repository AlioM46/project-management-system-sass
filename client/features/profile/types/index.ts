export interface UpdateProfileInput {
    name?: string;
    username?: string;
    timezone?: string;
    custom_status?: string;
}

export interface ChangePasswordInput {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
}
