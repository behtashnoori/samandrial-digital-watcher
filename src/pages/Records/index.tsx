import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface Attachment {
  id: number;
  file_name: string;
  uri: string;
}

interface ResponseItem {
  id: number;
  trigger_id: number | null;
  free_text: string | null;
  sample_ref: string | null;
  actions?: { text: string; owner: string; due_date: string }[];
  submitted_at: string;
  attachments: Attachment[];
}

const fetchResponses = () => apiFetch<ResponseItem[]>("/api/responses");

interface SearchHit {
  text: string;
  service_code?: string;
  unit_id?: number;
  period?: string;
  severity?: string;
  head_id?: number | null;
}

const Records = () => {
  const { data } = useQuery({ queryKey: ["responses"], queryFn: fetchResponses });
  const [filter, setFilter] = useState("");
  const filtered = data?.filter(
    (r) =>
      r.free_text?.includes(filter) ||
      String(r.trigger_id ?? "").includes(filter) ||
      r.sample_ref?.includes(filter),
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const handleSearch = async () => {
    const res = await apiFetch<SearchHit[]>("/api/rag/search", {
      method: "POST",
      body: { q: query },
    });
    setResults(res);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">سوابق</h1>
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">فهرست</TabsTrigger>
          <TabsTrigger value="search">جست‌وجو</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="فیلتر..."
            className="border rounded px-2 py-1"
          />
          <ul className="space-y-4">
            {filtered?.map((r) => (
              <li key={r.id} className="border rounded p-3 space-y-2">
                <div className="text-xs text-gray-600">{r.submitted_at}</div>
                <div>{r.free_text}</div>
                {r.actions && r.actions.length > 0 && (
                  <ul className="list-disc pr-4 text-sm">
                    {r.actions.map((a, idx) => (
                      <li key={idx}>
                        {a.text} - {a.owner} - {a.due_date}
                      </li>
                    ))}
                  </ul>
                )}
                {r.attachments.map((a) => (
                  <a key={a.id} href={a.uri} className="block text-blue-600">
                    {a.file_name}
                  </a>
                ))}
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="search" className="space-y-4">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="عبارت..."
              className="border rounded px-2 py-1 flex-1"
            />
            <Button onClick={handleSearch}>جست‌وجو</Button>
          </div>
          <ul className="space-y-4">
            {results.map((r, idx) => (
              <li key={idx} className="border rounded p-3 space-y-1">
                <div>{r.text}</div>
                <div className="text-xs text-gray-600">
                  {r.service_code} - {r.period}
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Records;
