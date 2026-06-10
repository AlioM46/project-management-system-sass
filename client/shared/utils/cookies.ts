// src/shared/utils/cookies.ts

export function setCookie(name: string, value: string, days = 7) {
    if (typeof document === "undefined") {
        return;
    }

    const maxAge = days * 24 * 60 * 60;

    document.cookie = `${name}=${encodeURIComponent(
        value
    )}; path=/; max-age=${maxAge}; samesite=lax`;

    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app-cookie-change", {
            detail: { name, value },
        }));
    }
}

export function getCookie(name: string) {
    if (typeof document === "undefined") {
        return null;
    }

    const cookies = document.cookie.split("; ");

    const cookie = cookies.find((item) => item.startsWith(`${name}=`));

    if (!cookie) return null;

    return decodeURIComponent(cookie.split("=")[1] ?? "");
}

export function removeCookie(name: string) {
    if (typeof document === "undefined") {
        return;
    }

    document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;

    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app-cookie-change", {
            detail: { name, value: null },
        }));
    }
}
