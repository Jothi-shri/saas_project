type ViteEnv = { env?: Record<string, string | undefined> };

function readViteApiUrl(): string {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> } as ViteEnv;
    return (meta.env?.VITE_API_URL ?? "").trim().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export const API_BASE = readViteApiUrl();

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return API_BASE ? `${API_BASE}${path.startsWith("/") ? path : `/${path}`}` : path;
}
