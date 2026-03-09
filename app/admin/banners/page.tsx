"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Site {
    id: number;
    name: string;
}

interface Banner {
    id: number;
    site_id: number;
    type: string;
    name: string | null;
    image_url: string;
    link_url: string | null;
    status: string;
    site?: Site;
}

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    // Form State
    const [siteId, setSiteId] = useState<number | "">("");
    const [type, setType] = useState("X");
    const [name, setName] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [imageUrl, setImageUrl] = useState(""); // This will hold the local preview URL
    const [pendingBase64, setPendingBase64] = useState("");
    const [pendingFileName, setPendingFileName] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [bRes, sRes] = await Promise.all([
                fetch("/api/banners"),
                fetch("/api/sites")
            ]);
            setBanners(await bRes.json());
            setSites(await sRes.json());
        } catch (err) {
            setError("Eroare la încărcarea datelor");
        } finally {
            setLoading(false);
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(",")[1];
                setPendingBase64(base64);
                setPendingFileName(file.name);

                // Upload locally just for preview
                const res = await fetch("/api/upload/local", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        image_base64: base64,
                        image_name: file.name
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    setImageUrl(data.path); // Admin local path for preview
                } else {
                    alert(`Eroare upload local: ${data.error}`);
                }
                setUploading(false);
            };
        } catch (err) {
            setUploading(false);
            alert("Eroare la procesarea fișierului");
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!siteId || (!imageUrl && !pendingBase64)) return alert("Completează site-ul și imaginea!");

        try {
            const res = await fetch("/api/banners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    site_id: siteId,
                    type,
                    name,
                    image_url: imageUrl, // Temporary, will be replaced by satellite path in backend
                    image_base64: pendingBase64,
                    image_name: pendingFileName,
                    link_url: linkUrl,
                    status: "active"
                })
            });

            if (res.ok) {
                setName("");
                setLinkUrl("");
                setImageUrl("");
                setPendingBase64("");
                setPendingFileName("");
                fetchData();
            } else {
                const data = await res.json();
                alert(`Eroare la salvare: ${data.error}`);
            }
        } catch (err) {
            alert("Eroare la salvare");
        }
    }

    async function deleteBanner(id: number) {
        if (!confirm("Sigur ștergi acest banner?")) return;
        try {
            const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
            if (res.ok) fetchData();
        } catch (err) {
            alert("Eroare la ștergere");
        }
    }

    if (loading) return <div style={{ padding: 40 }}>Se încarcă...</div>;

    return (
        <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Management Bannere (Ads)</h1>
                <p style={{ color: "var(--muted)" }}>Configurează reclamele pentru fiecare site satelit.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 32, alignItems: "start" }}>

                {/* FORM */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Adaugă Banner Nou</h2>
                    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Site Satelit</label>
                            <select value={siteId} onChange={e => setSiteId(Number(e.target.value))} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)" }} required>
                                <option value="">Alege site...</option>
                                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Tip Banner (Dimensiune)</label>
                            <select value={type} onChange={e => setType(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)" }}>
                                <option value="X">Axa X (Full Width x 200px)</option>
                                <option value="Y">Axa Y (400px x 400px)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Nume/Notă (Intern)</label>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="ex: Campanie Martie" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)" }} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Link URL (Destinație)</label>
                            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)" }} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Imagine</label>
                            {imageUrl && (
                                <div style={{
                                    width: "100%",
                                    height: type === 'X' ? 80 : 150,
                                    background: "#000",
                                    borderRadius: 12,
                                    marginBottom: 12,
                                    overflow: "hidden",
                                    border: "1px solid var(--border)"
                                }}>
                                    <img src={imageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                            )}
                            <div style={{ display: "flex", gap: 8 }}>
                                <input value={imageUrl} readOnly placeholder="Încarcă o imagine..." style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", fontSize: 11 }} />
                                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: "0 15px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
                                    {uploading ? "..." : "📁"}
                                </button>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} accept="image/*" />
                        </div>

                        <button type="submit" style={{ marginTop: 10, padding: 14, borderRadius: 10, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
                            {uploading ? "Se încarcă..." : "Salvează Banner"}
                        </button>
                    </form>
                </div>

                {/* LIST */}
                <div style={{ display: "grid", gap: 20 }}>
                    {banners.length === 0 && <div style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>Nu există bannere configurate.</div>}

                    {banners.map(b => {
                        // Fix image URL for admin display
                        let bImg = b.image_url;
                        if (bImg && bImg.startsWith("/") && !bImg.startsWith("/uploads/")) {
                            // If it's a satellite path (starts with /data or similar but not /uploads/)
                            // This assumes satellite images are served on port 3001 if local
                            // For a more robust solution, we'd need the site domain
                            const domain = "http://localhost:3001"; // Default fallback
                            bImg = `${domain}${bImg}`;
                        }

                        return (
                            <div key={b.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", display: "flex", gap: 20, padding: 16 }}>
                                <div style={{ width: 150, height: 100, background: "#000", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                                    <img src={bImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--accent)", letterSpacing: 1 }}>{b.type === "X" ? "AXA X (ORIZONTAL)" : "AXA Y (SQUARE)"}</span>
                                        <button onClick={() => deleteBanner(b.id)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 12 }}>Șterge</button>
                                    </div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{b.name || "Fără nume"}</h3>
                                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                                        Site: <strong style={{ color: "var(--fg)" }}>{b.site?.name}</strong> | Link: {b.link_url || "N/A"}
                                    </div>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <div style={{ fontSize: 10, background: "var(--surface2)", padding: "3px 8px", borderRadius: 4, color: "var(--green)" }}>{b.status.toUpperCase()}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}
