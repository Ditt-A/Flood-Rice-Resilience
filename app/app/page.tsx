import { DashboardClient } from "@/src/components/DashboardClient";
import { getDashboardData } from "@/src/lib/data";

export const dynamic = "force-static";

export default function Home() {
  const data = getDashboardData();
  return <DashboardClient data={data} />;
}
