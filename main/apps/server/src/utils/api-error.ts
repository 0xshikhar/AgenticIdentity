export class ApiError extends Error {
    statusCode: number;
    errors: any[];

    constructor(statusCode: number, message: string, errors: any[] = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;

        Object.setPrototypeOf(this, ApiError.prototype);
    }

    static badRequest(message: string, errors: any[] = []) {
        return new ApiError(400, message, errors);
    }

    static unauthorized(message: string = 'Unauthorized', errors: any[] = []) {
        return new ApiError(401, message, errors);
    }

    static forbidden(message: string = 'Forbidden', errors: any[] = []) {
        return new ApiError(403, message, errors);
    }

    static notFound(message: string = 'Resource not found', errors: any[] = []) {
        return new ApiError(404, message, errors);
    }

    static internal(message: string = 'Internal server error', errors: any[] = []) {
        return new ApiError(500, message, errors);
    }
}