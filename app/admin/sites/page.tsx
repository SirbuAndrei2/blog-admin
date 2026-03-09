"use client";
import { useEffect, useState } from "react";

type Site = { id: number; name: string; domain: string; api_key: string; ai_persona?: string; created_at: string };

function Btn({ children, onClick, disabled, variant = "primary" }: any) {
    const bg: Record<string, string> = { primary: "var(--accent)", danger: "var(--red)" };
    const col: Record<string, string> = { primary: "#000", danger: "#fff" };
    return (
        <button onClick={onClick} disabled={disabled} style={{
            padding: "9px 18px", borderRadius: 8, fontWeight: 700,
            fontSize: 13, background: bg[variant], color: col[variant],
            border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        }}>{children}</button>
    );
}

export default function SitesPage() {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState("");
    const [domain, setDomain] = useState("");
    const [aiPersona, setAiPersona] = useState("");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editPersona, setEditPersona] = useState("");
    const [updating, setUpdating] = useState(false);

    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        try {
            const res = await fetch("/api/sites");
            const data = await res.json();
            setSites(data);
        } catch { /* ignore */ }
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function addSite(e: React.FormEvent) {
        e.preventDefault();
        setAdding(true); setError("");

        try {
            const res = await fetch("/api/sites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, domain, ai_persona: aiPersona }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Eroare la adăugare");

            setName(""); setDomain(""); setAiPersona("");
            setSites([data, ...sites]);
        } catch (e: any) {
            setError(e.message);
        }
        setAdding(false);
    }

    async function updatePersona(id: number) {
        setUpdating(true);
        try {
            const res = await fetch(`/api/sites/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ai_persona: editPersona }),
            });
            const data = await res.json();
            if (res.ok) {
                setSites(sites.map(s => s.id === id ? data : s));
                setEditingId(null);
            }
        } catch { alert("Eroare la actualizare"); }
        setUpdating(false);
    }

    async function deleteSite(id: number) {
        if (!confirm("Ești sigur(ă) că ștergi acest site? Atenție, pot exista articole legate de el (vor rămâne marcate null).")) return;
        try {
            await fetch(`/api/sites/${id}`, { method: "DELETE" });
            setSites(sites.filter(s => s.id !== id));
        } catch { alert("Eroare la ștergere"); }
    }

    async function copyKey(key: string) {
        await navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    }

    return (
        <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>🌐 Sateliți (Multi-Site)</h1>
                <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Generează chei API pentru site-urile conectate la acest panou.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }}>

                {/* Sites List */}
                <div>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 14, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--surface2)" }}>
                                    {["Nume Site", "Domeniu", "API Key", "Persona", "Acțiuni"].map(h => (
                                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "var(--dim)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Se încarcă...</td></tr>
                                ) : sites.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: "var(--dim)" }}>Niciun site adăugat.</td></tr>
                                ) : sites.map((s: Site) => (
                                    <tr key={s.id} style={{ borderBottom: "1px solid var(--surface2)" }}>
                                        <td style={{ padding: "16px", fontWeight: 700, fontSize: 14 }}>{s.name}</td>
                                        <td style={{ padding: "16px", color: "var(--muted)", fontSize: 13 }}>{s.domain}</td>
                                        <td style={{ padding: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", padding: "6px 10px", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", width: "max-content" }}>
                                                <span style={{ filter: copiedKey === s.api_key ? "none" : "blur(3px)", transition: "all 0.2s", userSelect: "all" }}>{s.api_key}</span>
                                                <button onClick={() => copyKey(s.api_key)} style={{ cursor: "pointer", border: "none", background: "none", fontSize: 13 }} title="Copy">
                                                    {copiedKey === s.api_key ? "✅" : "📋"}
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            {editingId === s.id ? (
                                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                    <textarea value={editPersona} onChange={e => setEditPersona(e.target.value)} style={{ fontSize: 11, minHeight: 80, width: 250 }} />
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button onClick={() => updatePersona(s.id)} disabled={updating} style={{ background: "var(--green)", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 10, cursor: "pointer" }}>Save</button>
                                                        <button onClick={() => setEditingId(null)} style={{ background: "var(--surface2)", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 10, cursor: "pointer", color: "var(--muted)" }}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <div style={{ fontSize: 11, color: "var(--dim)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {s.ai_persona ? s.ai_persona.substring(0, 40) + "..." : "Default (Igor)"}
                                                    </div>
                                                    <button onClick={() => { setEditingId(s.id); setEditPersona(s.ai_persona || ""); }} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "var(--muted)", cursor: "pointer" }}>Edit Persona</button>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <button onClick={() => deleteSite(s.id)} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "var(--red)", cursor: "pointer", fontWeight: 700 }}>Șterge</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Form */}
                <div>
                    <form onSubmit={addSite} style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 14, padding: "24px", position: "sticky", top: 24 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, marginBottom: 16 }}>+ Adaugă Site Nou</div>

                        {error && <div style={{ background: "rgba(239,68,68,0.1)", color: "var(--red)", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 16 }}>⚠ {error}</div>}

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>NUME INTERN (ex: Magazin Pantofi)</label>
                            <input required value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13 }} />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>DOMENIU (ex: site-meu.ro)</label>
                            <input required value={domain} onChange={e => setDomain(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13 }} />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>DEFAULT AI PERSONA (opțional)</label>
                            <textarea value={aiPersona} onChange={e => setAiPersona(e.target.value)} placeholder="Instrucțiuni specifice pentru acest site..." style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 12, minHeight: 100 }} />
                        </div>

                        <Btn disabled={adding || !name || !domain} variant="primary" style={{ width: "100%" }}>
                            {adding ? "Adăugare..." : "Generează Site & API Key"}
                        </Btn>
                    </form>
                </div>

            </div>
        </div>
    );
}
