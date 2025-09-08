import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

interface Trigger {
  id: number;
  date: string;
  service_code: string;
  service_name: string;
  management: string;
  unit: string;
  budget: number;
  actual: number;
  deviation_pct: number;
  severity: string;
  due_at: string;
  head_name: string;
  assigned_head_id: number;
  updated?: boolean;
}

const fetchTriggers = () => apiFetch<Trigger[]>("/api/triggers");

const Triggers = () => {
  const { data } = useQuery({ queryKey: ["triggers"], queryFn: fetchTriggers });
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");

  const filtered = data?.filter(
    (t) =>
      t.service_name.includes(filter) ||
      t.management.includes(filter) ||
      t.unit.includes(filter),
  );

  const recompute = async () => {
    await apiFetch("/api/compute/deviations", { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["triggers"] });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">تریگرها</h1>
      <div className="flex items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="فیلتر..."
          className="border rounded px-2 py-1"
        />
        <button onClick={recompute} className="border rounded px-3 py-1">
          محاسبه انحرافات
        </button>
      </div>
      <table className="min-w-full text-sm text-right">
        <thead>
          <tr className="border-b">
            <th className="p-2">تاریخ</th>
            <th className="p-2">خدمت</th>
            <th className="p-2">مدیریت</th>
            <th className="p-2">واحد</th>
            <th className="p-2">بودجه</th>
            <th className="p-2">عملکرد</th>
            <th className="p-2">انحراف٪</th>
            <th className="p-2">شدت</th>
            <th className="p-2">مهلت</th>
            <th className="p-2">رئیس</th>
            <th className="p-2">وضعیت</th>
            <th className="p-2">اقدام</th>
          </tr>
        </thead>
        <tbody>
          {filtered?.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-2">{t.date}</td>
              <td className="p-2">{t.service_name}</td>
              <td className="p-2">{t.management}</td>
              <td className="p-2">{t.unit}</td>
              <td className="p-2">{t.budget}</td>
              <td className="p-2">{t.actual}</td>
              <td className="p-2">{t.deviation_pct}</td>
              <td className="p-2">{t.severity}</td>
              <td className="p-2">{t.due_at}</td>
              <td className="p-2">{t.head_name}</td>
              <td className="p-2">
                {t.updated && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    به‌روزرسانی‌شده
                  </span>
                )}
              </td>
              <td className="p-2">
                <Link
                  className="text-blue-600 underline"
                  to={`/records/new?triggerId=${t.id}`}
                >
                  ارسال فرم سؤال
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Triggers;
