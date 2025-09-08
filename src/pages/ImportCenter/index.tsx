import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api/client";
import ImportCard from "./ImportCard";

const ImportCenter = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const compute = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ budget: number; deviation: number }>(
        "/api/recompute",
        { method: "POST" },
      );
      toast({ description: `بودجه: ${res.budget}، انحراف: ${res.deviation}` });
    } catch (e) {
      toast({ description: "خطا در محاسبه", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">مرکز ورود داده</h1>
      <ImportCard
        title="خدمات"
        endpoint="/api/import/services"
        template="/api/templates/services.xlsx"
        allowDeactivate
      />
      <ImportCard
        title="بودجه سالانه"
        endpoint="/api/import/budget-annual"
        template="/api/templates/budget-annual.xlsx"
        successMessage="بودجه ثبت شد؛ محاسبات تازه‌سازی خواهد شد"
      />
      <ImportCard
        title="عملکرد روزانه"
        endpoint="/api/import/ops-actual"
        template="/api/templates/ops-actual.xlsx"
      />
      <ImportCard
        title="تقویم ۱۴۰۴"
        endpoint="/api/import/calendar-1404"
        template="/api/templates/calendar-1404.xlsx"
      />
      <ImportCard
        title="وزن فصلی ۱۴۰۳"
        endpoint="/api/import/seasonality"
        template="/api/templates/seasonality.xlsx"
      />
      <div>
        <Button onClick={compute} disabled={loading}>
          {loading ? "در حال محاسبه..." : "محاسبه بودجه روزانه"}
        </Button>
      </div>
    </div>
  );
};

export default ImportCenter;
