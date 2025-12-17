// components/dashboard/Sidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  BookOpen,
  Users,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavChild = { href: string; label: string };
type NavItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;            // optional for sections that act only as parents
  children?: NavChild[];    // submenu entries
};

export function Sidebar() {
  const pathname = usePathname();

  // --- collapsed state (existing) ---
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("vam.sidebar.collapsed") === "1"; } catch { return false; }
  });
  React.useEffect(() => {
    try { localStorage.setItem("vam.sidebar.collapsed", collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  // --- expanded parent sections (new) ---
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("vam.sidebar.expanded") || "{}");
    } catch {
      return {};
    }
  });
  React.useEffect(() => {
    try { localStorage.setItem("vam.sidebar.expanded", JSON.stringify(expanded)); } catch {}
  }, [expanded]);

  const nav: NavItem[] = [
    { key: "overview", href: "/dashboard", label: "Overview", icon: LayoutDashboard },

    { key: "courses", href: "/dashboard/courses", label: "Courses", icon: BookOpen },
    {
      key: "teachers",
      label: "Teachers",
      icon: Users,
      children: [
        { href: "/dashboard/teachers", label: "Directory" },
        { href: "/dashboard/sessions", label: "Sessions" },
      ],
    },
    {
      key: "students",
      label: "Students",
      icon: GraduationCap,
      children: [
        { href: "/dashboard/students", label: "Directory" },
        { href: "/dashboard/attendance", label: "Attendance" },
      ],
    },

    { key: "settings", href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  // Determine which parent is active (matches any child or parent href)
  const isItemActive = (item: NavItem) => {
    if (item.children?.length) {
      return item.children.some((c) => pathname.startsWith(c.href));
    }
    return item.href ? pathname === item.href : false;
  };

  // Auto-expand active parent on mount (non-collapsed mode)
  React.useEffect(() => {
    const next: Record<string, boolean> = { ...expanded };
    nav.forEach((item) => {
      if (item.children?.length) {
        if (isItemActive(item)) next[item.key] = true;
      }
    });
    setExpanded(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  const toggle = (key: string) => {
    setExpanded((e) => ({ ...e, [key]: !e[key] }));
  };

  return (
    <aside
      className={cn(
        "h-full border-r bg-white/90 backdrop-blur px-2 py-3 transition-all",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      <div className={cn("flex items-center justify-between", collapsed ? "px-0" : "px-1")}>
        <Link href="/dashboard" className="block select-none" title="VIRAL AD MEDIA">
          <div
            className={cn(
              "font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent",
              collapsed ? "text-sm" : "text-base sm:text-lg"
            )}
          >
            VAM-ATTENDACE
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "ml-2 inline-flex items-center justify-center rounded-md border px-1.5 py-1 text-slate-600 hover:bg-slate-50",
            "w-8 h-8"
          )}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className={cn("mt-3", collapsed ? "px-0" : "px-1")}>
        <ul className="space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            // Simple leaf link
            if (!item.children?.length) {
              return (
                <li key={item.key}>
                  <Link
                    href={item.href || "#"}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition",
                      active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                    )}
                    title={item.label}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-500")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            }

            // Parent with submenu
            const open = !!expanded[item.key];

            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => toggle(item.key)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition",
                    active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  )}
                  title={item.label}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-500")} />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          open ? "rotate-0" : "-rotate-90",
                          active ? "text-white" : "text-slate-500"
                        )}
                      />
                    </>
                  )}
                </button>

                {/* Submenu */}
                {!collapsed && open && (
                  <ul className="mt-0.5 ml-8 space-y-0.5">
                    {item.children.map((c) => {
                      const childActive = pathname === c.href || pathname.startsWith(c.href + "/");
                      return (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition",
                              childActive
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                            )}
                            title={c.label}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", childActive ? "bg-white" : "bg-slate-400")} />
                            <span className="truncate">{c.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cn("mt-auto pt-3 text-[11px] text-slate-500", collapsed ? "px-0 text-center" : "px-1")}>
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <span>v1.0</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-700">Live</span>
          </div>
        ) : (
          <span title="Live v1.0">v1.0</span>
        )}
      </div>
    </aside>
  );
}
