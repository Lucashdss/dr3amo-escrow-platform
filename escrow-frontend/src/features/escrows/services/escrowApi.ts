import { fetchApi } from "@/lib/api/fetch";
import type {
  CreateEscrowRequest,
  CreateEscrowResult,
} from "@/features/escrows/types/escrow";

export async function persistEscrow(
  request: CreateEscrowRequest
): Promise<CreateEscrowResult> {
  return fetchApi<CreateEscrowResult>("/api/escrows", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
}
