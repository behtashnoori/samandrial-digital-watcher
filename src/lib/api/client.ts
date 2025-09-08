export interface ApiError extends Error {
  status: number;
  data: unknown;
}

export async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
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
