import { useState, useEffect } from "react";
import { getMe } from "@/features/auth/api/auth.api";
import { User } from "@/features/auth/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/ApiError";

export function useCurrentUser() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(!currentUser);

    useEffect(() => {
        let isMounted = true;

        const fetchUser = async () => {
            try {
                const user = await getMe();
                if (isMounted) {
                    setCurrentUser(user);
                }
            } catch (error) {
                toast.error(getErrorMessage(error, "Failed to load user profile."));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchUser();

        const handleUpdate = (e: Event) => {
            const customEvent = e as CustomEvent<User>;
            if (customEvent.detail && isMounted) {
                setCurrentUser(customEvent.detail);
            } else {
                fetchUser();
            }
        };

        window.addEventListener("user_profile_updated", handleUpdate);
        return () => {
            isMounted = false;
            window.removeEventListener("user_profile_updated", handleUpdate);
        };
    }, []);

    return { currentUser, isLoading };
}

