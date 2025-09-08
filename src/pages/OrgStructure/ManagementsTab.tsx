import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const schema = z.object({
  name: z.string().min(1, "نام الزامی است"),
  is_active: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ManagementsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["managements"],
    queryFn: () => apiFetch<{ id: number; name: string; is_active: boolean }[]>("/api/org/managements"),
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { is_active: true } });
  const editing = form.watch("id") as number | undefined;

  const mutation = useMutation({
    mutationFn: async (values: FormData & { id?: number }) => {
      if (values.id) {
        return apiFetch(`/api/org/managements/${values.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      }
      return apiFetch(`/api/org/managements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      form.reset({ name: "", is_active: true });
      qc.invalidateQueries({ queryKey: ["managements"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/org/managements/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["managements"] }),
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate({ ...values, id: editing }))}
        className="flex items-end gap-2"
      >
        <Input placeholder="نام" {...form.register("name")} className="w-48" />
        <label className="flex items-center gap-1 text-sm">
          <Checkbox {...form.register("is_active")} /> فعال
        </label>
        <Button type="submit">{editing ? "ویرایش" : "افزودن"}</Button>
      </form>
      <ul className="space-y-2">
        {data?.map((m) => (
          <li key={m.id} className="flex items-center gap-2">
            <span className="flex-1">{m.name}</span>
            <Button variant="ghost" size="sm" onClick={() => form.reset({ ...m, id: m.id })}>
              ویرایش
            </Button>
            <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(m.id)}>
              حذف
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
