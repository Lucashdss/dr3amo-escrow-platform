import { fetchApi } from "@/lib/api/fetch";
import type {
  ClientEscrowSummaryResult,
  CreateEscrowRequest,
  CreateEscrowResult,
  EscrowManagementDetailResult,
  EscrowManagementListResult,
  FreelancerEscrowSummaryResult,
  SyncEscrowActionRequest,
  SyncEscrowActionResult,
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

export async function fetchEscrowManagementList(
  userId: number
): Promise<EscrowManagementListResult> {
  return fetchApi<EscrowManagementListResult>(
    `/api/escrows/management?userId=${userId}`
  );
}

export async function fetchEscrowManagementDetail(
  id: number,
  userId: number
): Promise<EscrowManagementDetailResult> {
  return fetchApi<EscrowManagementDetailResult>(
    `/api/escrows/${id}?userId=${userId}`
  );
}

export async function syncEscrowManagementAction(
  id: number,
  request: SyncEscrowActionRequest
): Promise<SyncEscrowActionResult> {
  return fetchApi<SyncEscrowActionResult>(`/api/escrows/${id}/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
}
