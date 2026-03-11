"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Article = { id: number; title: string; slug: string; status: string; language: string; created_at: string; published_at: string | null; category: { name: string | null; color: string | null } | null; author: { name: string | null } | null };

const STATUS_COLOR: Record<string, string> = { published: "#22c55e", draft: "#f59e0b", archived: "#64748b" };

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [sites, setSites] = useState<{ id: number; name: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function load(status = "", siteId: number | "" = "") {
    setLoading(true);
    try {
      const res = await fetch(`/api/articles?status=${status}&site_id=${siteId}&limit=50`);
      const data = await res.json();
      setArticles(data.articles ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setArticles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch("/api/sites");
        const data = await res.json();
        setSites(Array.isArray(data) ? data : []);
      } catch {
        setSites([]);
      }
    }
    fetchSites();
  }, []);

  useEffect(() => { load(filter, siteFilter); }, [filter, siteFilter]);

  async function deleteArticle(id: number) {
    if (!confirm("Ștergi articolul?")) return;
    setDeleting(id);
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    setArticles(prev => prev.filter(a => a.id !== id));
    setDeleting(null);
  }

  async function togglePublish(article: Article) {
    const newStatus = article.status === "published" ? "draft" : "published";
    await fetch(`/api/articles/${article.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    load(filter, siteFilter);
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>▤ Articole</h1>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{total} articole total</p>
        </div>
        <Link href="/admin/generate" style={{ textDecoration: "none" }}>
          <button style={{ padding: "9px 20px", background: "var(--accent)", color: "#000", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Articol Nou</button>
        </Link>
      </div>

      {/* Filter tabs & Site Select */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[["", "Toate"], ["draft", "Draft"], ["published", "Publicate"], ["archived", "Arhivate"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: "6px 16px", borderRadius: 8, fontSize: 12, border: "1px solid var(--border)",
              background: filter === v ? "var(--accent)" : "var(--surface2)", color: filter === v ? "#000" : "var(--muted)",
              fontWeight: filter === v ? 700 : 400, cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>

        <div>
          <select
            value={siteFilter}
            onChange={e => setSiteFilter(e.target.value ? Number(e.target.value) : "")}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              border: "1px solid var(--border)",
              background: "var(--surface2)",
              color: "var(--text)",
              width: "auto"
            }}
          >
            <option value="">Toți Sateliții</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--surface2)" }}>
              {["Titlu", "Categorie", "Autor", "Limbă", "Status", "Data", "Acțiuni"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, color: "var(--dim)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Se încarcă...</td></tr>
            ) : articles.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--dim)" }}>Niciun articol</td></tr>
            ) : articles.map(a => (
              <tr key={a.id} style={{ borderBottom: "1px solid var(--surface2)", transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                  <div style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--font-mono)" }}>/{a.slug}</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {a.category?.name ? (
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: `${a.category.color ?? "#6366f1"}22`, color: a.category.color ?? "#6366f1" }}>{a.category.name}</span>
                  ) : <span style={{ color: "var(--dim)", fontSize: 11 }}>—</span>}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--muted)" }}>{a.author?.name ?? "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--dim)", textTransform: "uppercase" }}>{a.language}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: `${STATUS_COLOR[a.status]}22`, color: STATUS_COLOR[a.status] }}>{a.status}</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--dim)" }}>
                  {new Date(a.created_at).toLocaleDateString("ro-RO")}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Link href={`/admin/articles/${a.id}/edit`} style={{ textDecoration: "none" }}>
                      <button style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, border: "1px solid var(--accent)", background: "var(--accent)", color: "#000", cursor: "pointer", fontWeight: 700 }}>Editează</button>
                    </Link>
                    <button onClick={() => togglePublish(a)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--muted)", cursor: "pointer" }}>
                      {a.status === "published" ? "Depublică" : "Publică"}
                    </button>
                    <button onClick={() => deleteArticle(a.id)} disabled={deleting === a.id} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "var(--red)", cursor: "pointer" }}>
                      {deleting === a.id ? "..." : "✕"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
