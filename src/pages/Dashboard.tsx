import { AlertTriangle, TrendingUp, Users, CheckCircle } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";

export function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">داشبورد</h1>
        <p className="text-muted-foreground">
          نمای کلی از وضعیت سیستم و عملکرد سازمان
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="تریگرهای باز"
          value="۱۲"
          description="تریگرهای در انتظار پاسخ"
          icon={AlertTriangle}
          variant="warning"
          trend={{ value: -8, label: "نسبت به ماه قبل" }}
        />
        <StatsCard
          title="شدت بالا"
          value="۳"
          description="تریگرهای با اولویت بالا"
          icon={AlertTriangle}
          variant="destructive"
          trend={{ value: 15, label: "نسبت به ماه قبل" }}
        />
        <StatsCard
          title="نرخ پاسخ‌گویی"
          value="۸۷٪"
          description="پاسخ‌های به موقع"
          icon={CheckCircle}
          variant="success"
          trend={{ value: 5, label: "بهبود نسبت به ماه قبل" }}
        />
        <StatsCard
          title="علت‌های پرتکرار"
          value="۵"
          description="دسته‌بندی‌های اصلی"
          icon={TrendingUp}
          variant="default"
          trend={{ value: -2, label: "کاهش تنوع" }}
        />
      </div>

      {/* Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChart />
        </div>
        
        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="font-semibold text-primary mb-2">اقدامات سریع</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span>بررسی تریگرهای شدت بالا</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>آپلود عملکرد روزانه</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>بررسی گزارش‌های تکمیل شده</span>
              </li>
            </ul>
          </div>
          
          <div className="p-4 bg-muted/50 border border-border rounded-lg">
            <h3 className="font-semibold mb-2">آخرین فعالیت‌ها</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">آپلود بودجه سالانه</span>
                <span className="text-xs text-muted-foreground">۲ ساعت پیش</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">پاسخ به تریگر #۱۲۳</span>
                <span className="text-xs text-muted-foreground">۴ ساعت پیش</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">به‌روزرسانی ساختار سازمانی</span>
                <span className="text-xs text-muted-foreground">دیروز</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}