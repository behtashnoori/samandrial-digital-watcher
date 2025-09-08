import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const schema = z.object({
  full_name: z.string().min(1, "نام الزامی است"),
  phone: z.string().optional(),
  is_active: z.boolean().optional(),
});

type FormData = z.infer<typeof schema> & { id?: number };

export default function HeadsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["heads"],
    queryFn: () => apiFetch<{ id: number; full_name: string; phone?: string; is_active: boolean }[]>("/api/org/heads"),
  });
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { is_active: true } });
  const editing = form.watch("id") as number | undefined;

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      if (values.id) {
        return apiFetch(`/api/org/heads/${values.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      }
      return apiFetch(`/api/org/heads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      form.reset({ full_name: "", phone: "", is_active: true });
      qc.invalidateQueries({ queryKey: ["heads"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/org/heads/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["heads"] }),
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate({ ...values, id: editing }))}
        className="flex items-end gap-2"
      >
        <Input placeholder="نام" {...form.register("full_name")} className="w-40" />
        <Input placeholder="تلفن" {...form.register("phone")} className="w-40" />
        <label className="flex items-center gap-1 text-sm">
          <Checkbox {...form.register("is_active")} /> فعال
        </label>
        <Button type="submit">{editing ? "ویرایش" : "افزودن"}</Button>
      </form>
      <ul className="space-y-2">
        {data?.map((h) => (
          <li key={h.id} className="flex items-center gap-2">
            <span className="flex-1">{h.full_name}</span>
            <Button variant="ghost" size="sm" onClick={() => form.reset({ ...h, id: h.id })}>
              ویرایش
            </Button>
            <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(h.id)}>
              حذف
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
