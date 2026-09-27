import { useEffect, useRef, type ReactNode } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";

export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} className={`reveal ${className}`} style={{ ["--reveal-delay" as string]: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="anim-rise flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">{eyebrow}</p>
        )}
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-h)] sm:text-2xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--text)]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={`card ${hover ? "card-hover" : ""} ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3.5 sm:px-5">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold text-[var(--text-h)]">{title}</h3>
        {subtitle && <p className="mt-0.5 truncate text-xs text-[var(--text)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="anim-fade flex flex-col items-center px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]">
        {icon ?? <Inbox className="h-5 w-5" aria-hidden="true" />}
      </div>
      <p className="mt-4 text-sm font-bold text-[var(--text-h)]">{title}</p>
      {message && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-[var(--text)]">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ message = "Loading…", rows = 0 }: { message?: string; rows?: number }) {
  return (
    <div className="card anim-fade p-4 sm:p-5" role="status" aria-live="polite">
      <div className="flex items-center gap-2.5 text-sm font-medium text-[var(--text)]">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" aria-hidden="true" />
        {message}
      </div>
      {rows > 0 && (
        <div className="mt-4 space-y-2.5" aria-hidden="true">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="skeleton h-11" style={{ opacity: 1 - i * 0.12 }} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="card anim-fade border-[var(--auth-error-border)] p-4 sm:p-5" role="alert">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--auth-error-bg)] text-[var(--auth-error-text)]">
          <AlertCircle className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--text-h)]">Something went wrong</p>
          <p className="mt-0.5 text-[13px] text-[var(--text)]">{message ?? "Unable to load data. Please try again."}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn btn-secondary mt-3 !py-2 text-xs">
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="input !pl-9"
      />
    </div>
  );
}
