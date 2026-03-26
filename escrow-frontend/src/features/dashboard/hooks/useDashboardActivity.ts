"use client";

import { createDashboardActivity } from "@/features/dashboard/data/dashboardData";
import { useEscrowManagementList } from "@/features/escrows/hooks/useEscrowManagementList";

type DashboardActivityState = {
  error: string | null;
  isLoading: boolean;
  items: ReturnType<typeof createDashboardActivity>;
};

export function useDashboardActivity(
  userId: number | undefined
): DashboardActivityState {
  const activityFeed = useEscrowManagementList(userId);

  return {
    error: activityFeed.error,
    isLoading: activityFeed.isLoading,
    items: createDashboardActivity(activityFeed.escrows),
  };
}
