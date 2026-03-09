"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });

  useEffect(() => {
    fetch("/api/articles?limit=100")
      .then(r => r.json())
      .then(d => {
        const arts = d.articles ?? [];
        setStats({
          total: d.total,
          published: arts.filter((a: { status: string }) => a.status === "published").length,
          draft: arts.filter((a: { status: string }) => a.status === "draft").length,
        });
      }).catch(() => {});
  }, []);

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: -0.5 }}>Dashboard</h1>
        <p style={{ color: "var(--muted)", marginTop: 4, fontSize: 13 }}>Bun venit în panoul de administrare AI Blog.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Articole", value: stats.total, color: "#3b82f6" },
          { label: "Publicate", value: stats.published, color: "#22c55e" },
          { label: "Draft-uri", value: stats.draft, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 14, padding: "20px 24px" }}>
            <div style={{ fontSize: 11, color: "var(--dim)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {[
          { href: "/admin/generate", icon: "✦", title: "Generează Articol Nou", desc: "Pipeline AI în 5 etape cu aprobare manuală", color: "#f59e0b" },
          { href: "/admin/articles", icon: "▤", title: "Gestionează Articole", desc: "Editează, publică sau arhivează articole", color: "#3b82f6" },
          { href: "/admin/categories", icon: "◉", title: "Categorii", desc: "Adaugă și organizează categorii", color: "#22c55e" },
          { href: "/admin/authors", icon: "◎", title: "Autori", desc: "Gestionează autorii blogului", color: "#a855f7" },
        ].map(a => (
          <Link key={a.href} href={a.href} style={{ textDecoration: "none" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 14, padding: "20px 24px", display: "flex", gap: 16, alignItems: "flex-start", transition: "border-color 0.15s", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = a.color)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--surface2)")}>
              <div style={{ width: 38, height: 38, background: `${a.color}22`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: a.color, flexShrink: 0 }}>{a.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{a.title}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{a.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
