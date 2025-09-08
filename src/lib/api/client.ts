export interface ApiError extends Error {
  status: number;
  data: unknown;
}

export async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const opts = init ? { ...init } : {};
  opts.headers = opts.headers ? { ...opts.headers } : {};
  const method = (opts.method || "GET").toUpperCase();
  if (method !== "GET") {
    const m = document.cookie.match(/csrf_token=([^;]+)/);
    if (m) (opts.headers as Record<string, string>)["X-CSRFToken"] = m[1];
  }
  const res = await fetch(input, opts);
  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as Record<string, unknown>).message)
        : res.statusText;
    const error: ApiError = Object.assign(new Error(message), {
      status: res.status,
      data,
    });
    throw error;
  }
  return data as T;
}

export const apiClient = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};
