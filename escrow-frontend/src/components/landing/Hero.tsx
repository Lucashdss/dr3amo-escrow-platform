import DecryptedText from "@/components/DecryptedText";

type HeroProps = {
  isFreelancerView: boolean;
};

export function Hero({ isFreelancerView }: HeroProps) {
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
        Secure escrow payments for freelance work. Fund milestones, approve
        deliveries, and release with confidence.
      </p>

      <section className="mt-14 w-full max-w-3xl rounded-[2rem] bg-white p-4 text-left text-[#2f3136] shadow-2xl md:p-6">
        <div className="mb-4 text-center text-3xl font-black">EscrowFreelance</div>
        <div className="grid gap-4 rounded-3xl bg-[#f3f4f6] p-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-500">Step 1</p>
            <p className="mt-2 font-semibold">Create a contract</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-500">Step 2</p>
            <p className="mt-2 font-semibold">Fund your milestone</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-500">Step 3</p>
            <p className="mt-2 font-semibold">Release when approved</p>
          </div>
        </div>
      </section>
    </>
  );
}
