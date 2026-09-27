import { create } from "zustand";
import { authService, type AuthUser } from "./api/authService";

export interface SaaSFeature {
  id: string;
  label: string;
  icon: string;
  group: string;
  status: string;
  workspace: string;
  tagline: string;
  summary: string;
  capabilities: string[];
  roadmap?: string | null;
}
export type StoredFeature = SaaSFeature;

export type Theme = "dark" | "light" | "ocean";
const THEME_KEY = "saas-theme";

function loadTheme(): Theme {
  if (typeof localStorage === "undefined") return "dark";
  const raw = localStorage.getItem(THEME_KEY);
  return raw === "light" || raw === "ocean" ? (raw as Theme) : "dark";
}

const themeVars: Record<Theme, Record<string, string>> = {
  light: {
    "--text": "#5d6575",
    "--text-h": "#141a28",
    "--bg": "#fdfdfb",
    "--border": "#e5e3d9",
    "--code-bg": "#f1f0ea",
    "--accent": "#4f46e5",
    "--accent-bg": "rgba(79, 70, 229, 0.08)",
    "--accent-border": "rgba(79, 70, 229, 0.28)",
    "--social-bg": "rgba(241, 240, 234, 0.7)",
    "--shadow": "0 1px 2px rgba(20, 26, 40, 0.05), 0 12px 32px -16px rgba(20, 26, 40, 0.18)",
    "--auth-text-muted": "#8a91a1",
    "--auth-input-bg": "#f6f6f3",
    "--auth-error-bg": "#fef2f2",
    "--auth-error-border": "#fecaca",
    "--auth-error-text": "#b91c1c",
    "--bg-4": "#e8e6de",
    "--sidebar-bg": "#fbfbfa",
    "--sidebar-border": "#e6e4db",
    "--sidebar-text": "#1c2333",
    "--sidebar-text-muted": "#6f7686",
    "--sidebar-hover-bg": "#efeee8",
    "--sidebar-active-bg": "rgba(79, 70, 229, 0.1)",
    "--sidebar-active-text": "#4f46e5",
    "--main-bg": "#f4f4f1",
    "--topbar-bg": "rgba(244,244,241,0.85)",
  },
  dark: {
    "--text": "#9aa6bd",
    "--text-h": "#f1f5fa",
    "--bg": "#131b2e",
    "--border": "rgba(148, 163, 184, 0.16)",
    "--code-bg": "#1b2540",
    "--accent": "#38bdf8",
    "--accent-bg": "rgba(56, 189, 248, 0.12)",
    "--accent-border": "rgba(56, 189, 248, 0.32)",
    "--social-bg": "rgba(27, 37, 64, 0.6)",
    "--shadow": "0 1px 2px rgba(2, 6, 17, 0.5), 0 12px 32px -12px rgba(2, 6, 17, 0.65)",
    "--auth-text-muted": "#7c8aa0",
    "--auth-input-bg": "#161f36",
    "--auth-error-bg": "rgba(220, 38, 38, 0.12)",
    "--auth-error-border": "rgba(248, 113, 113, 0.4)",
    "--auth-error-text": "#fca5a5",
    "--bg-4": "#24304d",
    "--sidebar-bg": "#0a0f1e",
    "--sidebar-border": "rgba(148, 163, 184, 0.14)",
    "--sidebar-text": "#e6ebf5",
    "--sidebar-text-muted": "#8b96ad",
    "--sidebar-hover-bg": "rgba(148, 163, 184, 0.1)",
    "--sidebar-active-bg": "rgba(56, 189, 248, 0.14)",
    "--sidebar-active-text": "#7dd3fc",
    "--main-bg": "#0c1220",
    "--topbar-bg": "rgba(12,18,32,0.82)",
  },
  ocean: {
    "--text": "#9cc3cf",
    "--text-h": "#f2feff",
    "--bg": "#0a2e3d",
    "--border": "rgba(103, 232, 249, 0.16)",
    "--code-bg": "#0f3d52",
    "--accent": "#22d3ee",
    "--accent-bg": "rgba(34, 211, 238, 0.12)",
    "--accent-border": "rgba(34, 211, 238, 0.34)",
    "--social-bg": "rgba(15, 61, 82, 0.6)",
    "--shadow": "0 1px 2px rgba(2, 20, 27, 0.5), 0 14px 36px -14px rgba(2, 20, 27, 0.7)",
    "--auth-text-muted": "#6f9dab",
    "--auth-input-bg": "#0c3547",
    "--auth-error-bg": "rgba(220, 38, 38, 0.14)",
    "--auth-error-border": "rgba(248, 113, 113, 0.4)",
    "--auth-error-text": "#fca5a5",
    "--bg-4": "#155063",
    "--sidebar-bg": "#04202c",
    "--sidebar-border": "rgba(103, 232, 249, 0.14)",
    "--sidebar-text": "#eafcff",
    "--sidebar-text-muted": "#7fb6c4",
    "--sidebar-hover-bg": "rgba(103, 232, 249, 0.08)",
    "--sidebar-active-bg": "rgba(34, 211, 238, 0.16)",
    "--sidebar-active-text": "#67e8f9",
    "--main-bg": "#06222e",
    "--topbar-bg": "rgba(6,34,46,0.84)",
  },
};

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.transition = "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease";
  const vars = themeVars[theme];
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.style.setProperty("--auth-heading", "var(--text-h)");
  root.style.setProperty("--auth-text", "var(--text)");
  root.style.setProperty("--auth-primary-from", "var(--accent)");
  root.style.setProperty("--auth-primary-to", "#7c3aed");
  root.style.setProperty("--auth-border", "var(--border)");
  root.style.setProperty("--sans", 'system-ui, "Segoe UI", Roboto, sans-serif');
  root.style.setProperty("--heading", 'system-ui, "Segoe UI", Roboto, sans-serif');
  root.style.setProperty("--mono", 'ui-monospace, Consolas, monospace');
  document.body.style.background = "var(--bg)";
  document.body.style.color = "var(--text)";
  document.body.style.transition = "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease";
}

