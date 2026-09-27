import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSaaSStore } from "../../store";
import { apiClient } from "../../api/apiClient";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  ChartNoAxesCombined,
  Bell,
  Settings,
  Search,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react";

interface PageEntry {
  kind: "page";
  id: string;
  label: string;
  hint: string;
  path: string;
  icon: LucideIcon;
}

const PAGES: PageEntry[] = [
  { kind: "page", id: "page-dashboard", label: "Dashboard", hint: "Workspace overview", path: "/dashboard", icon: LayoutDashboard },
  { kind: "page", id: "page-projects", label: "Projects", hint: "Plan and track work", path: "/projects", icon: FolderKanban },
  { kind: "page", id: "page-tasks", label: "Tasks", hint: "Deliverables and due dates", path: "/tasks", icon: ListChecks },
  { kind: "page", id: "page-team", label: "Team", hint: "People, roles and access", path: "/team", icon: Users },
  { kind: "page", id: "page-analytics", label: "Analytics", hint: "Revenue and trends", path: "/analytics", icon: ChartNoAxesCombined },
  { kind: "page", id: "page-notifications", label: "Notifications", hint: "Inbox and alerts", path: "/notifications", icon: Bell },
  { kind: "page", id: "page-settings", label: "Settings", hint: "Profile and appearance", path: "/settings", icon: Settings },
];

type Result =
  | PageEntry
  | { kind: "project"; id: string; label: string; hint: string }
  | { kind: "task"; id: string; label: string; hint: string }
  | { kind: "member"; id: string; label: string; hint: string };

const GROUP_TITLES: Record<Result["kind"], string> = {
  page: "Go to",
  project: "Projects",
  task: "Tasks",
  member: "Team",
};

const MAX_PER_GROUP = 5;

