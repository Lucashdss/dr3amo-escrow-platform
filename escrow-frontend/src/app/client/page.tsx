import { DashboardOverviewScreen } from "@/features/dashboard/components/DashboardOverviewScreen";

export default function DashboardPage() {
  return (
    <DashboardOverviewScreen
      switchDashboardHref="/freelancer"
      switchDashboardLabel="Seller Dashboard"
      title="Buyer Dashboard"
      variant="client"
    />
  );
}
