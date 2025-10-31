/**
 * Custom Error Classes
 *
 * Centralized error handling with custom error types
 * PHASE 2: Error Handling & Information Disclosure Prevention
 *
 * Features:
 * - Custom error classes for different scenarios
 * - Stack trace sanitization
 * - Sensitive data masking
 * - Production-safe error messages
 * - Error logging with context
 */

/**
 * Base application error
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Get sanitized error for production
     * @returns {Object} - Safe error object
     */
    toJSON() {
        return {
            error: this.name,
            message: this.getSafeMessage(),
            timestamp: this.timestamp,
            ...(process.env.NODE_ENV !== 'production' && {
                stack: this.sanitizeStack()
            })
        };
    }

    /**
     * Get safe error message (hide sensitive details in production)
     * @returns {string} - Safe message
     */
    getSafeMessage() {
        if (process.env.NODE_ENV === 'production' && !this.isOperational) {
            return 'An internal error occurred. Please try again later.';
        }
        return this.message;
    }

    /**
     * Sanitize stack trace (remove file paths in production)
     * @returns {string} - Sanitized stack
     */
    sanitizeStack() {
        if (process.env.NODE_ENV === 'production') {
            return this.stack
                .split('\n')
                .map(line => line.replace(/\(.*[\\\/]/, '('))
                .join('\n');
        }
        return this.stack;
    }
}

/**
 * Validation error (400)
 */
class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, true);
        this.details = details;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            ...(this.details && { details: this.details })
        };
    }
}

/**
 * Authentication error (401)
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, true);
    }
}

/**
 * Authorization error (403)
 */
class AuthorizationError extends AppError {
    constructor(message = 'You do not have permission to perform this action') {
        super(message, 403, true);
    }
}

/**
 * Not found error (404)
 */
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, true);
        this.resource = resource;
    }
}

/**
 * Rate limit error (429)
 */
class RateLimitError extends AppError {
    constructor(message = 'Too many requests', retryAfter = 60) {
        super(message, 429, true);
        this.retryAfter = retryAfter;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            retryAfter: this.retryAfter
        };
    }
}

/**
 * Security error (400)
 */
class SecurityError extends AppError {
    constructor(message, attackType = 'Unknown') {
        super(message, 400, true);
        this.attackType = attackType;
        this.severity = 'HIGH';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            attackType: this.attackType,
            severity: this.severity
        };
    }
}

/**
 * Command injection error
 */
class CommandInjectionError extends SecurityError {
    constructor(message = 'Command injection attempt detected') {
        super(message, 'CommandInjection');
    }
}

/**
 * Path traversal error
 */
class PathTraversalError extends SecurityError {
    constructor(message = 'Path traversal attempt detected') {
        super(message, 'PathTraversal');
    }
}

/**
 * XSS error
 */
class XSSError extends SecurityError {
    constructor(message = 'XSS attempt detected') {
        super(message, 'XSS');
    }
}

/**
 * Database error (500)
 */
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', isOperational = false) {
        super(message, 500, isOperational);
    }
}

/**
 * External service error (502)
 */
class ExternalServiceError extends AppError {
    constructor(service, message = 'External service unavailable') {
        super(`${service}: ${message}`, 502, true);
        this.service = service;
    }
}

/**
 * Configuration error (500)
 */
class ConfigurationError extends AppError {
    constructor(message = 'Configuration error') {
        super(message, 500, false);
    }
}

/**
 * Timeout error (408)
 */
class TimeoutError extends AppError {
    constructor(operation = 'Operation', timeout = 30000) {
        super(`${operation} timed out after ${timeout}ms`, 408, true);
        this.operation = operation;
        this.timeout = timeout;
    }
}

/**
 * Error handler utility
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
    }

    /**
     * Handle error and return safe response
     * @param {Error} error - Error object
     * @param {Object} context - Additional context
     * @returns {Object} - Safe error response
     */
    handle(error, context = {}) {
        // Log error with context
        this.log(error, context);

        // Return safe error response
        if (error instanceof AppError) {
            return error.toJSON();
        }

        // Unknown error - return generic message in production
        return {
            error: 'InternalError',
            message: process.env.NODE_ENV === 'production'
                ? 'An internal error occurred'
                : error.message,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Log error with context
     * @param {Error} error - Error object
     * @param {Object} context - Additional context
     */
    log(error, context = {}) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: error.name,
            message: error.message,
            stack: error.stack,
            context: this.sanitizeContext(context),
            ...(error instanceof AppError && {
                statusCode: error.statusCode,
                isOperational: error.isOperational
            })
        };

        this.errorLog.push(errorLog);

        // Console log in development
        if (process.env.NODE_ENV !== 'production') {
            console.error('❌ Error:', errorLog);
        }

        // Keep only last 1000 errors in memory
        if (this.errorLog.length > 1000) {
            this.errorLog = this.errorLog.slice(-1000);
        }
    }

    /**
     * Sanitize context (remove sensitive data)
     * @param {Object} context - Context object
     * @returns {Object} - Sanitized context
     */
    sanitizeContext(context) {
        const sanitized = { ...context };
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];

        Object.keys(sanitized).forEach(key => {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    /**
     * Get error statistics
     * @returns {Object} - Error statistics
     */
    getStats() {
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        const recentErrors = this.errorLog.filter(
            err => new Date(err.timestamp).getTime() > last24h
        );

        // Count by error type
        const errorTypes = {};
        recentErrors.forEach(err => {
            errorTypes[err.error] = (errorTypes[err.error] || 0) + 1;
        });

        return {
            totalErrors: this.errorLog.length,
            last24Hours: recentErrors.length,
            errorTypes,
            mostRecent: this.errorLog[this.errorLog.length - 1] || null
        };
    }

    /**
     * Clear error log
     */
    clearLog() {
        this.errorLog = [];
    }
}

// Singleton instance
const errorHandler = new ErrorHandler();

module.exports = {
    // Error classes
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError,
    SecurityError,
    CommandInjectionError,
    PathTraversalError,
    XSSError,
    DatabaseError,
    ExternalServiceError,
    ConfigurationError,
    TimeoutError,

    // Error handler instance
    errorHandler
};
