import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// Mock data for performance chart
const performanceData = [
  { month: "فروردین", planned: 85, actual: 78 },
  { month: "اردیبهشت", planned: 90, actual: 88 },
  { month: "خردا", planned: 88, actual: 85 },
  { month: "تیر", planned: 92, actual: 95 },
  { month: "مرداد", planned: 87, actual: 89 },
  { month: "شهریور", planned: 95, actual: 92 },
];

export function PerformanceChart() {
  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">نمودار عملکرد ماهانه</CardTitle>
        <p className="text-sm text-muted-foreground">
          مقایسه برنامه و عملکرد در شش ماه گذشته
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="planned"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#plannedGradient)"
                strokeWidth={2}
                name="برنامه"
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--success))"
                fillOpacity={1}
                fill="url(#actualGradient)"
                strokeWidth={2}
                name="عملکرد"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}