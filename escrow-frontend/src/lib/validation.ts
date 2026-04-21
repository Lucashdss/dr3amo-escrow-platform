export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function createValidationSuccess<T>(data: T): ValidationResult<T> {
  return { success: true, data };
}

export function createValidationError<T>(error: string): ValidationResult<T> {
  return { success: false, error };
}

export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

export function parseDateOnlyUtc(value: string): Date | null {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  const isSameDate =
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day;

  return isSameDate ? parsedDate : null;
}

export function parseDateOnlyLocal(value: string): Date | null {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
  const parsedDate = new Date(year, month - 1, day);
  const isSameDate =
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day;

  return isSameDate ? parsedDate : null;
}

export function formatDateOnlyUtc(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getStartOfTodayUtc(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

export function getStartOfTodayLocal(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
