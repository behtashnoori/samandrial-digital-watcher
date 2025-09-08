import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(1, "نام الزامی است"),
  management_id: z.number(),
  is_active: z.boolean().optional(),
});

type FormData = z.infer<typeof schema> & { id?: number };

export default function UnitsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["units"],
    queryFn: () => apiFetch<{ id: number; name: string; management_id: number; is_active: boolean }[]>("/api/org/units"),
  });
  const { data: managements } = useQuery({
    queryKey: ["managements"],
    queryFn: () => apiFetch<{ id: number; name: string }[]>("/api/org/managements"),
  });
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { is_active: true } });
  const editing = form.watch("id") as number | undefined;

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      if (values.id) {
        return apiFetch(`/api/org/units/${values.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      }
      return apiFetch(`/api/org/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      form.reset({ name: "", management_id: managements?.[0]?.id, is_active: true });
      qc.invalidateQueries({ queryKey: ["units"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/org/units/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate({ ...values, id: editing }))}
        className="flex items-end gap-2"
      >
        <Input placeholder="نام" {...form.register("name")} className="w-40" />
        <Select onValueChange={(v) => form.setValue("management_id", Number(v))} value={String(form.watch("management_id") ?? "")}>
          <SelectTrigger className="w-40">
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
        <label className="flex items-center gap-1 text-sm">
          <Checkbox {...form.register("is_active")} /> فعال
        </label>
        <Button type="submit">{editing ? "ویرایش" : "افزودن"}</Button>
      </form>
      <ul className="space-y-2">
        {data?.map((u) => (
          <li key={u.id} className="flex items-center gap-2">
            <span className="flex-1">{u.name}</span>
            <Button variant="ghost" size="sm" onClick={() => form.reset({ ...u, id: u.id })}>
              ویرایش
            </Button>
            <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(u.id)}>
              حذف
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
