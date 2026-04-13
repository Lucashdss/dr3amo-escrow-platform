"use client";

import { useState } from "react";

import { LandingHomeContent } from "@/components/landing/LandingHomeContent";
import { LandingShell } from "@/components/landing/LandingShell";

export default function Home() {
  const [isFreelancerView, setIsFreelancerView] = useState(false);
  const backgroundClass = isFreelancerView ? "bg-[#22007C]" : "bg-[#04052E]";
  const accentTextClass = isFreelancerView
    ? "text-[#22007C]"
    : "text-[#04052E]";

  return (
    <LandingShell
      accentTextClassName={accentTextClass}
      backgroundClassName={backgroundClass}
    >
      <LandingHomeContent
        isFreelancerView={isFreelancerView}
        onViewChange={setIsFreelancerView}
      />
    </LandingShell>
  );
}
