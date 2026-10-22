export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = 'APP_ERROR',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** The request was syntactically valid but semantically wrong. */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request.', code = 'BAD_REQUEST') {
    super(400, message, code);
  }
}

/** The caller is missing a valid JWT. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.', code = 'UNAUTHORIZED') {
    super(401, message, code);
  }
}

/** A record does not exist, or does not belong to the current user. */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.', code = 'NOT_FOUND') {
    super(404, message, code);
  }
}

/** The request conflicts with the current state of a resource. */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict.', code = 'CONFLICT') {
    super(409, message, code);
  }
}

export interface ValidationIssue {
  path: string;
  message: string;
}

/** A Zod (or other) validation failure, formatted for API consumers. */
export class ValidationError extends AppError {
  constructor(issues: ValidationIssue[]) {
    super(400, 'Validation failed.', 'VALIDATION_ERROR', issues);
  }
}
