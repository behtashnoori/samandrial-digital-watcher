import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api/client";

interface RowError {
  row: number;
  errors: string[];
}

interface DiffItem {
  status: string;
  code: string;
}

interface Props {
  title: string;
  endpoint: string;
  template: string;
  allowDeactivate?: boolean;
  successMessage?: string;
  onCommitted?: (res: Record<string, unknown>) => void;
}
const ImportCard = ({ title, endpoint, template, allowDeactivate, successMessage, onCommitted }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [diff, setDiff] = useState<DiffItem[]>([]);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [dryRunDone, setDryRunDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      setDryRunDone(false);
      setErrors([]);
      setDiff([]);
    }
  };

  const submit = async (mode: "dry-run" | "commit") => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const url = `${endpoint}?mode=${mode}` +
      (mode === "commit" && allowDeactivate && confirmDeactivate ? "&confirm_deactivate=true" : "");
    const res = await apiFetch<{
      errors?: RowError[];
      created?: number | string[];
      updated?: number | string[];
      deactivated?: number | string[];
    }>(url, {
      method: "POST",
      body: form,
    });
    if (mode === "dry-run") {
      setErrors(res.errors ?? []);
      const d: DiffItem[] = [];
      (res.created as string[] | undefined)?.forEach((c) =>
        d.push({ status: "ایجاد", code: c })
      );
      (res.updated as string[] | undefined)?.forEach((c) =>
        d.push({ status: "بروزرسانی", code: c })
      );
      (res.deactivated as string[] | undefined)?.forEach((c) =>
        d.push({ status: "غیرفعال", code: c })
      );
      setDiff(d);
      setDryRunDone(true);
    } else {
      setErrors([]);
      setDiff([]);
      setDryRunDone(false);
      toast({
        description:
          successMessage ??
          `ایجاد: ${res.created ?? 0}، بروزرسانی: ${res.updated ?? 0}، غیرفعال: ${res.deactivated ?? 0}`,
      });
      onCommitted?.(res);
      setFile(null);
      setConfirmDeactivate(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div
          className="border-2 border-dashed rounded p-4 text-center cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {file ? file.name : "فایل را اینجا رها کنید یا کلیک کنید"}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              setDryRunDone(false);
              setErrors([]);
              setDiff([]);
            }}
          />
        </div>
        {allowDeactivate && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox
              id="deact"
              checked={confirmDeactivate}
              onCheckedChange={(v) => setConfirmDeactivate(!!v)}
            />
            <Label htmlFor="deact">غیرفعال‌سازی خدمات حذف‌شده</Label>
          </div>
        )}
        {diff.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>وضعیت</th>
                <th>کد</th>
              </tr>
            </thead>
            <tbody>
              {diff.map((d, i) => (
                <tr key={i} className="border-t">
                  <td className="p-1">{d.status}</td>
                  <td className="p-1 text-center">{d.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {errors.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>ردیف</th>
                <th>خطا</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((e) => (
                <tr key={e.row} className="border-t">
                  <td className="p-1 text-center">{e.row}</td>
                  <td className="p-1">{e.errors.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
      <CardFooter className="space-x-2 rtl:space-x-reverse">
        <Button type="button" onClick={() => submit("dry-run")}>Dry-run</Button>
        <Button
          type="button"
          onClick={() => submit("commit")}
          disabled={!dryRunDone || errors.length > 0}
        >
          Commit
        </Button>
        <Button type="button" variant="link" asChild>
          <a href={template} download>
            دانلود الگو
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ImportCard;
