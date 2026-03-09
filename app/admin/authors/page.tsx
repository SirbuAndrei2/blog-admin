"use client";
import { useEffect, useState } from "react";

type Author = { id: number; name: string; bio: string | null; image: string | null };

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/authors").then(r => r.json()).then(setAuthors).catch(() => {});
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/authors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, bio: bio || null, image: image || null }) });
    setName(""); setBio(""); setImage(""); load(); setSaving(false);
  }

  async function remove(id: number) {
    if (!confirm("Ștergi autorul?")) return;
    await fetch(`/api/authors/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24 }}>◎ Autori</h1>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{authors.length} autori</p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Adaugă Autor</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nume autor *" />
          <input value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio scurtă (opțional)" />
          <input value={image} onChange={e => setImage(e.target.value)} placeholder="URL imagine profil (opțional)" />
          <div>
            <button onClick={create} disabled={saving || !name.trim()} style={{ padding: "9px 20px", background: "var(--accent)", color: "#000", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1 }}>
              {saving ? "..." : "+ Adaugă Autor"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {authors.map(a => (
          <div key={a.id} style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: a.image ? `url(${a.image}) center/cover` : "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
              {!a.image && a.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
              {a.bio && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{a.bio}</div>}
            </div>
            <button onClick={() => remove(a.id)} style={{ padding: "4px 12px", borderRadius: 7, fontSize: 12, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "var(--red)", cursor: "pointer" }}>Șterge</button>
          </div>
        ))}
        {authors.length === 0 && <div style={{ color: "var(--dim)", fontSize: 13, textAlign: "center", padding: 32 }}>Niciun autor adăugat</div>}
      </div>
    </div>
  );
}
