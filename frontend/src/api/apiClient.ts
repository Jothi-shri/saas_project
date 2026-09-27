import { authService } from "./authService";
import { resolveApiUrl } from "./apiBase";
import { useSaaSStore } from "../store";

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const newToken = await authService.refresh();
    if (newToken) {
      useSaaSStore.getState().setAccessToken(newToken);
      const currentUser = useSaaSStore.getState().user;
      if (!currentUser) {
        const me = await authService.fetchMe(newToken);
        if (me) {
          authService.persist(newToken, "", me);
          useSaaSStore.setState({ user: me });
        }
      }
      return true;
    }
    return false;
  })();
  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
}

function clearAndRedirect() {
  const store = useSaaSStore.getState();
  authService.logout().catch(() => {});
  store.setAccessToken(null);
  useSaaSStore.setState({ user: null, isAdminSession: false, authView: "login", accessToken: null });
  authService.clear();
  try {
    localStorage.removeItem("user");
  } catch {}
  window.location.href = "/";
}

export async function apiClient<T = any>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const token = useSaaSStore.getState().accessToken;
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = resolveApiUrl(path);
  const res = await fetch(url, {
    method: method ?? (body ? "POST" : "GET"),
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const newToken = useSaaSStore.getState().accessToken;
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
      const retry = await fetch(url, {
        method: method ?? (body ? "POST" : "GET"),
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
      });
      if (!retry.ok) {
        clearAndRedirect();
        throw new Error(`${retry.status} ${await retry.text()}`);
      }
      return retry.json();
    }
    clearAndRedirect();
    throw new Error("Session expired");
  }

  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = apiClient;
export default apiClient;
