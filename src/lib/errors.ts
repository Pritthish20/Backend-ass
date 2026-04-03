export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function badRequest(message: string, details?: unknown) {
  return new AppError(400, "BAD_REQUEST", message, details);
}

export function unauthorized(message = "Authentication required") {
  return new AppError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "You do not have access to this resource") {
  return new AppError(403, "FORBIDDEN", message);
}

export function notFound(message = "Resource not found") {
  return new AppError(404, "NOT_FOUND", message);
}
