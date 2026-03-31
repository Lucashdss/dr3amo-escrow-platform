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

export async function fetchClientEscrowSummary(): Promise<ClientEscrowSummaryResult> {
  return fetchApi<ClientEscrowSummaryResult>("/api/escrows/client-funds");
}

export async function fetchFreelancerEscrowSummary(): Promise<FreelancerEscrowSummaryResult> {
  return fetchApi<FreelancerEscrowSummaryResult>("/api/escrows/freelancer-funds");
}

export async function fetchEscrowManagementList(): Promise<EscrowManagementListResult> {
  return fetchApi<EscrowManagementListResult>("/api/escrows/management");
}

export async function fetchEscrowManagementDetail(
  id: number
): Promise<EscrowManagementDetailResult> {
  return fetchApi<EscrowManagementDetailResult>(`/api/escrows/${id}`);
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
