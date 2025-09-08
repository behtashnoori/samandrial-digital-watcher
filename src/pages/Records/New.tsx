import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "@/lib/api/client";

interface Trigger {
  id: number;
  service_name: string;
  management: string;
  unit: string;
  budget: number;
  actual: number;
  deviation_pct: number;
  due_at: string;
}

const schema = z.object({
  free_text: z.string().min(1).max(1000),
  sample_ref: z.string().optional(),
  actions: z
    .array(
      z.object({
        text: z.string().min(1),
        owner: z.string().min(1),
        due_date: z.string().min(1),
      }),
    )
    .max(3)
    .optional(),
});

type FormValues = z.infer<typeof schema>;

const fetchTrigger = (id: string) => apiFetch<Trigger>(`/api/triggers/${id}`);
const fetchToken = (tok: string) => apiFetch<{ trigger_id: number }>(`/api/token/${tok}`);

const RecordForm = () => {
  const [params] = useSearchParams();
  const { token } = useParams();
  const navigate = useNavigate();
  const triggerIdParam = params.get("triggerId") ?? "";
  const { data: tokenInfo } = useQuery({
    queryKey: ["token", token],
    queryFn: () => fetchToken(token!),
    enabled: !!token,
  });
  const triggerId = token ? String(tokenInfo?.trigger_id ?? "") : triggerIdParam;
  const { data: trigger } = useQuery({
    queryKey: ["trigger", triggerId],
    queryFn: () => fetchTrigger(triggerId),
    enabled: !!triggerId,
  });

  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "actions",
  });
  const [files, setFiles] = useState<File[]>([]);

  const onSubmit = async (values: FormValues) => {
    const res = await apiFetch<{ id: number }>("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trigger_id: token ? undefined : Number(triggerId),
        token: token,
        free_text: values.free_text,
        sample_ref: values.sample_ref,
        actions: values.actions,
      }),
    });
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      await apiFetch(`/api/responses/${res.id}/attachments`, {
        method: "POST",
        body: fd,
      });
    }
    navigate(token ? "/" : "/records");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ارسال پاسخ</h1>
      {trigger && (
        <div className="border p-2 rounded text-sm space-y-1">
          <div>خدمت: {trigger.service_name}</div>
          <div>
            مدیریت/واحد: {trigger.management} / {trigger.unit}
          </div>
          <div>بودجه: {trigger.budget}</div>
          <div>عملکرد: {trigger.actual}</div>
          <div>انحراف٪: {trigger.deviation_pct}</div>
          <div>مهلت: {trigger.due_at}</div>
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <textarea
            className="w-full border rounded p-2"
            placeholder="متن پاسخ"
            maxLength={1000}
            {...form.register("free_text")}
          />
        </div>
        <div>
          <input
            className="w-full border rounded p-2"
            placeholder="ارجاع نمونه"
            {...form.register("sample_ref")}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>اقدامات</span>
            <button
              type="button"
              onClick={() => append({ text: "", owner: "", due_date: "" })}
              disabled={fields.length >= 3}
              className="border rounded px-2"
            >
              افزودن
            </button>
          </div>
          {fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-3 gap-2">
              <input
                className="border rounded p-1"
                placeholder="متن"
                {...form.register(`actions.${idx}.text` as const)}
              />
              <input
                className="border rounded p-1"
                placeholder="مسئول"
                {...form.register(`actions.${idx}.owner` as const)}
              />
              <input
                type="date"
                className="border rounded p-1"
                {...form.register(`actions.${idx}.due_date` as const)}
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-red-600 text-xs"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
        <div>
          <input
            type="file"
            accept=".xlsx,.pdf,.jpg,.jpeg,.png"
            multiple
            onChange={(e) => {
              const allowed = [".xlsx", ".pdf", ".jpg", ".jpeg", ".png"];
              const selected: File[] = [];
              for (const f of Array.from(e.target.files ?? [])) {
                const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
                if (!allowed.includes(ext) || f.size > 5 * 1024 * 1024) continue;
                selected.push(f);
                if (selected.length >= 3) break;
              }
              setFiles(selected);
            }}
          />
        </div>
        <button type="submit" className="border rounded px-4 py-1">
          ثبت
        </button>
      </form>
    </div>
  );
};

export default RecordForm;
