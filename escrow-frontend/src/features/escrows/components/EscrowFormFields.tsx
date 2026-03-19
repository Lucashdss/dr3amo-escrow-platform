import { ESCROW_DEPLOYMENT_CONFIGS } from "@/features/escrows/config/deployment";
import { CHAIN_OPTIONS, TOKEN_OPTIONS } from "@/features/escrows/services/validation";
import type { EscrowChainKey, TokenSymbol } from "@/features/escrows/types/escrow";

type EscrowFormFieldsProps = {
  deadline: string;
  freelancerInput: string;
  selectedChain: EscrowChainKey;
  setDeadline: (value: string) => void;
  setFreelancerInput: (value: string) => void;
  setSelectedChain: (value: EscrowChainKey) => void;
  setTokenSymbol: (value: TokenSymbol) => void;
  setUpfrontPercentage: (value: string) => void;
  tokenSymbol: TokenSymbol;
  upfrontPercentage: string;
};

export function EscrowFormFields({
  deadline,
  freelancerInput,
  selectedChain,
  setDeadline,
  setFreelancerInput,
  setSelectedChain,
  setTokenSymbol,
  setUpfrontPercentage,
  tokenSymbol,
  upfrontPercentage,
}: EscrowFormFieldsProps) {
  return (
    <>
      <label className="grid gap-3">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/62">
          Freelancer address or username
        </span>
        <input
          type="text"
          value={freelancerInput}
          onChange={(event) => setFreelancerInput(event.target.value)}
          placeholder="0x1234...abcd or freelancer_username"
          className="rounded-[1.4rem] border border-white/10 bg-black/25 px-4 py-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-[#b6ef5f]/45"
        />
        <span className="text-sm leading-6 text-white/45">
          Direct wallet input is allowed, but the freelancer still needs an
          existing app account so the escrow can be persisted.
        </span>
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/62">
            Deadline date
          </span>
          <input
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className="rounded-[1.4rem] border border-white/10 bg-black/25 px-4 py-4 text-base text-white outline-none transition [color-scheme:dark] focus:border-[#b6ef5f]/45"
          />
          <span className="text-sm leading-6 text-white/45">
            The selected date is converted into whole days until deadline for
            `deliveryPeriod`.
          </span>
        </label>

        <label className="grid gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/62">
            Chain
          </span>
          <select
            value={selectedChain}
            onChange={(event) => setSelectedChain(event.target.value as EscrowChainKey)}
            className="rounded-[1.4rem] border border-white/10 bg-black/25 px-4 py-4 text-base font-semibold text-white outline-none transition focus:border-[#b6ef5f]/45"
          >
            {CHAIN_OPTIONS.map((chainOption) => (
              <option key={chainOption} value={chainOption}>
                {ESCROW_DEPLOYMENT_CONFIGS[chainOption].displayName}
              </option>
            ))}
          </select>
          <span className="text-sm leading-6 text-white/45">
            Choose Base Mainnet or Base Sepolia. Sepolia uses its own data feed,
            token addresses, and factory address.
          </span>
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/62">
            Funding token
          </span>
          <select
            value={tokenSymbol}
            onChange={(event) => setTokenSymbol(event.target.value as TokenSymbol)}
            className="rounded-[1.4rem] border border-white/10 bg-black/25 px-4 py-4 text-base text-white outline-none transition focus:border-[#b6ef5f]/45"
          >
            {TOKEN_OPTIONS.map((tokenOption) => (
              <option key={tokenOption} value={tokenOption}>
                {tokenOption}
              </option>
            ))}
          </select>
          <span className="text-sm leading-6 text-white/45">
            ETH maps to the zero address and USDC follows the selected chain.
          </span>
        </label>

        <label className="grid gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/62">
            Upfront payment percentage
          </span>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={upfrontPercentage}
            onChange={(event) => setUpfrontPercentage(event.target.value)}
            placeholder="20"
            className="rounded-[1.4rem] border border-white/10 bg-black/25 px-4 py-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-[#b6ef5f]/45"
          />
          <span className="text-sm leading-6 text-white/45">
            Whole-number percentages are converted to basis points for `bps`.
          </span>
        </label>
      </div>
    </>
  );
}
