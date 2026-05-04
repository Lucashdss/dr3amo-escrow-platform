"use client";

import { useState } from "react";

type FaqItem = {
  answer: string;
  question: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Dr3amo?",
    answer:
      "Dr3amo is an escrow platform that helps buyers and sellers work with on-chain payments, clear contract terms, and transparent release flows.",
  },
  {
    question: "How do fees work?",
    answer:
      "Dr3amo withdraws a 1% fee from the contract price on-chain, so the fee handling happens transparently as part of the escrow flow.",
  },
  {
    question: "How does escrow protect both sides?",
    answer:
      "The client funds the escrow before work begins. The freelancer can see that payment is locked, and the client only releases funds once the agreed work is completed.",
  },
  {
    question: "Who holds the funds?",
    answer:
      "Funds are held by the escrow smart contract during the project flow. Dr3amo does not manually hold or move project funds outside the contract rules.",
  },
  {
    question: "Do I need a crypto wallet?",
    answer:
      "Yes. You need a supported wallet to create, fund, release, or receive escrow payments on-chain.",
  },
  {
    question: "Are there network gas fees?",
    answer:
      "Yes. Blockchain transactions may require gas fees from the connected network. These are separate from Dr3amo's platform fee.",
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
