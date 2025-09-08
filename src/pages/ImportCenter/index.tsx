import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api/client";
import ImportCard from "./ImportCard";

interface DiffItem {
  service_code: string;
  unit_id?: number | null;
}
interface ImpactedTrigger {
  id: number;
  service_code: string;
}
interface DiffRes {
  added: DiffItem[];
  removed: DiffItem[];
  changed: DiffItem[];
  triggers?: ImpactedTrigger[];
}

const ImportCenter = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [budgetDiff, setBudgetDiff] = useState<DiffRes | null>(null);

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
        onCommitted={async (res) => {
          if (res.prev_snapshot && res.snapshot) {
            const diff = await apiFetch<DiffRes>(
              `/api/budget/diff?from=${res.prev_snapshot}&to=${res.snapshot}`,
            );
            const impacted = await apiFetch<ImpactedTrigger[]>(
              `/api/triggers/impacted?snapshot=${res.snapshot}`,
            );
            setBudgetDiff({ ...diff, triggers: impacted });
          }
        }}
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
      {budgetDiff && (
        <div className="border p-2 rounded text-sm space-y-2">
          <div className="font-bold">تغییرات بودجه</div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div>افزوده</div>
              {budgetDiff.added.map((a, i) => (
                <div key={i}>{a.service_code}</div>
              ))}
            </div>
            <div>
              <div>حذف</div>
              {budgetDiff.removed.map((a, i) => (
                <div key={i}>{a.service_code}</div>
              ))}
            </div>
            <div>
              <div>تغییر</div>
              {budgetDiff.changed.map((a, i) => (
                <div key={i}>{a.service_code}</div>
              ))}
            </div>
          </div>
          {budgetDiff.triggers && budgetDiff.triggers.length > 0 && (
            <div>
              <div className="font-bold">تریگرهای متاثر</div>
              {budgetDiff.triggers.map((t) => (
                <div key={t.id}>{t.service_code}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportCenter;
