import { DashboardOverviewScreen } from "@/features/dashboard/components/DashboardOverviewScreen";

export default function DashboardPage() {
  return (
    <DashboardOverviewScreen
      switchDashboardHref="/freelancer"
      switchDashboardLabel="Freelancer Dashboard"
      title="Client Dashboard"
      variant="client"
    />
  );
}
