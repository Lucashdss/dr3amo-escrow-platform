import { AppError } from "@/lib/errors";
import { LANDING_CODE_CONFIG } from "@/features/landing-code/config/landingCode";
import type {
  LandingCodeLine,
  LandingCodeResponse,
} from "@/features/landing-code/types/landingCode";

type Fetcher = typeof fetch;

function createLandingCodeLines(source: string): LandingCodeLine[] {
  return source.split("\n").map((content, index) => ({
    content,
    number: index + 1,
  }));
}

async function fetchLandingCodeSource(fetcher: Fetcher): Promise<string> {
  const response = await fetcher(LANDING_CODE_CONFIG.rawUrl, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new AppError("Failed to load GitHub source.", 502);
  }

  return response.text();
}

function createLandingCodeResponse(source: string): LandingCodeResponse {
  return {
    fileName: LANDING_CODE_CONFIG.fileName,
    githubUrl: LANDING_CODE_CONFIG.githubUrl,
    lines: createLandingCodeLines(source),
    subtitle: LANDING_CODE_CONFIG.subtitle,
    title: LANDING_CODE_CONFIG.title,
  };
}

export async function getLandingCodePreview(
  fetcher: Fetcher = fetch
): Promise<LandingCodeResponse> {
  try {
    return createLandingCodeResponse(await fetchLandingCodeSource(fetcher));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Failed to load GitHub source.", 502);
  }
}
