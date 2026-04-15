type EscrowStatusBannerProps = Readonly<{
  createdEscrowAddress: string | null;
  errorMessage: string | null;
  submittedHash: string | null;
  successMessage: string | null;
}>;

export function EscrowStatusBanner({
  createdEscrowAddress,
  errorMessage,
  submittedHash,
  successMessage,
}: EscrowStatusBannerProps) {
  if (errorMessage) {
    return (
      <div className="rounded-[1.4rem] border border-red-400/30 bg-red-500/10 px-4 py-4 text-sm leading-6 text-red-200">
        {errorMessage}
      </div>
    );
  }

  if (!successMessage) {
    return null;
  }

  return (
    <div className="rounded-[1.4rem] border border-[#b6ef5f]/30 bg-[#b6ef5f]/10 px-4 py-4 text-sm leading-6 text-[#e6f7c6]">
      <p>{successMessage}</p>
      {submittedHash ? <p className="mt-2 break-all">Tx: {submittedHash}</p> : null}
      {createdEscrowAddress ? (
        <p className="mt-2 break-all">Escrow: {createdEscrowAddress}</p>
      ) : null}
    </div>
  );
}
