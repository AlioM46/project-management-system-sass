export interface UpdateProfileInput {
    name?: string;
    username?: string;
    timezone?: string;
}

export interface ChangePasswordInput {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
}
