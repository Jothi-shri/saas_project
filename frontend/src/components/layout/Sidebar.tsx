import { NavLink, useNavigate } from "react-router-dom";
import { useSaaSStore } from "../../store";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  ChartNoAxesCombined,
  Bell,
  Settings,
  LogOut,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_SECTIONS: Array<{
  label: string;
  items: Array<{ to: string; label: string; icon: typeof LayoutDashboard; badge?: "notifications" }>;
}> = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/projects", label: "Projects", icon: FolderKanban },
      { to: "/tasks", label: "Tasks", icon: ListChecks },
    ],
  },
  {
    label: "Manage",
    items: [
      { to: "/team", label: "Team", icon: Users },
      { to: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const authenticatedUser = useSaaSStore((s) => s.user);
  const notifications = useSaaSStore((s) => s.notifications);
  const unread = notifications.filter((n) => !n.read).length;
  const logout = useSaaSStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `nav-item flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
      isActive
        ? "is-active bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] shadow-[inset_0_0_0_1px_var(--accent-border)]"
        : "text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text)]"
    } ${collapsed ? "justify-center px-2" : ""}`;

  const labelCls = "px-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--sidebar-text-muted)] opacity-70";
  const widthCls = collapsed ? "w-[76px]" : "w-[248px]";
  const overlay = mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0";

  return (
    <>
      {mobileOpen && (
        <div
          className="modal-overlay fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] transition-[width,transform,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${widthCls} ${overlay} lg:sticky lg:h-screen lg:shrink-0`}
        aria-label="Sidebar"
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-[var(--sidebar-border)] px-3">
          <div className={`flex min-w-0 items-center gap-2.5 ${collapsed ? "w-full justify-center" : ""}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[15px] font-extrabold tracking-tight text-white shadow-[0_4px_14px_-4px_var(--accent)]">
              S
            </span>
            {!collapsed && (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[14px] font-bold tracking-tight text-[var(--sidebar-text)]">
                  SaaS Platform
                </span>
                <span className="block text-[11px] font-medium text-[var(--sidebar-text-muted)]">Control center</span>
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--sidebar-text-muted)] transition hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] lg:inline-flex"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={onMobileClose}
            aria-label="Close sidebar"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--sidebar-text-muted)] transition hover:bg-[var(--sidebar-hover-bg)] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Primary">
          <div className="space-y-6">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                {!collapsed && <div className={`${labelCls} mb-2`}>{section.label}</div>}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink key={item.to} to={item.to} className={navLinkClasses} onClick={onMobileClose} title={collapsed ? item.label : undefined}>
                      <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && item.badge === "notifications" && unread > 0 && (
                        <span className="ml-auto rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                      {collapsed && item.badge === "notifications" && unread > 0 && (
                        <span className="absolute ml-6 mt-[-14px] h-2 w-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--sidebar-bg)]" />
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-[var(--sidebar-border)] p-2.5">
          {authenticatedUser && (
            <div
              className={`flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-2 transition hover:border-[var(--sidebar-border)] hover:bg-[var(--sidebar-hover-bg)] ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? `${authenticatedUser.name} — ${authenticatedUser.email}` : undefined}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-bold text-white">
                {authenticatedUser.name[0]?.toUpperCase()}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[13px] font-semibold text-[var(--sidebar-text)]">{authenticatedUser.name}</div>
                  <div className="truncate text-[11px] text-[var(--sidebar-text-muted)]">{authenticatedUser.email}</div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={`mt-1.5 flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] font-medium text-[var(--sidebar-text-muted)] transition hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${collapsed ? "justify-center px-2" : ""}`}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
