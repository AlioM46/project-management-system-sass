import { toast } from "sonner";


export function isEmail(str: string) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(str);
}

export function isUsername(str: string) {
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;

    if (str.length >= 3 && str.length <= 12 && usernameRegex.test(str)) {
        return true;
    }
    return false;

}

export function isValidEmail(str: string): boolean {

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(str); // تعيد النتيجة مباشرة في سطر واحد!
}

export function validPassword(str: string): boolean {

    return str.trim().length >= 8;
}
export function validPasswordWithMessage(str: string): string {

    return str.trim().length >= 8 ? "" : "Password must be at least 8 characters";
}
export function validPasswordWithConfirmationPassword(pass1: string, pass2: string): string {

    if (pass1.trim().length < 8) {
        return "Password must be at least 8 characters";
    } else if (pass2.trim().length < 8) {
        return "Confirmation password must be at least 8 characters";
    } else if (pass1.trim() !== pass2.trim()) {
        return "Passwords do not match";
    } else {
        return "";
    }

}

export function isValidLoginCredentials(login: string, password: string): string {


    let isEmail = login.includes("@");
    if (isEmail) {
        const isValidEmaill = isValidEmail(login);
        if (!isValidEmaill) {
            return "Invalid email address";
        }
    } else {
        const isValidUsername = isUsername(login);
        if (!isValidUsername) {
            return "username must be from 3 to 12 characters and can only contain letters, numbers, dashes, and underscores";
        }
    }

    const isValidPassword = validPassword(password);
    if (!isValidPassword) {
        return "Password must be at least 8 characters";
    }

    return "";
}

export function isValidRegisterCredentials(name: string, username: string, email: string, password: string): string {


    const isValidName = name.length >= 2 && name.length <= 100 && /^[a-zA-Z\s]+$/.test(name);
    if (!isValidName) {
        return "name must be from 2 to 100 characters and can only contain letters and spaces";
    }

    const isValidUsername = isUsername(username);
    if (!isValidUsername) {
        return "username must be from 3 to 12 characters and can only contain letters, numbers, dashes, and underscores";
    }

    const isValidEmaill = isValidEmail(email);
    if (!isValidEmaill) {
        return "Invalid email address";
    }

    const isValidPassword = validPassword(password);
    if (!isValidPassword) {
        return "Password must be at least 8 characters";
    }

    return "";
}
