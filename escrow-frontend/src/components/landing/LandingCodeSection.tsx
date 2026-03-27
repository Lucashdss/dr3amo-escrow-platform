"use client";

import { ExternalLink } from "lucide-react";

import { useLandingCodePreview } from "@/features/landing-code/hooks/useLandingCodePreview";

function CodeStatus({
  errorMessage,
  isLoading,
}: {
  errorMessage: string | null;
  isLoading: boolean;
}) {
  if (errorMessage) {
    return (
      <p className="px-6 py-8 text-sm text-[#ffb8b8]">
        {errorMessage}
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="px-6 py-8 text-sm text-white/48">
        Loading contract source...
      </p>
    );
  }

  return null;
}

function CodeLines({
  lines,
}: {
  lines: { content: string; number: number }[];
}) {
  return (
    <div className="grid min-w-[900px] gap-2 px-6 py-6 font-mono text-sm text-white/82">
      {lines.map((line) => (
        <div key={line.number} className="grid grid-cols-[64px_minmax(0,1fr)] gap-6">
          <span className="select-none text-right text-white/28">
            {line.number}
          </span>
          <code className="whitespace-pre-wrap break-words">
            {line.content || " "}
          </code>
        </div>
      ))}
    </div>
  );
}

export function LandingCodeSection() {
  const { preview, isLoading, errorMessage } = useLandingCodePreview();

  return (
    <section className="px-6 py-16 md:px-10 md:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
            {preview.title}
          </h2>
          <p className="mt-4 text-lg text-white/58 md:text-xl">
            {preview.subtitle}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
            <p className="text-xl font-medium text-white">{preview.fileName}</p>
            <a
              href={preview.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-base text-white/60 transition hover:text-white"
            >
              <span>GitHub</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="max-h-[38rem] overflow-auto">
            {preview.lines.length ? (
              <CodeLines lines={preview.lines} />
            ) : (
              <CodeStatus errorMessage={errorMessage} isLoading={isLoading} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
