import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "@/lib/api/client";

const schema = z.object({
  threshold: z.number().min(0),
  consecutive_days: z.number().min(1),
  cooldown_days: z.number().min(0),
  due_hours: z.number().min(1),
});

type FormValues = z.infer<typeof schema>;

const fetchSettings = () => apiFetch<FormValues>("/api/settings");

const Settings = () => {
  const { data } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  const onSubmit = async (values: FormValues) => {
    await apiFetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    alert("با موفقیت ذخیره شد");
  };

  return (
    <div className="space-y-4 max-w-sm">
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
    </div>
  );
};

export default Settings;
