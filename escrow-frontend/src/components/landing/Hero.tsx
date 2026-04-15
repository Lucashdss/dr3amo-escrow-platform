import DecryptedText from "@/components/DecryptedText";

type HeroProps = Readonly<{
  isFreelancerView: boolean;
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

export function Hero({ isFreelancerView }: HeroProps) {
  const steps = isFreelancerView ? FREELANCER_STEPS : CLIENT_STEPS;

  return (
    <>
      <h1 className="max-w-4xl text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
        <DecryptedText
          key={isFreelancerView ? "freelancer" : "client"}
          text={
            isFreelancerView
              ? "Be sure that your money is waiting for you."
              : "Pay the way your project needs."
          }
          animateOn="view"
        />
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
        Secure escrow payments for any service. Fund milestones, approve
        deliveries, and release with confidence.
      </p>

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
