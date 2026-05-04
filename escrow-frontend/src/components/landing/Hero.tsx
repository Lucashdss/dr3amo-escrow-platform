import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import DecryptedText from "@/components/DecryptedText";

type HeroProps = Readonly<{
  isFreelancerView: boolean;
  onCreateEscrow: () => void;
}>;

const CLIENT_STEPS = [
  "Create a contract",
  "Fund your milestone",
  "Release when approved",
];

const FREELANCER_STEPS = [
  "Set your minimum price",
  "Submit your work",
  "Get paid when approved",
];

const CLIENT_HERO_COPY = {
  headline: "Pay safely when hiring online",
  subheadline:
    "Lock your payment in escrow before work starts. The seller can see the funds are secured, but the money is only released when the agreed conditions are met.",
} as const;

const FREELANCER_HERO_COPY = {
  headline: "Know the money is already secured",
  subheadline:
    "Start the work with confidence. The buyer’s funds are locked in escrow before you deliver, so you are not relying only on promises or blind trust.",
} as const;

const TRUST_ITEMS = [
  "Built on Base",
  "Low network fees",
  "1% withdrawal fee",
  "No marketplace middleman",
] as const;

export function Hero({ isFreelancerView, onCreateEscrow }: HeroProps) {
  const steps = isFreelancerView ? FREELANCER_STEPS : CLIENT_STEPS;
  const copy = isFreelancerView ? FREELANCER_HERO_COPY : CLIENT_HERO_COPY;

  return (
    <>
      <h1 className="w-full max-w-full text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:max-w-4xl md:text-7xl">
        <DecryptedText
          key={isFreelancerView ? "freelancer" : "client"}
          parentClassName="block w-full max-w-full whitespace-normal"
          style={{
            display: "block",
            overflowWrap: "normal",
            wordBreak: "normal",
            whiteSpace: "normal",
            width: "100%",
          }}
          text={copy.headline}
          animateOn="view"
        />
      </h1>
      <p className="mt-6 w-full max-w-2xl text-lg text-white/80 md:text-xl">
        {copy.subheadline}
      </p>

      <HeroActions onCreateEscrow={onCreateEscrow} />
      <HeroTrustLine />

      <section className="mt-14 w-full max-w-3xl rounded-[2rem] bg-black p-4 text-left text-white shadow-2xl md:p-6">
        <div className="mb-4 text-center text-3xl font-black">
          Escrow Flow
        </div>
        <div className="grid gap-4 rounded-3xl bg-zinc-900 p-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl bg-black p-4 shadow-sm">
              <p className="text-sm text-white/65">Step {index + 1}</p>
              <p className="mt-2 font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function HeroActions({
  onCreateEscrow,
}: Readonly<{
  onCreateEscrow: () => void;
}>) {
  return (
    <div className="mt-9 flex w-full max-w-2xl flex-col justify-center gap-4 sm:flex-row">
      <button
        type="button"
        onClick={onCreateEscrow}
        className="rounded-full bg-white px-6 py-3 text-base font-semibold text-[#2f3136] transition hover:bg-white/90"
      >
        Create an escrow
      </button>
      <Link
        href="/#landing-contact"
        className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white"
      >
        Talk to us
      </Link>
    </div>
  );
}

function HeroTrustLine() {
  return (
    <div className="mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium text-white/62 md:text-base">
      <ShieldCheck
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-white/72"
        strokeWidth={1.8}
      />
      {TRUST_ITEMS.map((item, index) => (
        <span key={item} className="inline-flex items-center gap-4">
          {index > 0 ? <span className="text-white/40">•</span> : null}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}
