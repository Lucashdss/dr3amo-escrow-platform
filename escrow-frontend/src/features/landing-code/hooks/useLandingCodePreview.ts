"use client";

import { useEffect, useState } from "react";

import { createEmptyLandingCodeResponse } from "@/features/landing-code/config/landingCode";
import { getLandingCodePreview } from "@/features/landing-code/services/landingCodeApi";
import type { LandingCodeResponse } from "@/features/landing-code/types/landingCode";

type LandingCodePreviewState = {
  errorMessage: string | null;
  isLoading: boolean;
  preview: LandingCodeResponse;
};

export function useLandingCodePreview(): LandingCodePreviewState {
  const [preview, setPreview] = useState<LandingCodeResponse>(
    createEmptyLandingCodeResponse()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadPreview(): Promise<void> {
      try {
        const response = await getLandingCodePreview();

        if (!isCancelled) {
          setPreview(response);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load code."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    preview,
    isLoading,
    errorMessage,
  };
}
