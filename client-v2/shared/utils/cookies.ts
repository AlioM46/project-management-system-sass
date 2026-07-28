


export function setCookie(key: string, value: string, days: number = 14) {
    if (typeof window !== "undefined") {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${key}=${value}; expires=${date.toUTCString()}; path=/`;
    }

}
export function getCookie(key: string) {

    let cookieValues: string[] = document.cookie.split(";");



    for (let i = 0; i < cookieValues.length; i++) {

        let cookie = cookieValues[i].split("=")
        if (cookie[0].trim() === key) {
            return cookie[1]
        }
    }

    return null


}


export function deleteCookie(key: string) {

    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}
