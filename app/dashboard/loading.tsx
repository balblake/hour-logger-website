import { BrandLogo } from "@/components/BrandLogo";

export default function DashboardLoading() {
  return (
    <main className="portal-loading" aria-label="Loading dashboard">
      <BrandLogo className="portal-loading-brand" />
      <div>
        <strong>Opening your private dashboard</strong>
        <span>Loading categories, sessions, and goals…</span>
      </div>
    </main>
  );
}
