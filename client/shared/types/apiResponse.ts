// src/shared/types/apiResponse.ts
export interface ApiSuccessResponse<T> {
    success: true;
    message: string;
    data: T;
    meta: Record<string, any>;
}

export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        meta: Record<string, any>;
    };
}