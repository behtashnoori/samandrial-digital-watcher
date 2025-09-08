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
  head_id: z.number(),
  unit_id: z.number(),
  valid_from: z.string(),
  valid_to: z.string().optional(),
  is_current: z.boolean().optional(),
});

type FormData = z.infer<typeof schema> & { id?: number };

export default function TenureTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["tenure"],
    queryFn: () =>
      apiFetch<
        { id: number; head_id: number; unit_id: number; valid_from: string; valid_to: string | null; is_current: boolean }[]
      >("/api/org/tenure"),
  });
  const { data: heads } = useQuery({
    queryKey: ["heads"],
    queryFn: () => apiFetch<{ id: number; full_name: string }[]>("/api/org/heads"),
  });
  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: () => apiFetch<{ id: number; name: string }[]>("/api/org/units"),
  });
  const headMap = Object.fromEntries(
    (heads ?? []).map((h) => [h.id, h.full_name])
  ) as Record<number, string>;
  const unitMap = Object.fromEntries((units ?? []).map((u) => [u.id, u.name])) as Record<
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
        return apiFetch(`/api/org/tenure/${values.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      }
      return apiFetch(`/api/org/tenure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      form.reset({});
      qc.invalidateQueries({ queryKey: ["tenure"] });
    },
    onError: (err: ApiError) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/org/tenure/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenure"] }),
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate({ ...values, id: editing }))}
        className="flex flex-wrap items-end gap-2"
      >
        <Select onValueChange={(v) => form.setValue("head_id", Number(v))} value={String(form.watch("head_id") ?? "")}>
          <SelectTrigger className="w-40">
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
        <Select onValueChange={(v) => form.setValue("unit_id", Number(v))} value={String(form.watch("unit_id") ?? "")}>
          <SelectTrigger className="w-40">
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
        <Input type="date" {...form.register("valid_from")} />
        <Input type="date" {...form.register("valid_to")} />
        <label className="flex items-center gap-1 text-sm">
          <Checkbox {...form.register("is_current")} /> جاری
        </label>
        <Button type="submit">{editing ? "ویرایش" : "افزودن"}</Button>
      </form>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <ul className="space-y-2">
        {data?.map((t) => (
          <li key={t.id} className="flex items-center gap-2">
            <span className="flex-1">
              {headMap[t.head_id] ?? t.head_id} → {unitMap[t.unit_id] ?? t.unit_id}
            </span>
            <Button variant="ghost" size="sm" onClick={() => form.reset({ ...t, id: t.id })}>
              ویرایش
            </Button>
            <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(t.id)}>
              حذف
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
