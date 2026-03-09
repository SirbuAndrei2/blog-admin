"use client";
import { useEffect, useState } from "react";

type Category = { id: number; name: string; slug: string; color: string };
const COLORS = ["#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#06b6d4", "#f97316", "#ec4899"];

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/categories").then(r => r.json()).then(setCats).catch(() => {});
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, color }) });
    setName(""); load(); setSaving(false);
  }

  async function remove(id: number) {
    if (!confirm("Ștergi categoria?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24 }}>◉ Categorii</h1>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{cats.length} categorii</p>
      </div>

      {/* Add form */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Adaugă Categorie</div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && create()} placeholder="Nume categorie" />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--dim)", marginBottom: 5 }}>Culoare</div>
            <div style={{ display: "flex", gap: 4 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? "2px solid #fff" : "2px solid transparent", transition: "all 0.15s" }} />
              ))}
            </div>
          </div>
          <button onClick={create} disabled={saving || !name.trim()} style={{ padding: "9px 20px", background: "var(--accent)", color: "#000", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1 }}>
            {saving ? "..." : "+ Adaugă"}
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cats.map(c => (
          <div key={c.id} style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--font-mono)" }}>/{c.slug}</div>
            </div>
            <button onClick={() => remove(c.id)} style={{ padding: "4px 12px", borderRadius: 7, fontSize: 12, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "var(--red)", cursor: "pointer" }}>Șterge</button>
          </div>
        ))}
        {cats.length === 0 && <div style={{ color: "var(--dim)", fontSize: 13, textAlign: "center", padding: 32 }}>Nicio categorie adăugată</div>}
      </div>
    </div>
  );
}
