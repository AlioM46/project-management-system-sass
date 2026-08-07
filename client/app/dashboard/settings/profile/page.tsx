"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, Upload, Trash2, Save, Camera, Globe, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getMe } from "@/features/auth/api/auth.api";
import { updateProfile, uploadAvatar, removeAvatar, changePassword } from "@/features/profile/api/profile.api";
import { User as UserType } from "@/features/auth/types";
import { getErrorMessage } from "@/shared/api/ApiError";

const COMMON_TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Dubai",
    "Asia/Riyadh",
    "Asia/Tokyo",
    "Asia/Singapore",
    "Australia/Sydney",
];

export default function ProfileSettingsPage() {
    const [user, setUser] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Profile form state
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [timezone, setTimezone] = useState("UTC");
    const [customStatus, setCustomStatus] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Avatar state
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // 1. Fetch user profile data on load
    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        setIsLoading(true);
        try {
            const userData = await getMe();
            setUser(userData);
            setName(userData.name || "");
            setUsername(userData.username || "");
            setTimezone((userData as any).timezone || "UTC");
            setCustomStatus((userData as any).custom_status || "");
        } catch (error) {
            console.error("Failed to load user profile", error);
            toast.error(getErrorMessage(error, "Failed to load user profile."));
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Handle Name & Username Update
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Name is required.");
            return;
        }

        setIsSavingProfile(true);
        try {
            const updatedUser = await updateProfile({
                name: name.trim(),
                username: username.trim() || undefined,
                timezone,
                custom_status: customStatus.trim() || undefined,
            });
            setUser(updatedUser);
            window.dispatchEvent(new CustomEvent("user_profile_updated", { detail: updatedUser }));
            toast.success("Profile updated successfully!");
        } catch (error: any) {
            toast.error(getErrorMessage(error, "Failed to update profile."));
        } finally {
            setIsSavingProfile(false);
        }
    };

    // 3. Handle Avatar File Selection & Upload
    const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Avatar image size must be under 2MB.");
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const updatedUser = await uploadAvatar(file);
            setUser(updatedUser);
            window.dispatchEvent(new CustomEvent("user_profile_updated", { detail: updatedUser }));
            toast.success("Avatar uploaded successfully!");
        } catch (error: any) {
            toast.error(getErrorMessage(error, "Failed to upload avatar."));
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // 4. Handle Avatar Removal
    const handleRemoveAvatar = async () => {
        setIsUploadingAvatar(true);
        try {
            const updatedUser = await removeAvatar();
            setUser(updatedUser);
            window.dispatchEvent(new CustomEvent("user_profile_updated", { detail: updatedUser }));
            toast.success("Avatar removed.");
        } catch (error: any) {
            toast.error(getErrorMessage(error, "Failed to remove avatar."));
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // 5. Handle Change Password
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword) {
            toast.error("Current password is required.");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("New password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New password confirmation does not match.");
            return;
        }

        setIsChangingPassword(true);
        try {
            await changePassword({
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
            });
            toast.success("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(getErrorMessage(error, "Failed to change password."));
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Loading profile details...
            </div>
        );
    }

    const avatarUrl = (user as any)?.avatar_url || user?.avatar;
    const initials = (user?.name || "U")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Personal Profile
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Manage your account details, profile picture, timezone, and security password.
                </p>
            </div>

            {/* CARD 1: Avatar Image */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm p-6 space-y-4">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Profile Picture
                </h4>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group">
                        {avatarUrl ? (
                            // Render user uploaded avatar
                            <img
                                src={avatarUrl}
                                alt={user?.name || "Avatar"}
                                className="h-24 w-24 rounded-full object-cover border-2 border-zinc-200 dark:border-white/10 shadow-sm"
                            />
                        ) : (
                            // Render initials circle fallback
                            <div className="h-24 w-24 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl border-2 border-zinc-200 dark:border-white/10 shadow-sm">
                                {initials}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 items-center sm:items-start">
                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl shadow-sm transition-colors">
                                <Upload className="h-3.5 w-3.5" />
                                {isUploadingAvatar ? "Uploading..." : "Upload New Photo"}
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleAvatarFileChange}
                                    disabled={isUploadingAvatar}
                                    className="hidden"
                                />
                            </label>

                            {avatarUrl && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveAvatar}
                                    disabled={isUploadingAvatar}
                                    className="rounded-xl text-xs text-red-600 dark:text-red-400 border-zinc-200 dark:border-white/10"
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Remove
                                </Button>
                            )}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            JPG, PNG or WEBP. Maximum file size 2MB.
                        </p>
                    </div>
                </div>
            </div>

            {/* CARD 2: Personal Information */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm p-6 space-y-4">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Personal Information
                </h4>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-900 dark:text-white">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-900 dark:text-white">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                maxLength={12}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-900 dark:text-white">
                            Email Address (Read-Only)
                        </label>
                        <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full px-3 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                            Custom Status / About Me
                        </label>
                        <input
                            type="text"
                            value={customStatus}
                            onChange={(e) => setCustomStatus(e.target.value)}
                            maxLength={150}
                            placeholder="e.g. Working on project management, Available for chats..."
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-zinc-400" />
                            Timezone
                        </label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                        >
                            {COMMON_TIMEZONES.map((tz) => (
                                <option key={tz} value={tz} className="bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white">
                                    {tz}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSavingProfile}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-sm"
                    >
                        {isSavingProfile ? (
                            "Saving..."
                        ) : (
                            <>
                                <Save className="h-3.5 w-3.5 mr-1" />
                                Save Profile Changes
                            </>
                        )}
                    </Button>
                </form>
            </div>

            {/* CARD 3: Change Password */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm p-6 space-y-4">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Security & Password
                </h4>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-900 dark:text-white">
                            Current Password *
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-900 dark:text-white">
                            New Password *
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-900 dark:text-white">
                            Confirm New Password *
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isChangingPassword}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-sm"
                    >
                        {isChangingPassword ? (
                            "Updating..."
                        ) : (
                            <>
                                <Lock className="h-3.5 w-3.5 mr-1" />
                                Update Password
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
