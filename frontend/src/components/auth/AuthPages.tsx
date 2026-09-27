import { useEffect } from "react";
import { useSaaSStore } from "../../store";
import { LayoutDashboard, FolderKanban, ListChecks, ShieldCheck } from "lucide-react";
import Login from "../../auth/login";
import Register from "../../auth/register";

function AuthSidePanel() {
  const highlights = [
    { icon: LayoutDashboard, title: "Live workspace overview", desc: "Projects, tasks and team health in one view." },
    { icon: FolderKanban, title: "Delivery without chaos", desc: "Track progress from planning to completed." },
    { icon: ListChecks, title: "Accountability by default", desc: "Owners, priorities and due dates on everything." },
    { icon: ShieldCheck, title: "Secure by design", desc: "Token sessions with instant revocation." },
  ];
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-10">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(600px 320px at 20% 8%, var(--accent-bg), transparent 65%), radial-gradient(520px 300px at 85% 90%, var(--accent-bg), transparent 60%), linear-gradient(180deg, var(--sidebar-bg), var(--main-bg))",
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-lg font-extrabold text-white shadow-[var(--shadow)]">
            S
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-bold tracking-tight text-[var(--text-h)]">SaaS Platform</p>
            <p className="text-xs text-[var(--text)]">Operations control center</p>
          </div>
        </div>
        <h2 className="mt-12 max-w-md text-3xl font-bold leading-[1.15] tracking-tight text-[var(--text-h)]">
          Run your entire delivery operation with calm confidence.
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--text)]">
          One workspace for projects, tasks, people and performance — designed for focus, built for scale.
        </p>
      </div>
      <ul className="relative mt-10 space-y-3">
        {highlights.map((h, i) => (
          <li
            key={h.title}
            className="anim-rise flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)]/70 p-3.5 backdrop-blur"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent)]">
              <h.icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold text-[var(--text-h)]">{h.title}</span>
              <span className="block text-[13px] text-[var(--text)]">{h.desc}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="relative mt-10 text-xs text-[var(--text-muted)]">Trusted by delivery teams · SOC2-ready practices · 99.9% uptime</p>
    </div>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--main-bg)]">
      <AuthSidePanel />
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="anim-scale w-full max-w-[440px]">
          <div className="card p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-base font-extrabold text-white">
                S
              </span>
              <span className="text-sm font-bold text-[var(--text-h)]">SaaS Platform</span>
            </div>
            {children}
          </div>
          <p className="mt-5 text-center text-xs text-[var(--text-muted)]">
            Protected by encrypted sessions · Your data stays yours
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthLayout() {
  const selectedAuthView = useSaaSStore((s) => s.authView);
  const isRegisterView = selectedAuthView === "register";
  return <AuthShell>{isRegisterView ? <Register /> : <Login />}</AuthShell>;
}

export function RegisterPage() {
  const setSelectedAuthView = useSaaSStore((s) => s.setAuthView);
  useEffect(() => {
    setSelectedAuthView("register");
  }, [setSelectedAuthView]);
  return (
    <AuthShell>
      <Register />
    </AuthShell>
  );
}

export function LoginPage() {
  const setSelectedAuthView = useSaaSStore((s) => s.setAuthView);
  useEffect(() => {
    setSelectedAuthView("login");
  }, [setSelectedAuthView]);
  return <AuthLayout />;
}