export default function CommandPalette() {
  const open = useSaaSStore((s) => s.cmdkOpen);
  const setOpen = useSaaSStore((s) => s.setCmdkOpen);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingData, setLoadingData] = useState(false);

  const projects = useSaaSStore((s) => s.projects);
  const tasks = useSaaSStore((s) => s.tasks);
  const teamMembers = useSaaSStore((s) => s.teamMembers);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useSaaSStore.getState().setCmdkOpen(!useSaaSStore.getState().cmdkOpen);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);

    const state = useSaaSStore.getState();
    const needsProjects = state.projects.length === 0;
    const needsTasks = state.tasks.length === 0;
    const needsTeam = state.teamMembers.length === 0;
    if (needsProjects || needsTasks || needsTeam) {
      setLoadingData(true);
      (async () => {
        try {
          const [projectsData, tasksData, teamData]: any = await Promise.all([
            needsProjects ? apiClient("/api/projects") : null,
            needsTasks ? apiClient("/api/tasks") : null,
            needsTeam ? apiClient("/api/team") : null,
          ]);
          const s = useSaaSStore.getState();
          if (projectsData) s.setProjects(projectsData.projects ?? []);
          if (tasksData) s.setTasks(tasksData.tasks ?? []);
          if (teamData) s.setTeamMembers(teamData.members ?? teamData.teamMembers ?? []);
        } catch {
        } finally {
          setLoadingData(false);
        }
      })();
    }
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open ]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (text: string) => !q || text.toLowerCase().includes(q);

    const pages = PAGES.filter((p) => match(`${p.label} ${p.hint}`)).slice(0, MAX_PER_GROUP);

    const projectResults: Result[] = [];
    for (const p of projects) {
      if (projectResults.length >= MAX_PER_GROUP) break;
      if (match(`${p.name} ${p.description} ${p.status}`)) {
        projectResults.push({ kind: "project", id: p.id, label: p.name, hint: `${p.status} · ${p.description || "No description"}` });
      }
    }

    const taskResults: Result[] = [];
    const projectNameOf = (projectId: string) => projects.find((p) => p.id === projectId)?.name ?? "Unknown project";
    for (const t of tasks) {
      if (taskResults.length >= MAX_PER_GROUP) break;
      if (match(`${t.title} ${t.description} ${t.status} ${t.priority}`)) {
        taskResults.push({ kind: "task", id: t.id, label: t.title, hint: `${t.status} · ${t.priority} · ${projectNameOf(t.projectId)}` });
      }
    }

    const memberResults: Result[] = [];
    for (const m of teamMembers) {
      if (memberResults.length >= MAX_PER_GROUP) break;
      if (match(`${m.name} ${m.email} ${m.role} ${m.status}`)) {
        memberResults.push({ kind: "member", id: m.id, label: m.name, hint: `${m.role} · ${m.email}` });
      }
    }

    return [
      { kind: "page" as const, items: pages },
      { kind: "project" as const, items: projectResults },
      { kind: "task" as const, items: taskResults },
      { kind: "member" as const, items: memberResults },
    ].filter((g) => g.items.length > 0);
  }, [query, projects, tasks, teamMembers]);

  const flat: Result[] = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query ]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function choose(result: Result) {
    const state = useSaaSStore.getState();
    if (result.kind === "page") {
      navigate(result.path);
    } else if (result.kind === "project") {
      const project = state.projects.find((p) => p.id === result.id);
      if (project) state.setSelectedProject(project);
      navigate("/projects");
    } else if (result.kind === "task") {
      navigate("/tasks");
    } else {
      const member = state.teamMembers.find((m) => m.id === result.id);
      if (member) state.setSelectedTeamMember(member);
      navigate("/team");
    }
    setOpen(false);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = flat[activeIndex];
      if (current) choose(current);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  if (!open) return null;

  let cursor = -1;

  return (
    <div
      className="modal-overlay fixed inset-0 z-[100] flex items-start justify-center bg-black/55 p-4 pt-[12vh] backdrop-blur-[2px]"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to search"
        onClick={(e) => e.stopPropagation()}
        className="modal-panel card w-full max-w-xl overflow-hidden"
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3">
          <Search size={17} className="shrink-0 text-[var(--text-muted)]" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Jump to a page, project, task, or teammate…"
            aria-label="Jump to search"
            role="combobox"
            aria-expanded="true"
            aria-controls="jump-to-results"
            aria-activedescendant={flat[activeIndex] ? `jump-to-${flat[activeIndex].kind}-${flat[activeIndex].id}` : undefined}
            className="w-full bg-transparent text-[15px] text-[var(--text-h)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--text-muted)] sm:block">
            esc
          </kbd>
        </div>

        <div ref={listRef} id="jump-to-results" role="listbox" aria-label="Results" className="max-h-[46vh] overflow-y-auto p-2">
          {loadingData && flat.length === 0 && (
            <p className="px-3 py-6 text-center text-[13px] text-[var(--text-muted)]">Loading workspace data…</p>
          )}
          {!loadingData && flat.length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="text-sm font-bold text-[var(--text-h)]">No matches</p>
              <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                Try a page name, project, task title, or teammate.
              </p>
            </div>
          )}
          {groups.map((group) => (
            <div key={group.kind} className="mb-1 last:mb-0">
              <p className="px-3 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {GROUP_TITLES[group.kind]}
              </p>
              {group.items.map((item) => {
                cursor += 1;
                const index = cursor;
                const isActive = index === activeIndex;
                const Icon =
                  item.kind === "page"
                    ? item.icon
                    : item.kind === "project"
                      ? FolderKanban
                      : item.kind === "task"
                        ? ListChecks
                        : Users;
                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    id={`jump-to-${item.kind}-${item.id}`}
                    role="option"
                    aria-selected={isActive}
                    data-active={isActive}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => choose(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                      isActive ? "bg-[var(--accent-bg)]" : "bg-transparent hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                      }`}
                    >
                      <Icon size={15} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--text-h)]">{item.label}</span>
                      <span className="block truncate text-xs text-[var(--text-muted)]">{item.hint}</span>
                    </span>
                    {isActive && <CornerDownLeft size={14} className="shrink-0 text-[var(--text-muted)]" aria-hidden />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="hidden items-center gap-4 border-t border-[var(--border)] px-4 py-2.5 text-[11px] text-[var(--text-muted)] sm:flex">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 font-semibold">↑↓</kbd> navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 font-semibold">↵</kbd> open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 font-semibold">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
