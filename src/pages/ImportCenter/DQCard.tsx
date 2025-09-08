import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

type Issue = { level: string; message: string };

const DQCard = ({ onResult }: { onResult: (issues: Issue[]) => void }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<Issue[]>("/api/dq/run", { method: "POST" });
      setIssues(res);
      onResult(res);
    } finally {
      setLoading(false);
    }
  };

  const icon = (lvl: string) =>
    lvl === "error" ? "❌" : lvl === "warning" ? "⚠️" : "✅";

  return (
    <div className="border rounded p-4 space-y-2">
      <div className="flex justify-between items-center">
        <div className="font-bold">کنترل کیفیت</div>
        <Button onClick={run} disabled={loading}>
          {loading ? "در حال بررسی..." : "اجرا"}
        </Button>
      </div>
      {issues.length > 0 && (
        <table className="w-full text-sm">
          <tbody>
            {issues.map((i, idx) => (
              <tr
                key={idx}
                className={
                  i.level === "error"
                    ? "text-red-600"
                    : i.level === "warning"
                    ? "text-yellow-600"
                    : "text-green-600"
                }
              >
                <td className="pr-2">{icon(i.level)}</td>
                <td>{i.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DQCard;
