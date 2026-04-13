"use client";

import { Hero } from "@/components/landing/Hero";
import { LandingCodeSection } from "@/components/landing/LandingCodeSection";
import { LandingContactSection } from "@/components/landing/LandingContactSection";
import { LandingFaqSection } from "@/components/landing/LandingFaqSection";
import { LandingSectionDivider } from "@/components/landing/LandingSectionDivider";
import { useLandingShell } from "@/components/landing/LandingShell";
import { LandingShowcaseSection } from "@/components/landing/LandingShowcaseSection";
import { CREATE_CONTRACT_ROUTE } from "@/components/landing/landingShowcase";

type LandingHomeContentProps = Readonly<{
  isFreelancerView: boolean;
  onViewChange: (isFreelancerView: boolean) => void;
}>;

function ViewToggle({
  isFreelancerView,
  onViewChange,
}: LandingHomeContentProps) {
  return (
    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/80 p-1 text-sm font-semibold">
      <button
        type="button"
        onClick={() => onViewChange(false)}
        className={`w-36 rounded-full px-5 py-2 text-center transition duration-300 ${
          isFreelancerView
            ? "text-white/90 hover:bg-white/10"
            : "scale-125 bg-white text-[#04052E]"
        }`}
      >
        Buyer
      </button>
      <button
        type="button"
        onClick={() => onViewChange(true)}
        className={`w-36 rounded-full px-5 py-2 text-center transition duration-300 ${
          isFreelancerView
            ? "scale-125 bg-white text-[#22007C]"
            : "text-white/90 hover:bg-white/10"
        }`}
      >
        Seller
      </button>
    </div>
  );
}

function ViewToggleSkeleton() {
  return (
    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/80 p-1 text-sm font-semibold">
      <button
        type="button"
        disabled
        className="w-36 rounded-full bg-white px-5 py-2 text-center text-[#04052E] opacity-90"
      >
        Buyer
      </button>
      <button
        type="button"
        disabled
        className="w-36 rounded-full px-5 py-2 text-center text-white/70 opacity-80"
      >
        Seller
      </button>
    </div>
  );
}

export function LandingHomeContent({
  isFreelancerView,
  onViewChange,
}: LandingHomeContentProps) {
  const { isMounted, navigateToProtectedRoute } = useLandingShell();

  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 pb-20 pt-10 text-center md:px-10 md:pt-16">
        <LandingViewToggle
          isMounted={isMounted}
          isFreelancerView={isFreelancerView}
          onViewChange={onViewChange}
        />
        <Hero isFreelancerView={isFreelancerView} />
      </main>

      <LandingSectionDivider />
      <LandingShowcaseSection
        onCreateContract={() => navigateToProtectedRoute(CREATE_CONTRACT_ROUTE)}
      />
      <LandingSectionDivider />
      <LandingCodeSection />
      <LandingSectionDivider />
      <LandingFaqSection />
      <LandingSectionDivider />
      <LandingContactSection />
      <LandingSectionDivider />
    </>
  );
}

type LandingShellStateProps = Readonly<{
  isMounted: boolean;
  isFreelancerView: boolean;
  onViewChange: (isFreelancerView: boolean) => void;
}>;

function LandingViewToggle({
  isMounted,
  isFreelancerView,
  onViewChange,
}: LandingShellStateProps) {
  return isMounted ? (
    <ViewToggle
      isFreelancerView={isFreelancerView}
      onViewChange={onViewChange}
    />
  ) : (
    <ViewToggleSkeleton />
  );
}
