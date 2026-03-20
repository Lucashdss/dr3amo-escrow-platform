import { fetchApi } from "@/lib/api/fetch";
import type {
  ClientEscrowSummaryResult,
  CreateEscrowRequest,
  CreateEscrowResult,
  FreelancerEscrowSummaryResult,
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

export async function fetchClientEscrowSummary(
  clientId: number
): Promise<ClientEscrowSummaryResult> {
  return fetchApi<ClientEscrowSummaryResult>(
    `/api/escrows/client-funds?clientId=${clientId}`
  );
}

export async function fetchFreelancerEscrowSummary(
  freelancerId: number
): Promise<FreelancerEscrowSummaryResult> {
  return fetchApi<FreelancerEscrowSummaryResult>(
    `/api/escrows/freelancer-funds?freelancerId=${freelancerId}`
  );
}
