import { DashboardOverviewScreen } from "@/features/dashboard/components/DashboardOverviewScreen";

export default function DashboardPage() {
  return (
    <DashboardOverviewScreen
      switchDashboardHref="/client"
      switchDashboardLabel="Buyer Dashboard"
      title="Seller Dashboard"
      variant="freelancer"
    />
  );
}
