import { NextResponse } from "next/server";

import type { ApiFailure, ApiSuccess } from "@/lib/api/types";

export function createSuccessResponse<T>(
  data: T,
  status = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
    },
    { status }
  );
}

export function createErrorResponse(
  message: string,
  status = 400
): NextResponse<ApiFailure> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: { message },
    },
    { status }
  );
}