const initialTheme = loadTheme();
applyTheme(initialTheme);

const initialUser = authService.loadUser();
const initialAccessToken: string | null = null;
const PAGE_KEY = "saas-page";
function loadPage(): string {
  if (typeof localStorage === "undefined") return "dashboard";
  return localStorage.getItem(PAGE_KEY) || "dashboard";
}

const ADMIN_SESSION_KEYS = [
  "is_admin_session",
  "admin_session",
  "isAdminSession",
] as const;
function loadIsAdminSession(): boolean {
  if (typeof localStorage === "undefined") return false;
  for (const k of ADMIN_SESSION_KEYS) {
    if (localStorage.getItem(k) === "true") return true;
  }
  return false;
}
function persistIsAdminSession(isAdminSessionEnabled: boolean) {
  if (typeof localStorage === "undefined") return;
  for (const k of ADMIN_SESSION_KEYS) {
    if (isAdminSessionEnabled) localStorage.setItem(k, "true");
    else localStorage.removeItem(k);
  }
}
const initialIsAdminSession = loadIsAdminSession();

export interface IntegrationConfig {
  id: string;
  name: string;
  endpointUrl: string;
  resolution: string;
  refreshRate: number;
}

export interface WorkspaceEntityState {
  entityId: string;
  name: string;
  description: string;
  kind: "workspace" | "project";
  status: "active" | "trial" | "archived";
  ownerId: string;
  memberCount?: number;
  taskCount?: number;
  createdAt: string;
  updatedAt: string;
  integrations?: IntegrationConfig[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "completed" | "archived";
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  status: "active" | "invited" | "offline";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  projectId?: string;
}

export interface Analytics {
  totalProjects: number;
  completedTasks: number;
  activeTeamMembers: number;
  revenueGrowth: number;
  tasksCompletedOverTime: number[];
  revenueByProject: { projectName: string; revenue: number }[];
}

export type DashboardStats = Analytics;

export interface Activity {
  id: string;
  teamMemberId: string;
  teamMemberName: string;
  action: string;
  projectId: string | null;
  taskId: string | null;
  timestamp: string;
}

export interface Filters {
  status: string;
  priority: string;
  assigneeId: string;
  search: string;
}

const METRIC_HISTORY_LENGTH = 60;
const KPI_HISTORY_LEN = METRIC_HISTORY_LENGTH;

export type DashboardViewMode = "standard" | "analytics";
export type ViewportMode = DashboardViewMode;
export type RenderQuality = "low" | "med" | "high";

export type ToastKind = "info" | "success" | "warn" | "error";
export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  msg?: string;
  ttl: number; // ms before auto-dismiss (0 = sticky)
}
let toastSeq = 0;

