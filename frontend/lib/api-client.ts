/**
 * Thin fetch wrapper around the FastAPI backend. Attaches the JWT access
 * token from storage and the API base URL. Extend with refresh-token
 * handling once Milestone 2 (Auth) endpoints beyond signup/login exist.
 */
function resolveApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:7020/api/v1`;
  }
  return "http://localhost:7020/api/v1";
}

const API_URL = resolveApiUrl();

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("munshi_access_token");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Downloads a CSV report (SPECIFICATION.md §6 `/reports/{name}?format=csv`). */
export async function downloadReportCsv(name: string, params: Record<string, string> = {}): Promise<void> {
  const token = getAccessToken();
  const query = new URLSearchParams({ format: "csv", ...params });
  const res = await fetch(`${API_URL}/reports/${name}?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Export failed: ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
