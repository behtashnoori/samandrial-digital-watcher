import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const schema = z.object({
  service_code: z.string().min(1),
  management_id: z.number().optional(),
  unit_id: z.number().optional(),
  head_id: z.number().optional(),
  valid_from: z.string(),
  valid_to: z.string().optional(),
  is_current: z.boolean().optional(),
});

type FormData = z.infer<typeof schema> & { id?: number };

export default function ServiceAssignmentTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["service-assignment"],
    queryFn: () =>
      apiFetch<
        {
          id: number;
          service_code: string;
          management_id: number | null;
          unit_id: number | null;
          head_id: number | null;
          valid_from: string;
          valid_to: string | null;
          is_current: boolean;
        }[]
      >("/api/org/service-assignment"),
  });
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: () => apiFetch<{ code: string; name: string }[]>("/api/services"),
  });
  const { data: managements } = useQuery({
    queryKey: ["managements"],
    queryFn: () => apiFetch<{ id: number; name: string }[]>("/api/org/managements"),
  });
  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: () => apiFetch<{ id: number; name: string }[]>("/api/org/units"),
  });
  const { data: heads } = useQuery({
    queryKey: ["heads"],
    queryFn: () => apiFetch<{ id: number; full_name: string }[]>("/api/org/heads"),
  });
  const serviceMap = Object.fromEntries(
    (services ?? []).map((s) => [s.code, s.name])
  ) as Record<string, string>;
  const managementMap = Object.fromEntries(
    (managements ?? []).map((m) => [m.id, m.name])
  ) as Record<number, string>;
  const unitMap = Object.fromEntries((units ?? []).map((u) => [u.id, u.name])) as Record<
    number,
    string
  >;
  const headMap = Object.fromEntries((heads ?? []).map((h) => [h.id, h.full_name])) as Record<
    number,
    string
  >;
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const editing = form.watch("id") as number | undefined;
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      setError(null);
      if (values.id) {
        return apiFetch(`/api/org/service-assignment/${values.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      }
      return apiFetch(`/api/org/service-assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      form.reset({});
      qc.invalidateQueries({ queryKey: ["service-assignment"] });
    },
    onError: (err: ApiError) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/org/service-assignment/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-assignment"] }),
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate({ ...values, id: editing }))}
        className="flex flex-wrap items-end gap-2"
      >
        <div>
          <Input list="services" placeholder="کد خدمت" {...form.register("service_code")} className="w-40" />
          <datalist id="services">
            {services?.map((s) => (
              <option key={s.code} value={s.code} label={s.name} />
            ))}
          </datalist>
        </div>
        
        <Select
          onValueChange={(v) => form.setValue("management_id", Number(v))}
          value={String(form.watch("management_id") ?? "")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="مدیریت" />
          </SelectTrigger>
          <SelectContent>
            {managements?.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => form.setValue("unit_id", Number(v))} value={String(form.watch("unit_id") ?? "")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="واحد" />
          </SelectTrigger>
          <SelectContent>
            {units?.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => form.setValue("head_id", Number(v))} value={String(form.watch("head_id") ?? "")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="رئیس" />
          </SelectTrigger>
          <SelectContent>
            {heads?.map((h) => (
              <SelectItem key={h.id} value={String(h.id)}>
                {h.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" {...form.register("valid_from")} />
        <Input type="date" {...form.register("valid_to")} />
        <label className="flex items-center gap-1 text-sm">
          <Checkbox {...form.register("is_current")} /> جاری
        </label>
        <Button type="submit">{editing ? "ویرایش" : "افزودن"}</Button>
      </form>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <ul className="space-y-2">
        {data?.map((s) => {
          const serviceName = serviceMap[s.service_code] ?? s.service_code;
          const managementName = s.management_id
            ? managementMap[s.management_id]
            : undefined;
          const unitName = s.unit_id ? unitMap[s.unit_id] : undefined;
          const headName = s.head_id ? headMap[s.head_id] : undefined;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span className="flex-1">
                {serviceName}
                {managementName && ` - ${managementName}`}
                {unitName && ` - ${unitName}`}
                {headName && ` - ${headName}`}
                {" "}({s.valid_from} تا {s.valid_to ?? "نامحدود"})
              </span>
              <Button variant="ghost" size="sm" onClick={() => form.reset({ ...s, id: s.id })}>
                ویرایش
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(s.id)}>
                حذف
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
