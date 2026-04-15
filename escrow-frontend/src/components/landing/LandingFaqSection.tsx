"use client";

import { useState } from "react";

type FaqItem = {
  answer: string;
  question: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do fees work?",
    answer:
      "Dr3amo withdraws a 1% fee from the contract price on-chain, so the fee handling happens transparently as part of the escrow flow.",
  },
];

function FaqRow({
  answer,
  isOpen,
  onToggle,
  question,
}: Readonly<{
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  question: string;
}>) {
  return (
    <div className="border-b border-white/10 py-5 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="text-xl font-semibold text-white md:text-2xl">
          {question}
        </span>
        <span className="text-3xl font-light text-white/70">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen ? (
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/68 md:text-lg">
          {answer}
        </p>
      ) : null}
    </div>
  );
}

export function LandingFaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="px-6 py-18 md:px-10 md:py-24">
      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
        <div>
          <p className="text-4xl font-black tracking-tight text-white md:text-6xl">
            FAQs
          </p>
        </div>

        <div className="rounded-[2rem] bg-black px-6 py-5 shadow-[0_18px_48px_rgba(0,0,0,0.08)] md:px-8 md:py-6">
          {FAQ_ITEMS.map((item, index) => (
            <FaqRow
              key={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onToggle={() =>
                setOpenIndex((currentIndex) =>
                  currentIndex === index ? -1 : index
                )
              }
              question={item.question}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
