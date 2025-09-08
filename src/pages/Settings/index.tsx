import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  threshold: z.number().min(0),
  consecutive_days: z.number().min(1),
  cooldown_days: z.number().min(0),
  due_hours: z.number().min(1),
});

type FormValues = z.infer<typeof schema>;

const fetchSettings = () => apiFetch<FormValues>("/api/settings");
interface TemplateItem {
  id: number;
  name: string;
  variant: string;
  body_fa: string;
  status: string;
}
const fetchTemplates = () =>
  apiFetch<{ templates: TemplateItem[]; assign_rule: string }>(
    "/api/message-templates",
  );
const fetchStats = () => apiFetch<Record<string, number>>("/api/message-templates/stats");

const Settings = () => {
  const { data } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const { data: tmpl } = useQuery({ queryKey: ["templates"], queryFn: fetchTemplates });
  const { data: stats } = useQuery({ queryKey: ["tmpl-stats"], queryFn: fetchStats });
  const [rule, setRule] = useState("random");
  const [bodyA, setBodyA] = useState("");
  const [bodyB, setBodyB] = useState("");
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  useEffect(() => {
    if (tmpl) {
      setRule(tmpl.assign_rule);
      const a = tmpl.templates.find((t) => t.variant === "A");
      const b = tmpl.templates.find((t) => t.variant === "B");
      setBodyA(a?.body_fa ?? "");
      setBodyB(b?.body_fa ?? "");
    }
  }, [tmpl]);

  const onSubmit = async (values: FormValues) => {
    await apiFetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    alert("با موفقیت ذخیره شد");
  };

  const saveTemplates = async () => {
    await apiFetch("/api/message-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assign_rule: rule,
        templates: [
          { variant: "A", name: "A", body_fa: bodyA, status: "active" },
          { variant: "B", name: "B", body_fa: bodyB, status: "active" },
        ],
      }),
    });
    alert("ذخیره شد");
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">تنظیمات</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <label>آستانه انحراف (%)</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            {...form.register("threshold", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1">
          <label>روزهای متوالی</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            {...form.register("consecutive_days", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1">
          <label>روزهای تنفس</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            {...form.register("cooldown_days", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1">
          <label>مهلت پاسخ (ساعت)</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            {...form.register("due_hours", { valueAsNumber: true })}
          />
        </div>
        <button type="submit" className="border rounded px-4 py-1">
          ذخیره
        </button>
      </form>
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">الگوهای پیام</h2>
        <div className="space-y-2">
          <label>قانون تخصیص</label>
          <select
            className="border rounded p-2"
            value={rule}
            onChange={(e) => setRule(e.target.value)}
          >
            <option value="random">تصادفی</option>
            <option value="severity">شدت</option>
            <option value="unit">اداره</option>
          </select>
        </div>
        <div className="space-y-1">
          <label>متن Variant A</label>
          <textarea
            className="w-full border rounded p-2"
            value={bodyA}
            onChange={(e) => setBodyA(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label>متن Variant B</label>
          <textarea
            className="w-full border rounded p-2"
            value={bodyB}
            onChange={(e) => setBodyB(e.target.value)}
          />
        </div>
        <button onClick={saveTemplates} className="border rounded px-4 py-1">
          ذخیره الگوها
        </button>
        <div className="grid gap-4 grid-cols-2 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>نرخ پاسخ Variant A</CardTitle>
            </CardHeader>
            <CardContent>{stats ? stats.A.toFixed(1) : 0}%</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>نرخ پاسخ Variant B</CardTitle>
            </CardHeader>
            <CardContent>{stats ? stats.B.toFixed(1) : 0}%</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
