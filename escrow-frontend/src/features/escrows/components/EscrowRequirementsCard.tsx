export function EscrowRequirementsCard() {
  return (
    <aside className="rounded-[2.2rem] border border-white/10 bg-[#171717] p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/50">
        Requirements
      </p>
      <h3 className="mt-3 text-2xl font-black uppercase text-white">Input Rules</h3>

      <div className="mt-6 space-y-3">
        <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
            Registered freelancer
          </p>
          <p className="mt-2 text-sm leading-6 text-white/68">
            Usernames resolve through the app API. Direct wallet addresses are
            valid only if that wallet already belongs to a saved freelancer user.
          </p>
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
            Network target
          </p>
          <p className="mt-2 text-sm leading-6 text-white/68">
            Factory address, data feed, and token addresses change with the chosen
            Base network. Base Sepolia requires
            `NEXT_PUBLIC_FACTORY_BASE_SEPOLIA_ADDRESS`.
          </p>
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
            Persistence
          </p>
          <p className="mt-2 text-sm leading-6 text-white/68">
            Onchain success is followed by a backend save with `amount = 0` and
            `state = created`.
          </p>
        </div>
      </div>
    </aside>
  );
}
