import type { ApiResponse } from "@/lib/api/types";

function getResponseError<T>(body: ApiResponse<T>, fallback: string): string {
  if (body.success) {
    return fallback;
  }

  return body.error.message;
}

export async function fetchApi<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    throw new Error(getResponseError(body, "Request failed."));
  }

  return body.data;
}
