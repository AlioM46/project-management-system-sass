// src/shared/api/ApiError.ts

/**
 * Why we create a custom Error class:
 * In JavaScript, a regular 'Error' only has a 'message'. 
 * But our backend sends back a 'code' (like VALIDATION_ERROR) and 'meta' (like which fields failed).
 * By extending the native Error, we can carry all that extra data into our 'catch' blocks.
 */
export class ApiError extends Error {
    public code: string;
    public meta: Record<string, any>;
    public status: number;

    constructor(message: string, code: string, status: number, meta: Record<string, any> = {}) {
        // 'super' calls the original Error constructor with the message
        super(message);

        // This is a special TypeScript thing to make sure 'instanceof ApiError' works correctly
        /*
        This is a fix for a known quirk in older versions of TypeScript/JavaScript. 
        Without this line, if you tried to check your error later using if (err instanceof ApiError), 
        it might return false even if it is an ApiError. This line "re-connects" the prototype chain 
        to ensure your custom class is recognized properly.
        */
        Object.setPrototypeOf(this, ApiError.prototype);

        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.meta = meta;
    }

    public getFriendlyMessage(): string | null {

        if (this.code === "VALIDATION_ERROR" && this.meta?.errors) {
            const errorLists = Object.values(this.meta.errors) as string[][];
            // looks like [ ["email is already taken", "email is unsupported"], ["password is too short"] ]
            // so its nested arrays
            const firstErrorMessage = errorLists[0]?.[0];

            return firstErrorMessage || this.message;
        }
        return this.message;
    }
}
