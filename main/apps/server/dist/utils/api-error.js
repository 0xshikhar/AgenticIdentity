"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    constructor(statusCode, message, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
    static badRequest(message, errors = []) {
        return new ApiError(400, message, errors);
    }
    static unauthorized(message = 'Unauthorized', errors = []) {
        return new ApiError(401, message, errors);
    }
    static forbidden(message = 'Forbidden', errors = []) {
        return new ApiError(403, message, errors);
    }
    static notFound(message = 'Resource not found', errors = []) {
        return new ApiError(404, message, errors);
    }
    static internal(message = 'Internal server error', errors = []) {
        return new ApiError(500, message, errors);
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=api-error.js.map