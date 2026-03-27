import { fetchApi } from "@/lib/api/fetch";
import type { LandingCodeResponse } from "@/features/landing-code/types/landingCode";

export async function getLandingCodePreview(): Promise<LandingCodeResponse> {
  return fetchApi<LandingCodeResponse>("/api/landing-code");
}
