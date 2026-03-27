"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getShowcaseIndexBySlug,
  getNextShowcaseIndex,
  LANDING_SHOWCASE_ITEMS,
} from "@/components/landing/landingShowcase";

type LandingShowcaseSectionProps = {
  onCreateContract: () => void;
};

function ShowcaseDots({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {LANDING_SHOWCASE_ITEMS.map((item, index) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`Show ${item.label}`}
          aria-pressed={activeIndex === index}
          className={`h-3 rounded-full transition ${activeIndex === index
            ? "w-10 bg-white"
            : "w-3 bg-white/25 hover:bg-white/40"
            }`}
        />
      ))}
    </div>
  );
}

export function LandingShowcaseSection({
  onCreateContract,
}: LandingShowcaseSectionProps) {
  const searchParams = useSearchParams();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = LANDING_SHOWCASE_ITEMS[activeIndex];

  useEffect(() => {
    setActiveIndex(getShowcaseIndexBySlug(searchParams.get("showcase")));
  }, [searchParams]);

  function showNextItem() {
    setActiveIndex((currentIndex) =>
      getNextShowcaseIndex(currentIndex, LANDING_SHOWCASE_ITEMS.length)
    );
  }

  return (
    <section id="product-tour" className="px-6 pb-16 md:px-10 md:pb-24">
      <div className="mx-auto w-full max-w-7xl py-6 text-white md:py-10 lg:py-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,360px)_minmax(0,1.5fr)] lg:items-center">
          <div className="max-w-xl text-left">
            <h2 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
              {activeItem.title}
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/72 md:text-xl">
              {activeItem.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCreateContract}
                className="rounded-full bg-white px-6 py-3 text-base font-semibold text-[#2f3136] transition hover:bg-white/90"
              >
                Create a contract
              </button>
              <Link
                href="/#landing-contact"
                className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white"
              >
                Contact us
              </Link>
            </div>
          </div>

          <div className="border border-white/10 bg-white/5 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-5">
            <button
              type="button"
              onClick={showNextItem}
              aria-label={`Show next screen after ${activeItem.label}`}
              className="block w-full text-left"
            >
              <div className="mb-4 flex items-center justify-between gap-3 px-1">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/45">
                  Product Tour
                </p>
                <p className="text-sm font-medium text-white/65">
                  {activeItem.label}
                </p>
              </div>

              <div className="relative aspect-[16/9] overflow-hidden border border-white/10 bg-black/15">
                <Image
                  fill
                  priority
                  src={activeItem.src}
                  alt={`${activeItem.label} preview`}
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              </div>
            </button>

            <ShowcaseDots activeIndex={activeIndex} onSelect={setActiveIndex} />
          </div>
        </div>
      </div>
    </section>
  );
}
