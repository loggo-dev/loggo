export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Not found") { super(message, "NOT_FOUND"); }
}
export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized") { super(message, "UNAUTHORIZED"); }
}
export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden") { super(message, "FORBIDDEN"); }
}
export class ConflictError extends DomainError {
  constructor(message = "Conflict") { super(message, "CONFLICT"); }
}
export class ValidationError extends DomainError {
  constructor(message = "Invalid input") { super(message, "VALIDATION"); }
}
