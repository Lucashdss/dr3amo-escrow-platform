import { DashboardOverviewScreen } from "@/features/dashboard/components/DashboardOverviewScreen";

export default function DashboardPage() {
  return (
    <DashboardOverviewScreen
      switchDashboardHref="/client"
      switchDashboardLabel="Client Dashboard"
      title="Freelancer Dashboard"
      variant="freelancer"
    />
  );
}