export interface RenderSettings {
  bloom: boolean;
  ao: boolean; // ambient occlusion (SSAO)
  grid: boolean;
  shadows: boolean;
  labels: boolean;
  quality: RenderQuality;
}

interface SaaSStore {
  workspaceId: string;
  connected: boolean;

  dbFeatures: SaaSFeature[];
  setDbFeatures: (features: SaaSFeature[]) => void;
  workspaceEntities: Record<string, WorkspaceEntityState>;
  metrics: Record<string, number>;
  metricHistory: Record<string, number[]>;
  selectedWorkspaceEntityId: string | null;
  followSelected: boolean;

  accessToken: string | null;
  user: AuthUser | null;
  isAdminSession: boolean;
  authView: "login" | "register" | "admin";

  toasts: Toast[];
  cmdkOpen: boolean;

  page: string; // active feature page id (see features.ts)
  navCollapsed: boolean;

  theme: Theme;

  dashboardViewMode: DashboardViewMode;
  render: RenderSettings;
  fps: number;
  simClock: number; // seconds of sim time elapsed (advances while connected)
  livePreviewEnabled: boolean;
  setLivePreviewEnabled: (shouldUseLivePreview: boolean) => void;

  pushToast: (toastNotification: Omit<Toast, "id" | "ttl"> & { ttl?: number }) => number;
  dismissToast: (toastId: number) => void;
  setCmdkOpen: (isCommandPaletteOpen: boolean) => void;
  setAccessToken: (token: string | null) => void;
  setAuth: (
    authToken: string,
    refreshTokenOrUser: string | AuthUser,
    authenticatedUserOrIsAdmin?: AuthUser | boolean,
    isAdminSession?: boolean,
  ) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setAuthView: (selectedAuthView: "login" | "register" | "admin") => void;
  setPage: (selectedPageId: string) => void;
  toggleNav: () => void;
  setWorkspaceId: (selectedWorkspaceId: string) => void;
  setConnected: (isConnected: boolean) => void;
  setSnapshot: (workspaceSnapshot: Record<string, WorkspaceEntityState>) => void;
  updateWorkspaceEntity: (workspaceEntityState: WorkspaceEntityState) => void;
  updateMetric: (metricName: string, metricValue: number) => void;
  selectWorkspaceEntity: (selectedWorkspaceEntityIdentifier: string | null) => void;
  setFollowSelected: (shouldFollowSelected: boolean) => void;
  setTheme: (selectedTheme: Theme) => void;
  setDashboardViewMode: (selectedDashboardViewMode: DashboardViewMode) => void;
  toggleRender: (renderKey: keyof Omit<RenderSettings, "quality">) => void;
  setQuality: (selectedQuality: RenderQuality) => void;
  setFps: (framesPerSecond: number) => void;
  tickClock: (deltaTime: number) => void;

  projects: Project[];
  selectedProject: Project | null;
  tasks: Task[];
  teamMembers: TeamMember[];
  selectedTeamMember: TeamMember | null;
  notifications: Notification[];
  analytics: Analytics | null;
  activity: Activity[];
  dashboardStats: DashboardStats | null;
  searchQuery: string;
  filters: Filters;
  currentPage: number;
  isLoading: boolean;
  isSubmitting: boolean;

  setProjects: (projectList: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  setTasks: (taskList: Task[]) => void;
  setTeamMembers: (teamMemberList: TeamMember[]) => void;
  setSelectedTeamMember: (teamMember: TeamMember | null) => void;
  setNotifications: (notificationList: Notification[]) => void;
  setAnalytics: (analyticsReport: Analytics | null) => void;
  setActivity: (activityFeed: Activity[]) => void;
  setDashboardStats: (stats: DashboardStats | null) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filterCriteria: Filters) => void;
  setCurrentPage: (pageNumber: number) => void;
  setIsLoading: (loadingState: boolean) => void;
  setIsSubmitting: (submittingState: boolean) => void;
}

