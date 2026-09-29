// NOTE: keep import.meta.env access direct (no aliasing) for Vite build replacement.

function readViteApiUrl(): string {
  try {
    // Direct access so Vite statically replaces it at production build time.
    // Do not alias import.meta or use dynamic keys — that prevents replacement
    // and leaves the production bundle with an empty API base (login 404s
    // against the Netlify origin instead of the Render backend).
    const raw = import.meta.env.VITE_API_URL as string | undefined;
    return (raw ?? "").trim().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export const API_BASE = readViteApiUrl();

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return API_BASE ? `${API_BASE}${path.startsWith("/") ? path : `/${path}`}` : path;
}
