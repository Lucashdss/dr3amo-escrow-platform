"use client";

import { DashboardUserCard } from "@/features/dashboard/components/DashboardUserCard";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { useCreateEscrow } from "@/features/escrows/hooks/useCreateEscrow";
import { EscrowFormFields } from "@/features/escrows/components/EscrowFormFields";
import { EscrowStatusBanner } from "@/features/escrows/components/EscrowStatusBanner";
import { EscrowSubmissionFooter } from "@/features/escrows/components/EscrowSubmissionFooter";

export function ContractCreateScreen() {
  const {
    form,
    handleSubmit,
    handleSwitchChain,
    isLoadingClientUser,
    isSwitchingChain,
    isWrongNetwork,
    selectedChainConfig,
    clientUser,
    displayValues,
  } = useCreateEscrow();

  return (
    <DashboardShell activeNavLabel="Contracts">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div>
            <h1 className="max-w-4xl text-4xl font-black uppercase tracking-tight text-white sm:text-5xl xl:text-6xl">
              Create Escrow Contract
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 sm:text-base">
              Create a secure escrow between the buyer and seller,
              then save it to your account.
            </p>
          </div>
        </div>

        <DashboardUserCard
          displayName={displayValues.displayName}
          hasUser={Boolean(clientUser?.username)}
          profileInitial={displayValues.profileInitial}
          trimmedAddress={displayValues.trimmedAddress}
        />
      </header>

      <section>
        <article className="rounded-[2.2rem] border border-white/10 bg-[#171717] p-6">
          <div className="border-b border-white/10 pb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">
              Contract input
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase text-white">
              Deployment Parameters
            </h2>
          </div>

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <EscrowFormFields
              deadline={form.deadline}
              escrowName={form.escrowName}
              freelancerInput={form.freelancerInput}
              selectedChain={form.selectedChain}
              setDeadline={form.setDeadline}
              setEscrowName={form.setEscrowName}
              setFreelancerInput={form.setFreelancerInput}
              setSelectedChain={form.setSelectedChain}
              setTokenSymbol={form.setTokenSymbol}
              setUpfrontPercentage={form.setUpfrontPercentage}
              tokenSymbol={form.tokenSymbol}
              upfrontPercentage={form.upfrontPercentage}
            />

            <EscrowStatusBanner
              createdEscrowAddress={form.createdEscrowAddress}
              errorMessage={form.errorMessage}
              submittedHash={form.submittedHash}
              successMessage={form.successMessage}
            />

            <EscrowSubmissionFooter
              handleSwitchChain={handleSwitchChain}
              isLoadingClientUser={isLoadingClientUser}
              isSubmitting={form.isSubmitting}
              isSwitchingChain={isSwitchingChain}
              isWrongNetwork={isWrongNetwork}
              selectedChainDisplayName={selectedChainConfig.displayName}
            />
          </form>
        </article>
      </section>
    </DashboardShell>
  );
}
