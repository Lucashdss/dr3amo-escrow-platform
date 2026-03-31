"use client";

import { createDashboardActivity } from "@/features/dashboard/data/dashboardData";
import { useEscrowManagementList } from "@/features/escrows/hooks/useEscrowManagementList";

type DashboardActivityState = {
  error: string | null;
  isLoading: boolean;
  items: ReturnType<typeof createDashboardActivity>;
};

export function useDashboardActivity(): DashboardActivityState {
  const activityFeed = useEscrowManagementList();

  return {
    error: activityFeed.error,
    isLoading: activityFeed.isLoading,
    items: createDashboardActivity(activityFeed.escrows),
  };
}
