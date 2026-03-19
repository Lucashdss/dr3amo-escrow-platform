export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function createValidationSuccess<T>(data: T): ValidationResult<T> {
  return { success: true, data };
}

export function createValidationError<T>(error: string): ValidationResult<T> {
  return { success: false, error };
}
