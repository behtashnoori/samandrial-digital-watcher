import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";

interface TopDeviation {
  service_code: string;
  unit_id: number | null;
  deviation: number;
  updated: boolean;
}

interface DashboardData {
  open_triggers: number;
  high_triggers: number;
  response_rate: number;
  weekly: {
    top_deviations: TopDeviation[];
    causes: string[];
    open_actions: number;
  };
}

const Dashboard = () => {
  const { data } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch("/api/dashboard"),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">داشبورد</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>تریگرهای باز</CardTitle>
          </CardHeader>
          <CardContent>{data?.open_triggers ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>تریگرهای High</CardTitle>
          </CardHeader>
          <CardContent>{data?.high_triggers ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>نرخ پاسخ‌گویی (%)</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? data.response_rate.toFixed(1) : 0}
          </CardContent>
        </Card>
      </div>
      <div id="weekly-report" className="space-y-2">
        <div className="flex justify-between items-center mb-2 print:flex">
          <h2 className="text-xl font-semibold">جمع‌بندی هفتگی</h2>
          <a
            href="/api/reports/weekly.xlsx"
            className="text-sm underline print:hidden"
            target="_blank"
          >
            دانلود اکسل
          </a>
        </div>
        <div className="space-y-2">
          {data?.weekly.top_deviations.map((t, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span>
                {t.service_code} / {t.unit_id ?? "-"} : {t.deviation.toFixed(1)}%
              </span>
              {t.updated && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                  به‌روزرسانی‌شده
                </span>
              )}
            </div>
          ))}
          {data && data.weekly.top_deviations.length === 0 && (
            <p className="text-sm">موردی نیست</p>
          )}
          {data && data.weekly.causes.length > 0 && (
            <div className="text-sm">علت‌های پرتکرار: {data.weekly.causes.join("، ")}</div>
          )}
          {data && (
            <div className="text-sm">اقدام‌های باز: {data.weekly.open_actions}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
