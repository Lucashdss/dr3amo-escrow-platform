import { Linkedin } from "lucide-react";

import type {
  LandingDocumentContent,
  LandingDocumentLink,
  LandingDocumentSection,
} from "@/components/landing/landingDocumentContent";

type LandingDocumentPageProps = Readonly<LandingDocumentContent>;

type LandingDocumentSectionProps = Readonly<{
  section: LandingDocumentSection;
}>;

type DocumentLinkRowProps = Readonly<{
  link: LandingDocumentLink;
}>;

function DocumentBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[#04052E]" />
      <div className="absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
    </>
  );
}

function DocumentLinkRow({ link }: DocumentLinkRowProps) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-3 text-base text-white transition hover:text-cyan-200 md:text-lg"
    >
      <Linkedin className="h-5 w-5" aria-hidden="true" />
      <span>{link.label}</span>
    </a>
  );
}

function DocumentSection({ section }: LandingDocumentSectionProps) {
  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-semibold tracking-tight text-white">
        {section.title}
      </h2>

      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="text-base leading-8 text-white md:text-lg">
          {paragraph}
        </p>
      ))}

      {section.items?.length ? (
        <ul className="space-y-4 pl-5 text-base leading-8 text-white md:text-lg">
          {section.items.map((item) => (
            <li key={item} className="list-disc marker:text-white">
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      {section.links?.length ? (
        <div className="space-y-4">
          {section.links.map((link) => (
            <DocumentLinkRow key={link.href} link={link} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function LandingDocumentPage({
  introParagraphs,
  sections,
  title,
  updatedAtLabel,
}: LandingDocumentPageProps) {
  return (
    <main className="relative flex-1 overflow-hidden px-6 pb-24 pt-8 md:px-10 md:pb-28 md:pt-12">
      <DocumentBackground />

      <div className="relative mx-auto w-full max-w-5xl py-10 md:py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/65">
              Dr3amo
            </p>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              {title}
            </h1>
          </div>
          <p className="pt-1 text-sm font-medium text-white md:text-base">
            {updatedAtLabel}
          </p>
        </div>

        <div className="mt-8 h-px w-full bg-white/20" />

        <div className="mt-10 space-y-6">
          {introParagraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="max-w-4xl text-base leading-8 text-white md:text-lg"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-12 space-y-12">
          {sections.map((section) => (
            <DocumentSection key={section.title} section={section} />
          ))}
        </div>
      </div>
    </main>
  );
}