export const useSaaSStore = create<SaaSStore>((set, get) => ({
  workspaceId: "demo",
  connected: false,
  dbFeatures: [],
  setDbFeatures: (dbFeatures) => set({ dbFeatures }),
  workspaceEntities: {},
  metrics: {},
  metricHistory: {},
  selectedWorkspaceEntityId: null,
  followSelected: false,

  accessToken: initialAccessToken,
  user: initialUser,
  isAdminSession: initialIsAdminSession,
  authView: "login",

  toasts: [],
  cmdkOpen: false,

  page: loadPage(),
  navCollapsed: false,

  theme: initialTheme,

  dashboardViewMode: "standard",
  render: {
    bloom: true,
    ao: true,
    grid: true,
    shadows: true,
    labels: true,
    quality: "high",
  },
  fps: 0,
  simClock: 0,
  livePreviewEnabled: false,
  setLivePreviewEnabled: (shouldUseLivePreview) => set({ livePreviewEnabled: shouldUseLivePreview }),

  pushToast: ({ ttl = 2500, ...rest }: Omit<Toast, "id" | "ttl"> & { ttl?: number }) => {
    const toastId = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts, { id: toastId, ttl, ...rest }] }));
    if (ttl > 0) {
      setTimeout(() => {
        get().dismissToast(toastId);
      }, ttl);
    }
    return toastId;
  },
  dismissToast: (toastId) =>
    set((s) => ({ toasts: s.toasts.filter((toastNotification) => toastNotification.id !== toastId) })),
  setCmdkOpen: (isCommandPaletteOpen) => set({ cmdkOpen: isCommandPaletteOpen }),
  setAccessToken: (token) => set({ accessToken: token }),
  setAuth: (authToken: string, refreshTokenOrUser: any, authenticatedUserOrIsAdmin?: any, isAdminSession = false) => {
    let user: AuthUser | null = null;
    let isAdmin = false;
    if (typeof refreshTokenOrUser === "object" && refreshTokenOrUser !== null && "email" in refreshTokenOrUser) {
      user = refreshTokenOrUser as AuthUser;
      isAdmin = Boolean(authenticatedUserOrIsAdmin);
    } else if (typeof authenticatedUserOrIsAdmin === "object" && authenticatedUserOrIsAdmin !== null && "email" in authenticatedUserOrIsAdmin) {
      user = authenticatedUserOrIsAdmin as AuthUser;
      isAdmin = Boolean(isAdminSession);
    }
    if (!user) return;
    authService.persist(authToken, "", user);
    persistIsAdminSession(isAdmin);
    set({ accessToken: authToken, user, isAdminSession: isAdmin });
  },
  logout: async () => {
    try {
      await authService.logout();
    } catch {}
    authService.clear();
    persistIsAdminSession(false);
    set({ accessToken: null, user: null, isAdminSession: false, authView: "login" });
  },
  initializeAuth: async () => {
    const { accessToken, user } = get();
    if (accessToken && user) return;
    const newToken = await authService.refresh();
    if (!newToken) {
      authService.clear();
      persistIsAdminSession(false);
      set({ accessToken: null, user: null, isAdminSession: false });
      return;
    }
    const me = await authService.fetchMe(newToken);
    if (me) {
      authService.persist(newToken, "", me);
      set({ accessToken: newToken, user: me });
    } else {
      set({ accessToken: newToken });
    }
  },
  setAuthView: (selectedAuthView) => set({ authView: selectedAuthView }),
  setPage: (selectedPageId) => {
    if (typeof localStorage !== "undefined")
      localStorage.setItem(PAGE_KEY, selectedPageId);
    set({ page: selectedPageId });
  },
  toggleNav: () => set((s) => ({ navCollapsed: !s.navCollapsed })),
  setWorkspaceId: (selectedWorkspaceId) =>
    set({
      workspaceId: selectedWorkspaceId,
      workspaceEntities: {},
      metrics: {},
      metricHistory: {},
      selectedWorkspaceEntityId: null,
      simClock: 0,
    }),
  setConnected: (isConnected) => set({ connected: isConnected }),
  setSnapshot: (workspaceSnapshot) => set({ workspaceEntities: workspaceSnapshot }),
  updateWorkspaceEntity: (workspaceEntityState) =>
    set((s) => {
      const previousWorkspaceEntityState = s.workspaceEntities[workspaceEntityState.entityId];
      const mergedWorkspaceEntityState = previousWorkspaceEntityState
        ? { ...previousWorkspaceEntityState, ...workspaceEntityState }
        : workspaceEntityState;
      if (!("integrations" in workspaceEntityState) && previousWorkspaceEntityState?.integrations) {
        mergedWorkspaceEntityState.integrations = previousWorkspaceEntityState.integrations;
      }
      if (!("description" in workspaceEntityState) && previousWorkspaceEntityState?.description) {
        mergedWorkspaceEntityState.description = previousWorkspaceEntityState.description;
      }
      return { workspaceEntities: { ...s.workspaceEntities, [workspaceEntityState.entityId]: mergedWorkspaceEntityState } };
    }),
  updateMetric: (metricName, metricValue) =>
    set((s) => {
      const previousMetricHistory = s.metricHistory[metricName] ?? [];
      const nextMetricHistory = [...previousMetricHistory, metricValue].slice(-METRIC_HISTORY_LENGTH);
      return {
        metrics: { ...s.metrics, [metricName]: metricValue },
        metricHistory: { ...s.metricHistory, [metricName]: nextMetricHistory },
      };
    }),
  selectWorkspaceEntity: (selectedWorkspaceEntityIdentifier) => set({ selectedWorkspaceEntityId: selectedWorkspaceEntityIdentifier }),
  setFollowSelected: (shouldFollowSelected) => set({ followSelected: shouldFollowSelected }),
  setTheme: (selectedTheme) => {
    if (typeof localStorage !== "undefined")
      localStorage.setItem(THEME_KEY, selectedTheme);
    applyTheme(selectedTheme);
    set({ theme: selectedTheme });
  },
  setDashboardViewMode: (selectedDashboardViewMode) => set({ dashboardViewMode: selectedDashboardViewMode }),
  toggleRender: (renderKey) =>
    set((s) => ({ render: { ...s.render, [renderKey]: !s.render[renderKey] } })),
  setQuality: (selectedQuality) => set((s) => ({ render: { ...s.render, quality: selectedQuality } })),
  setFps: (framesPerSecond) => set({ fps: framesPerSecond }),
  tickClock: (deltaTime) => set((s) => ({ simClock: s.simClock + deltaTime })),

  projects: [],
  selectedProject: null,
  tasks: [],
  teamMembers: [],
  selectedTeamMember: null,
  notifications: [],
  analytics: null,
  activity: [],
  dashboardStats: null,
  searchQuery: "",
  filters: { status: "all", priority: "all", assigneeId: "all", search: "" },
  currentPage: 1,
  isLoading: false,
  isSubmitting: false,

  setProjects: (projectList) => set({ projects: projectList }),
  setSelectedProject: (project) => set({ selectedProject: project }),
  setTasks: (taskList) => set({ tasks: taskList }),
  setTeamMembers: (teamMemberList) => set({ teamMembers: teamMemberList }),
  setSelectedTeamMember: (teamMember) => set({ selectedTeamMember: teamMember }),
  setNotifications: (notificationList) => set({ notifications: notificationList }),
  setAnalytics: (analyticsReport) => set({ analytics: analyticsReport, dashboardStats: analyticsReport }),
  setActivity: (activityFeed) => set({ activity: activityFeed }),
  setDashboardStats: (stats) => set({ dashboardStats: stats, analytics: stats }),
  setSearchQuery: (query) => set({ searchQuery: query, filters: { ...useSaaSStore.getState().filters, search: query } }),
  setFilters: (filterCriteria) => set({ filters: filterCriteria }),
  setCurrentPage: (pageNumber) => set({ currentPage: pageNumber }),
  setIsLoading: (loadingState) => set({ isLoading: loadingState }),
  setIsSubmitting: (submittingState) => set({ isSubmitting: submittingState }),
}));
