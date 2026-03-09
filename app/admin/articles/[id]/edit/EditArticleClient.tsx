"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Block } from "@/types";
import Link from "next/link";

interface Props {
    initialArticle: any; // We'll bypass strict typing here for the initial prop to keep it simple, but we can refine it.
}

function Btn({ children, onClick, disabled, variant = "primary", small }: any) {
    const bg: Record<string, string> = { primary: "var(--accent)", ghost: "var(--surface2)", success: "var(--green)", danger: "var(--red)" };
    const col: Record<string, string> = { primary: "#000", ghost: "var(--muted)", success: "#000", danger: "#fff" };
    return (
        <button onClick={onClick} disabled={disabled} style={{
            padding: small ? "5px 14px" : "9px 22px", borderRadius: 9, fontWeight: 700,
            fontSize: small ? 12 : 13, background: bg[variant], color: col[variant],
            border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
            display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.15s",
        }}>{children}</button>
    );
}

function Spinner({ size = 14 }: { size?: number }) {
    return <div className="animate-spin" style={{ width: size, height: size, border: "2px solid #33415566", borderTop: `2px solid var(--accent)`, borderRadius: "50%", flexShrink: 0 }} />;
}

export default function EditArticleClient({ initialArticle }: Props) {
    const router = useRouter();
    const [title, setTitle] = useState(initialArticle.title || "");
    const [slug, setSlug] = useState(initialArticle.slug || "");
    const [image, setImage] = useState(initialArticle.image || "");
    const [blocks, setBlocks] = useState<Block[]>(initialArticle.blocks || []);
    const [status, setStatus] = useState(initialArticle.status || "draft");
    const [categoryId, setCategoryId] = useState<number | "">(initialArticle.category_id || "");
    const [authorId, setAuthorId] = useState<number | "">(initialArticle.author_id || "");
    const [siteId, setSiteId] = useState<number | "">(initialArticle.site_id || "");
    const [language, setLanguage] = useState(initialArticle.language || "ro");

    const [meta, setMeta] = useState(initialArticle.meta || { meta_title: "", meta_description: "", meta_keywords: "" });

    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [authors, setAuthors] = useState<{ id: number; name: string }[]>([]);
    const [sites, setSites] = useState<{ id: number; name: string }[]>([]);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch("/api/categories").then(r => r.json()).then(setCategories).catch(() => { });
        fetch("/api/authors").then(r => r.json()).then(setAuthors).catch(() => { });
        fetch("/api/sites").then(r => r.json()).then(setSites).catch(() => { });
    }, []);

    async function saveArticle() {
        setSaving(true);
        setError("");

        try {
            // Basic block to HTML content generation (similar to generation page)
            const content = blocks.map(b =>
                b.type === "h2" ? `<h2>${b.data.h2}</h2>` :
                    b.type === "text_block" ? `<p>${b.data.content}</p>` :
                        b.type === "block_quotes" ? `<blockquote><p>${b.data.blocks}</p></blockquote>` :
                            (b.type as any) === "h3" ? `<h3>${(b.data as any).h3}</h3>` : ""
            ).join("");

            const res = await fetch(`/api/articles/${initialArticle.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title, slug, image, content, blocks, language, status,
                    category_id: categoryId ? Number(categoryId) : null,
                    author_id: authorId ? Number(authorId) : null,
                    site_id: siteId ? Number(siteId) : null,
                    meta
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            router.push("/admin/articles");
            router.refresh();
        } catch (e: any) {
            setError(e.message || "Eroare la salvare");
        } finally {
            setSaving(false);
        }
    }

    async function handleManualUpload(e: any) {
        const file = e.target.files?.[0];
        if (!file || !siteId) {
            if (!siteId) setError("Selectează un Site Satelit!");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(",")[1];
                const res = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        image_base64: base64,
                        image_name: file.name,
                        site_id: siteId
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    setImage(data.publicUrl);
                } else {
                    setError(`Eroare Upload: ${data.error}`);
                }
                setUploading(false);
            };
        } catch (err) {
            setError("Eroare la procesarea fișierului");
            setUploading(false);
        }
    }

    return (
        <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>

            {/* LEFT SIDE: EDITOR */}
            <div>
                <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <Link href="/admin/articles" style={{ color: "var(--muted)", textDecoration: "none", fontSize: 13, marginBottom: 8, display: "inline-block" }}>← Înapoi la articole</Link>
                        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>Editează Articolul</h1>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                        <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}>
                            <option value="draft">Draft</option>
                            <option value="published">Publicat</option>
                        </select>
                        <Btn variant="success" onClick={saveArticle} disabled={saving}>
                            {saving ? <><Spinner /> Salvez...</> : "✓ Salvează Modificările"}
                        </Btn>
                    </div>
                </div>

                {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 9, padding: "9px 14px", color: "var(--red)", fontSize: 13, marginBottom: 20 }}>⚠ {error}</div>}

                <div style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 16, padding: "24px", marginBottom: 24 }}>
                    {/* Metadata Fields */}
                    <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Titlu</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 14 }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Slug</label>
                            <input value={slug} onChange={e => setSlug(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 14, fontFamily: "var(--font-mono)" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Imagine (URL / Path Local)</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <input value={image} onChange={e => setImage(e.target.value)} style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 14 }} />
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ padding: "0 15px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", cursor: "pointer", fontSize: 12 }}>
                                    {uploading ? "..." : "📁 Încarcă"}
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleManualUpload} style={{ display: "none" }} accept="image/*" />
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Categorie</label>
                                <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value) || "")} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}>
                                    <option value="">Fără categorie</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Autor</label>
                                <select value={authorId} onChange={e => setAuthorId(Number(e.target.value) || "")} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}>
                                    <option value="">Fără autor</option>
                                    {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Site (Satelit)</label>
                                <select value={siteId} onChange={e => setSiteId(Number(e.target.value) || "")} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}>
                                    <option value="">Blog-ul principal</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Meta SEO */}
                    <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "20px", marginBottom: 24, border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--blue)", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Detalii SEO & Meta</div>
                        <div style={{ display: "grid", gap: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Page Title (H1 Browser)</label>
                                <input placeholder="Titlu pagină" value={meta.page_title || ""} onChange={e => setMeta({ ...meta, page_title: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13 }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Meta Title (SEO)</label>
                                <input placeholder="Meta Title" value={meta.meta_title || ""} onChange={e => setMeta({ ...meta, meta_title: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13 }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Meta Description</label>
                                <textarea placeholder="Meta Description" value={meta.meta_description || ""} onChange={e => setMeta({ ...meta, meta_description: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13, minHeight: 80, resize: "vertical" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Meta Keywords (separate prin virgulă)</label>
                                <input placeholder="Meta Keywords" value={meta.meta_keywords || ""} onChange={e => setMeta({ ...meta, meta_keywords: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13 }} />
                            </div>
                        </div>
                    </div>


                    {/* Blocks Editor */}
                    <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800 }}>Conținut (Blocks)</h3>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{blocks.length} elemente</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {blocks.map((block, i) => (
                            <div key={i} style={{ background: block.type === "h2" ? "#1a2235" : block.type === "block_quotes" ? "#0a1628" : "var(--surface2)", borderRadius: 12, padding: "16px", border: block.type === "text_block" ? "1px solid var(--border)" : "none", borderLeft: block.type === "h2" ? "3px solid var(--accent)" : block.type === "block_quotes" ? "3px solid var(--green)" : "none" }}>

                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, color: block.type === "h2" ? "var(--accent)" : block.type === "block_quotes" ? "var(--green)" : "var(--dim)", letterSpacing: 1 }}>
                                        {block.type.toUpperCase()}
                                    </span>
                                    <button onClick={() => setBlocks(blocks.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "var(--red)", fontSize: 12, cursor: "pointer", opacity: 0.7 }}>Șterge</button>
                                </div>

                                {block.type === "h2" && (
                                    <input value={block.data.h2} onChange={e => { const newB = [...blocks]; newB[i] = { ...block, data: { ...block.data, h2: e.target.value } }; setBlocks(newB); }} style={{ width: "100%", background: "transparent", border: "none", color: "#fff", fontWeight: 700, fontSize: 15 }} />
                                )}
                                {block.type === "text_block" && (
                                    <textarea value={block.data.content} onChange={e => { const newB = [...blocks]; newB[i] = { ...block, data: { ...block.data, content: e.target.value } }; setBlocks(newB); }} style={{ width: "100%", background: "transparent", border: "none", minHeight: 120, fontSize: 13, lineHeight: 1.6, resize: "vertical" }} />
                                )}
                                {block.type === "block_quotes" && (
                                    <textarea value={block.data.blocks} onChange={e => { const newB = [...blocks]; newB[i] = { ...block, data: { ...block.data, blocks: e.target.value } }; setBlocks(newB); }} style={{ width: "100%", background: "transparent", border: "none", minHeight: 80, fontStyle: "italic", fontSize: 13, color: "var(--muted)", resize: "vertical" }} />
                                )}
                                {(block.type as any) === "h3" && (
                                    <input value={(block.data as any).h3} onChange={e => { const newB = [...blocks]; newB[i] = { ...block, data: { ...(block.data as any), h3: e.target.value } }; setBlocks(newB); }} style={{ width: "100%", background: "transparent", border: "none", color: "#fff", fontWeight: 600, fontSize: 14 }} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                        <Btn variant="ghost" small onClick={() => setBlocks([...blocks, { type: "h2", data: { h2: "Subtitlu Nou", short_paragraph: null } }])}>+ Adaugă H2</Btn>
                        <Btn variant="ghost" small onClick={() => setBlocks([...blocks, { type: "h3", data: { h3: "Subtitlu secundar (H3)" } } as any])}>+ Adaugă H3</Btn>
                        <Btn variant="ghost" small onClick={() => setBlocks([...blocks, { type: "text_block", data: { content: "Text nou..." } }])}>+ Adaugă Text</Btn>
                        <Btn variant="ghost" small onClick={() => setBlocks([...blocks, { type: "block_quotes", data: { blocks: "Citat nou...", title: "", source: null, source_link: null } }])}>+ Adaugă Citat</Btn>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: LIVE PREVIEW */}
            <div style={{ position: "sticky", top: 24, height: "max-content", maxHeight: "calc(100vh - 48px)", overflowY: "auto", background: "#fff", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "#fafafa", position: "sticky", top: 0, zIndex: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--dim)", letterSpacing: 1 }}>LIVE PREVIEW (TEMA BLOG)</span>
                </div>

                <div style={{ padding: "32px", fontFamily: "'Inter', sans-serif", color: "#111" }}>
                    <style>{`
            .preview-prose p { margin-bottom: 1.4em; line-height: 1.85; color: #374151; font-family: 'Lora', serif; font-size: 17px; }
            .preview-prose h2 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 24px; margin: 2em 0 0.6em; color: #111; letter-spacing: -0.3px; }
            .preview-prose blockquote { border-left: 3px solid #f59e0b; padding: 12px 20px; margin: 28px 0; background: #fffbeb; border-radius: 0 8px 8px 0; font-style: italic; color: #78350f; font-family: 'Lora', serif; font-size: 16px; line-height: 1.7; }
          `}</style>

                    <div style={{ maxWidth: 680, margin: "0 auto" }}>
                        {image && (
                            <img src={image} alt={title} style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 16, marginBottom: 32 }} />
                        )}

                        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 38, lineHeight: 1.2, letterSpacing: -1, marginBottom: 32, color: "#111" }}>
                            {title || "Titlu Articol"}
                        </h1>

                        <div className="preview-prose">
                            {blocks.length === 0 && <p style={{ color: "#9ca3af", fontStyle: "italic" }}>Aici va apărea conținutul articolului...</p>}
                            {blocks.map((block, i) => {
                                if (block.type === "h2") return <h2 key={i}>{block.data.h2}</h2>;
                                if ((block.type as any) === "h3") return <h3 key={i} style={{ fontSize: 20, fontWeight: 700, margin: '1.5em 0 0.5em', color: '#333' }}>{(block.data as any).h3}</h3>;
                                if (block.type === "text_block") return <p key={i} dangerouslySetInnerHTML={{ __html: block.data.content }} />;
                                if (block.type === "block_quotes") return <blockquote key={i}>{block.data.blocks}</blockquote>;
                                return null;
                            })}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
