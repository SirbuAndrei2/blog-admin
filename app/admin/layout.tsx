"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "◈" },
  { href: "/admin/generate", label: "Generează Articol", icon: "✦" },
  { href: "/admin/articles", label: "Articole", icon: "▤" },
  { href: "/admin/categories", label: "Categorii", icon: "◉" },
  { href: "/admin/authors", label: "Autori", icon: "◎" },
  { href: "/admin/sites", label: "Sateliți", icon: "🌐" },
  { href: "/admin/banners", label: "Bannere", icon: "🖼️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: "#0a1122", borderRight: "1px solid #1e293b",
        display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100,
      }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, background: "#f59e0b", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✦</div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, letterSpacing: -0.3 }}>Blog Admin</div>
              <div style={{ fontSize: 10, color: "#475569" }}>AI Powered</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: "12px 10px", flex: 1 }}>
          {NAV.map(({ href, label, icon }) => {
            const active = path === href || (href !== "/admin" && path.startsWith(href));
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                borderRadius: 9, marginBottom: 2, textDecoration: "none",
                background: active ? "rgba(245,158,11,0.12)" : "transparent",
                color: active ? "#f59e0b" : "#64748b",
                fontWeight: active ? 600 : 400, fontSize: 13,
                borderLeft: active ? "2px solid #f59e0b" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 15 }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 18px", borderTop: "1px solid #1e293b" }}>
          <div style={{ fontSize: 10, color: "#334155", fontFamily: "var(--font-mono)" }}>gpt-4o</div>
        </div>
      </aside>

      {/* Content */}
      <main style={{ marginLeft: 220, flex: 1, minHeight: "100vh", background: "var(--bg)" }}>
        {children}
      </main>
    </div>
  );
}
