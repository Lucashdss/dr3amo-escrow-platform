type EscrowSubmissionFooterProps = {
  deliveryDaysPreview: number | null;
  handleSwitchChain: () => Promise<void>;
  isLoadingClientUser: boolean;
  isSubmitting: boolean;
  isSwitchingChain: boolean;
  isWrongNetwork: boolean;
  selectedChainDisplayName: string;
  upfrontBpsPreview: number | null;
};

export function EscrowSubmissionFooter({
  deliveryDaysPreview,
  handleSwitchChain,
  isLoadingClientUser,
  isSubmitting,
  isSwitchingChain,
  isWrongNetwork,
  selectedChainDisplayName,
  upfrontBpsPreview,
}: EscrowSubmissionFooterProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
      <div className="flex flex-col gap-2 text-sm leading-6 text-white/48">
        <p>
          Client status:{" "}
          {isLoadingClientUser ? "checking account record..." : "ready for submission"}
        </p>
        <p>Active network: {selectedChainDisplayName}</p>
        <p>
          Delivery period preview:{" "}
          {deliveryDaysPreview && deliveryDaysPreview > 0
            ? `${deliveryDaysPreview} day${deliveryDaysPreview === 1 ? "" : "s"}`
            : "select a future date"}
        </p>
        <p>BPS preview: {upfrontBpsPreview === null ? "enter 0-100" : upfrontBpsPreview}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-white/48">
          The factory call uses the selected freelancer, derived delivery days,
          the chosen Base network data feed, selected token, fixed admin, and
          computed bps.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {isWrongNetwork ? (
            <button
              type="button"
              onClick={() => void handleSwitchChain()}
              disabled={isSwitchingChain || isSubmitting}
              className="rounded-[1.6rem] border border-white/15 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSwitchingChain
                ? "Switching..."
                : `Switch To ${selectedChainDisplayName}`}
            </button>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || isLoadingClientUser}
            className="rounded-[1.6rem] border border-[#b6ef5f]/35 bg-[#b6ef5f] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Escrow"}
          </button>
        </div>
      </div>
    </div>
  );
}
