"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Block, Outline, ReviewResult, GenerateOptions } from "@/types";

const TONES = ["Profesional", "Casual", "Tehnic", "Inspirațional", "Educativ", "Jurnalistic"];
const LENGTHS = [{ label: "Scurt ~400", value: "short" }, { label: "Mediu ~800", value: "medium" }, { label: "Lung ~1500", value: "long" }];
const STEPS = ["Configurare", "Outline", "Generare", "Review", "Publică"];

type Log = { msg: string; color: string; id: number };
type ImageData = { localPath: string; publicUrl: string; unsplashUrl: string; localAdminPath?: string };

function Tag({ val, current, onClick }: { val: string; current: string; onClick: () => void }) {
  const active = val === current;
  return (
    <button onClick={onClick} style={{
      padding: "5px 13px", borderRadius: 7, fontSize: 12, border: active ? "none" : "1px solid var(--border)",
      background: active ? "var(--accent)" : "var(--surface2)", color: active ? "#000" : "var(--muted)",
      fontWeight: active ? 700 : 400, cursor: "pointer", transition: "all 0.15s",
    }}>{val}</button>
  );
}

function Btn({ children, onClick, disabled, variant = "primary", small }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: string; small?: boolean;
}) {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 10, color: "var(--muted)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="animate-fadein" style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 16, padding: "26px 30px", ...style }}>{children}</div>;
}

function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{label}</div>}
      <div style={{ background: "var(--surface2)", borderRadius: 999, height: 5, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: "linear-gradient(90deg,var(--accent),var(--red))", transition: "width 0.5s", borderRadius: 999 }} />
      </div>
    </div>
  );
}

function BlockEditor({ block, index, articleTitle, opts, onChange }: {
  block: Block; index: number; articleTitle: string; opts: GenerateOptions; onChange: (b: Block) => void;
}) {
  const [open, setOpen] = useState(true);
  const [regen, setRegen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  if (block.type === "h2") return (
    <div style={{ background: "#1a2235", borderRadius: 10, padding: "11px 16px", marginBottom: 8, borderLeft: "3px solid var(--accent)" }}>
      <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, letterSpacing: 1 }}>H2 </span>
      <input value={block.data.h2} onChange={e => onChange({ ...block, data: { ...block.data, h2: e.target.value } })}
        style={{ background: "transparent", border: "none", color: "var(--text)", fontWeight: 700, fontSize: 14, width: "calc(100% - 40px)", padding: 0, boxShadow: "none" }} />
    </div>
  );

  if (block.type === "text_block") {
    const wordCount = block.data.content.split(" ").length;
    return (
      <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 16px", marginBottom: 8, border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? 10 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, letterSpacing: 1 }}>TEXT #{index}</span>
            <span style={{ fontSize: 10, color: "var(--dim)" }}>{wordCount} cuvinte</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Btn small variant="ghost" onClick={() => setShowFeedback(!showFeedback)}>✏ Feedback</Btn>
            <Btn small variant="ghost" onClick={async () => {
              setRegen(true);
              const res = await fetch("/api/generate/regenerate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionTitle: articleTitle, articleTitle, opts, feedback: feedback || undefined }) });
              const data = await res.json();
              if (data.block) onChange(data.block);
              setRegen(false); setShowFeedback(false); setFeedback("");
            }} disabled={regen}>{regen ? <Spinner /> : "🔄 Regen"}</Btn>
            <button onClick={() => setOpen(v => !v)} style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", fontSize: 11 }}>{open ? "▲" : "▼"}</button>
          </div>
        </div>
        {showFeedback && (
          <div style={{ marginBottom: 10 }}>
            <input value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="ex: mai mult detalii tehnice, ton mai formal..." style={{ fontSize: 12 }} />
          </div>
        )}
        {open && (
          <textarea value={block.data.content} onChange={e => onChange({ ...block, data: { content: e.target.value } })}
            style={{ fontSize: 12, lineHeight: 1.75, minHeight: 100, resize: "vertical", borderColor: "transparent", background: "transparent" }} />
        )}
      </div>
    );
  }

  if (block.type === "block_quotes") return (
    <div style={{ background: "#0a1628", borderRadius: 10, padding: "12px 16px", marginBottom: 8, borderLeft: "3px solid var(--green)" }}>
      <div style={{ fontSize: 10, color: "var(--green)", fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>CONCLUZIE</div>
      <textarea value={block.data.blocks} onChange={e => onChange({ ...block, data: { ...block.data, blocks: e.target.value } })}
        style={{ fontSize: 12, fontStyle: "italic", lineHeight: 1.75, minHeight: 60, resize: "vertical", background: "transparent", borderColor: "transparent" }} />
    </div>
  );

  if ((block.type as string) === "h3") return (
    <div style={{ background: "#1a2235", borderRadius: 10, padding: "8px 16px", marginBottom: 8, borderLeft: "2px solid var(--blue)" }}>
      <span style={{ fontSize: 10, color: "var(--blue)", fontWeight: 700, letterSpacing: 1 }}>H3 </span>
      <input value={(block.data as any).h3} onChange={e => onChange({ ...block, data: { ...(block.data as any), h3: e.target.value } })}
        style={{ background: "transparent", border: "none", color: "var(--text)", fontWeight: 600, fontSize: 13, width: "calc(100% - 40px)", padding: 0, boxShadow: "none" }} />
    </div>
  );

  return null;
}

export default function GeneratePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [opts, setOpts] = useState<GenerateOptions>({ topic: "", tone: "Profesional", length: "medium", language: "ro", ai_persona: "" });
  const [categories, setCategories] = useState<{ id: number; name: string; color: string }[]>([]);
  const [authors, setAuthors] = useState<{ id: number; name: string }[]>([]);
  const [sites, setSites] = useState<{ id: number; name: string; ai_persona?: string }[]>([]);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [meta, setMeta] = useState<Record<string, string> | null>(null);
  const [image, setImage] = useState<ImageData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [preview, setPreview] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Fetch site default persona when site_id changes
  useEffect(() => {
    if (opts.site_id) {
      const site = sites.find(s => s.id === opts.site_id);
      if (site) {
        setOpts(prev => ({ ...prev, ai_persona: site.ai_persona || prev.ai_persona || "" }));
      }
    }
  }, [opts.site_id, sites]);

  const addLog = (msg: string, color = "var(--muted)") =>
    setLogs(p => [...p, { msg, color, id: Date.now() + Math.random() }]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);
  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories).catch(() => { });
    fetch("/api/authors").then(r => r.json()).then(setAuthors).catch(() => { });
    fetch("/api/sites").then(r => r.json()).then(setSites).catch(() => { });
  }, []);

  // Refresh image from Unsplash
  async function refreshImage(topic: string, slug: string) {
    if (!opts.site_id) {
      addLog("⚠ Eroare: Trebuie să selectezi un Site Satelit mai întâi!", "var(--red)");
      return;
    }

    setImageLoading(true);
    addLog("→ Descărcare și transfer imagine spre Satelit...", "var(--accent)");
    try {
      const res = await fetch("/api/images/unsplash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, slug, site_id: opts.site_id })
      });
      const data = await res.json();
      if (res.ok) { setImage(data); addLog(`✓ Imagine salvată nativ: ${data.localPath}`, "var(--green)"); }
      else addLog(`⚠ Imagine: ${data.error}`, "var(--accent)");
    } catch { addLog("⚠ Nu s-a putut descărca imaginea", "var(--accent)"); }
    setImageLoading(false);
  }

  async function handleManualUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !opts.site_id) {
      if (!opts.site_id) addLog("⚠ Eroare: Selectează un Site Satelit!", "var(--red)");
      return;
    }

    setImageLoading(true);
    addLog(`→ Încărcare manuală: ${file.name}...`, "var(--accent)");

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
            site_id: opts.site_id
          })
        });
        const data = await res.json();
        if (res.ok) {
          setImage(data);
          addLog(`✓ Imagine încărcată: ${data.publicUrl}`, "var(--green)");
        } else {
          addLog(`⚠ Eroare Upload: ${data.error}`, "var(--red)");
        }
        setImageLoading(false);
      };
    } catch (err) {
      addLog("⚠ Eroare la procesarea fișierului", "var(--red)");
      setImageLoading(false);
    }
  }

  async function doGenerateOutline() {
    if (!opts.topic.trim()) return setError("Introdu un topic!");
    if (!opts.site_id) return setError("Trebuie să selectezi un Site Satelit!");

    setError(""); setLoading(true); setLoadingMsg("Generez outline...");
    addLog("→ Etapa 1: Outline + Meta SEO + Imagine...", "var(--accent)");
    try {
      const res = await fetch("/api/generate/outline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(opts) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOutline(data.outline);
      setMeta(data.meta);
      if (data.image) { setImage(data.image); addLog(`✓ Imagine salvată nativ: ${data.image.publicUrl}`, "var(--green)"); }
      else addLog("⚠ Imaginea nu a putut fi descărcată", "var(--accent)");
      addLog(`✓ Titlu: "${data.outline.title}"`, "var(--green)");
      addLog(`  • ${data.outline.h2_sections?.length} secțiuni H2`, "var(--dim)");
      addLog("✓ Meta SEO generat", "var(--green)");
      setStep(1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Eroare";
      setError(msg); addLog(`✗ ${msg}`, "var(--red)");
    }
    setLoading(false); setLoadingMsg("");
  }

  async function doGenerateBlocks() {
    setError(""); setLoading(true); setBlocks([]); setProgress(0);
    addLog("→ Etapa 3: Generare blocks (SSE stream)...", "var(--accent)");
    try {
      const res = await fetch("/api/generate/blocks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outline, opts }) });
      if (!res.ok) throw new Error("Eroare server");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const evt = JSON.parse(line.slice(6));
          if (evt.type === "progress") { setLoadingMsg(evt.msg); setProgress(evt.pct); addLog(`  ${evt.msg}`, "var(--dim)"); }
          if (evt.type === "done") { setBlocks(evt.blocks); setReview(evt.review); addLog(`✓ ${evt.blocks.length} blocks generate`, "var(--green)"); addLog(`✓ Review: ${evt.review.score}/100`, evt.review.score >= 70 ? "var(--green)" : "var(--accent)"); setStep(3); }
          if (evt.type === "error") throw new Error(evt.msg);
        }
      }
      if (step !== 3) setStep(3);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Eroare";
      setError(msg); addLog(`✗ ${msg}`, "var(--red)");
    }
    setLoading(false); setLoadingMsg("");
  }

  async function saveArticle(status: "draft" | "published") {
    setSaving(true);
    addLog(`→ Salvare ca ${status}...`, "var(--accent)");
    try {
      const content = blocks.map(b =>
        b.type === "h2" ? `<h2>${b.data.h2}</h2>` :
          b.type === "text_block" ? `<p>${b.data.content}</p>` :
            b.type === "block_quotes" ? `<blockquote><p>${b.data.blocks}</p></blockquote>` :
              (b.type as string) === "h3" ? `<h3>${(b.data as any).h3}</h3>` : ""
      ).join("");
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: outline!.title,
          slug: outline!.slug,
          topic: opts.topic,
          backlinks: opts.backlinks || null,
          image: image?.publicUrl ?? null,   // ← Store full Satellite URL
          content, blocks,
          language: opts.language, status,
          category_id: opts.category_id,
          author_id: opts.author_id,
          site_id: opts.site_id,
          meta,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addLog(`✓ Articol salvat (ID: ${data.id})`, "var(--green)");
      addLog(`  Imagine: ${image?.localPath ?? "fără imagine"}`, "var(--dim)");
      setStep(4);
      setTimeout(() => router.push("/admin/articles"), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Eroare";
      setError(msg); addLog(`✗ ${msg}`, "var(--red)");
    }
    setSaving(false);
  }

  const sc = review?.score ?? 0;
  const scoreColor = sc >= 80 ? "var(--green)" : sc >= 60 ? "var(--accent)" : "var(--red)";

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>✦ Generează Articol</h1>
          <p style={{ color: "var(--muted)", marginTop: 3, fontSize: 12 }}>Pipeline AI în 5 etape cu aprobare manuală</p>
        </div>
        {blocks.length > 0 && (
          <Btn variant="ghost" onClick={() => setPreview(!preview)}>{preview ? "◀ Editor" : "◉ Preview"}</Btn>
        )}
      </div>

      {/* Step Indicator */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 11, flexShrink: 0,
                background: i < step ? "var(--green)" : i === step ? "var(--accent)" : "var(--surface2)",
                color: i <= step ? "#000" : "var(--dim)",
                border: i === step ? "2px solid var(--accent)" : "2px solid transparent",
                boxShadow: i === step ? "0 0 12px rgba(245,158,11,0.4)" : "none",
              }}>{i < step ? "✓" : i + 1}</div>
              <span style={{ fontSize: 11, color: i === step ? "var(--accent)" : i < step ? "var(--green)" : "var(--dim)", whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? "var(--green)" : "var(--border)", margin: "0 8px", minWidth: 20 }} />}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 18 }}>
        <div>

          {/* STEP 0 — Config */}
          {step === 0 && (
            <Card>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, marginBottom: 20 }}>Configurare Articol</div>
              <Field label="ARTICLE TOPIC (T)">
                <input value={opts.topic} onChange={e => setOpts({ ...opts, topic: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && doGenerateOutline()}
                  placeholder="ex: Non-Touristy Places around Chisinau" />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <Field label="Categorie">
                  <select value={opts.category_id ?? ""} onChange={e => setOpts({ ...opts, category_id: e.target.value ? parseInt(e.target.value) : undefined })}>
                    <option value="">Fără categorie</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Autor">
                  <select value={opts.author_id ?? ""} onChange={e => setOpts({ ...opts, author_id: e.target.value ? parseInt(e.target.value) : undefined })}>
                    <option value="">Fără autor</option>
                    {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </Field>
                <Field label="Site (Satelit)">
                  <select value={opts.site_id ?? ""} onChange={e => setOpts({ ...opts, site_id: e.target.value ? parseInt(e.target.value) : undefined })}>
                    <option value="">Blog-ul principal</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Ton">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TONES.map(t => <Tag key={t} val={t} current={opts.tone} onClick={() => setOpts({ ...opts, tone: t })} />)}
                </div>
              </Field>
              <Field label="Lungime">
                <div style={{ display: "flex", gap: 6 }}>
                  {LENGTHS.map(l => <Tag key={l.value} val={l.label} current={LENGTHS.find(x => x.value === opts.length)?.label ?? ""} onClick={() => setOpts({ ...opts, length: l.value as "short" | "medium" | "long" })} />)}
                </div>
              </Field>
              <Field label="Limbă">
                <div style={{ display: "flex", gap: 6 }}>
                  {[["ro", "🇷🇴 Română"], ["en", "🇬🇧 Engleză"]].map(([v, l]) => (
                    <Tag key={v} val={v} current={opts.language} onClick={() => setOpts({ ...opts, language: v })} />
                  ))}
                </div>
              </Field>
              <Field label="AI Persona (Rolul)">
                <textarea
                  value={opts.ai_persona || ""}
                  onChange={e => setOpts({ ...opts, ai_persona: e.target.value })}
                  placeholder="Descrie rolul și personalitatea AI-ului pentru acest articol (ex: Expert în vinuri, Jurnalist de travel...)"
                  style={{ minHeight: 100, fontSize: 12, lineHeight: 1.5 }}
                />
              </Field>
              <Field label="Backlinks (SEO)">
                <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 12, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(opts.backlinks || {}).map(([anchor, url], i) => (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          placeholder="Anchor"
                          value={anchor}
                          onChange={e => {
                            const newBl = { ...opts.backlinks };
                            const oldUrl = newBl[anchor];
                            delete newBl[anchor];
                            newBl[e.target.value] = oldUrl;
                            setOpts({ ...opts, backlinks: newBl });
                          }}
                          style={{ flex: 1, fontSize: 11, padding: "4px 8px" }}
                        />
                        <input
                          placeholder="URL"
                          value={url}
                          onChange={e => {
                            const newBl = { ...opts.backlinks };
                            newBl[anchor] = e.target.value;
                            setOpts({ ...opts, backlinks: newBl });
                          }}
                          style={{ flex: 2, fontSize: 11, padding: "4px 8px" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newBl = { ...opts.backlinks };
                            delete newBl[anchor];
                            setOpts({ ...opts, backlinks: newBl });
                          }}
                          style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14 }}
                        >×</button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setOpts({ ...opts, backlinks: { ...(opts.backlinks || {}), "": "" } })}
                      style={{ background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 6, padding: "4px", fontSize: 10, color: "var(--muted)", cursor: "pointer" }}
                    >+ Adaugă Backlink</button>
                  </div>
                </div>
              </Field>

              {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 9, padding: "9px 14px", color: "var(--red)", fontSize: 12, marginBottom: 14 }}>⚠ {error}</div>}

              <Btn onClick={doGenerateOutline} disabled={loading || !opts.topic.trim()}>
                {loading ? <><Spinner /> {loadingMsg}</> : "→ Generează Outline"}
              </Btn>
            </Card>
          )}

          {/* STEP 1 — Outline + Image Preview */}
          {step === 1 && outline && (
            <Card>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, marginBottom: 18 }}>📋 Outline Generat</div>

              {/* Image preview */}
              <div style={{ marginBottom: 18, borderRadius: 12, overflow: "hidden", position: "relative", background: "var(--surface2)", minHeight: 180 }}>
                {imageLoading && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)", zIndex: 2 }}>
                    <Spinner size={24} />
                  </div>
                )}
                {image?.localPath && !imageLoading ? (
                  <div style={{ position: "relative" }}>
                    <img src={(image as any).localAdminPath || image.localPath} alt={outline.title}
                      style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
                      <button onClick={() => refreshImage(opts.topic, outline.slug)} disabled={imageLoading}
                        style={{ background: "rgba(0,0,0,0.7)", border: "none", borderRadius: 7, padding: "5px 12px", color: "#fff", fontSize: 11, cursor: "pointer" }}>
                        🔄 Unsplash
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} disabled={imageLoading}
                        style={{ background: "rgba(0,0,0,0.7)", border: "none", borderRadius: 7, padding: "5px 12px", color: "#fff", fontSize: 11, cursor: "pointer" }}>
                        📁 Mix/Upload
                      </button>
                    </div>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 12px", background: "rgba(0,0,0,0.6)", fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                      📁 Satelit: <span style={{ color: "var(--green)", fontFamily: "var(--font-mono)" }}>{image.localPath}</span>
                    </div>
                  </div>
                ) : !imageLoading && (
                  <div style={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <div style={{ color: "var(--dim)", fontSize: 13 }}>Nicio imagine</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => refreshImage(opts.topic, outline.slug)}
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 14px", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>
                        📷 Unsplash
                      </button>
                      <button onClick={() => fileInputRef.current?.click()}
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 14px", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>
                        📁 Încarcă PC
                      </button>
                    </div>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleManualUpload} style={{ display: "none" }} accept="image/*" />
              </div>

              <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, letterSpacing: 1, marginBottom: 3 }}>TITLU</div>
                <input value={outline.title} onChange={e => setOutline({ ...outline, title: e.target.value })}
                  style={{ fontWeight: 700, fontSize: 16, background: "transparent", border: "none", boxShadow: "none", padding: 0, marginBottom: 4 }} />
                <div style={{ fontSize: 11, color: "var(--dim)" }}>/{outline.slug}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[["UNGHI", "angle"], ["PUBLIC ȚINTĂ", "target_audience"]].map(([k, field]) => (
                  <div key={k} style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--dim)", marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{outline[field as keyof Outline] as string}</div>
                  </div>
                ))}
              </div>

              {outline.h2_sections?.map((s, i) => (
                <div key={i} style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px", marginBottom: 8, borderLeft: "3px solid var(--accent)" }}>
                  <input value={s.title} onChange={e => {
                    const secs = [...outline.h2_sections]; secs[i] = { ...s, title: e.target.value };
                    setOutline({ ...outline, h2_sections: secs });
                  }} style={{ fontWeight: 700, fontSize: 13, background: "transparent", border: "none", boxShadow: "none", padding: 0, marginBottom: 6, width: "100%" }} />
                  {s.key_points.map((p, j) => <div key={j} style={{ fontSize: 11, color: "var(--dim)" }}>• {p}</div>)}
                </div>
              ))}

              {meta && (
                <div style={{ background: "#0a1628", borderRadius: 10, padding: "12px 16px", marginBottom: 16, border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: 10, color: "var(--blue)", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>META SEO</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}><span style={{ color: "var(--dim)" }}>title:</span> {meta.meta_title}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}><span style={{ color: "var(--dim)" }}>desc:</span> {meta.meta_description}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}><span style={{ color: "var(--dim)" }}>keywords:</span> {meta.meta_keywords}</div>
                </div>
              )}

              {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 9, padding: "9px 14px", color: "var(--red)", fontSize: 12, marginBottom: 14 }}>⚠ {error}</div>}
              {loading && <div style={{ marginBottom: 14 }}><ProgressBar value={progress} label={loadingMsg} /></div>}

              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <Btn onClick={() => { setStep(2); doGenerateBlocks(); }} disabled={loading}>
                  {loading ? <><Spinner /> {loadingMsg}</> : "→ Generează Articol Complet"}
                </Btn>
                <Btn variant="ghost" onClick={() => setStep(0)}>← Înapoi</Btn>
              </div>
            </Card>
          )}

          {/* STEP 2 — Generating */}
          {step === 2 && (
            <Card>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, marginBottom: 20 }}>⚡ Generare în Progres</div>
              <ProgressBar value={progress} label={loadingMsg} />
              <div style={{ marginTop: 16 }}>
                {blocks.map((b, i) => (
                  <div key={i} style={{ padding: "6px 0", fontSize: 12, color: "var(--muted)", borderBottom: "1px solid var(--surface2)", animation: "fadeIn 0.3s" }}>
                    {b.type === "h2" ? `▸ ${b.data.h2}` : b.type === "text_block" ? `  ✓ ${b.data.content.substring(0, 60)}...` : `  ✓ Concluzie`}
                  </div>
                ))}
              </div>
              {!loading && blocks.length > 0 && <div style={{ marginTop: 16 }}><Btn onClick={() => setStep(3)}>→ Mergi la Review</Btn></div>}
            </Card>
          )}

          {/* STEP 3 — Edit + Review + Publish */}
          {step === 3 && (
            <div>
              {/* Review Score */}
              {review && (
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                      <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="32" cy="32" r="25" fill="none" stroke="var(--surface2)" strokeWidth="6" />
                        <circle cx="32" cy="32" r="25" fill="none" stroke={scoreColor} strokeWidth="6"
                          strokeDasharray={`${2 * Math.PI * 25}`} strokeDashoffset={`${2 * Math.PI * 25 * (1 - sc / 100)}`}
                          style={{ transition: "stroke-dashoffset 1s" }} />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: scoreColor }}>{sc}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: scoreColor, fontSize: 15 }}>
                        {sc >= 80 ? "Excelent! 🎉" : sc >= 60 ? "Bun — cu câteva îmbunătățiri" : "Necesită revizuire"}
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                        {review.strengths?.slice(0, 2).map((s, i) => <span key={i} style={{ fontSize: 11, color: "var(--green)" }}>✓ {s}</span>)}
                        {review.issues?.slice(0, 2).map((s, i) => <span key={i} style={{ fontSize: 11, color: "var(--red)" }}>⚠ {s}</span>)}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Blocks Editor */}
              <Card style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>📝 Editor Blocks</span>
                  <span style={{ fontSize: 12, color: "var(--dim)", fontWeight: 400 }}>{blocks.length} blocks</span>
                </div>
                {blocks.map((b, i) => (
                  <BlockEditor key={i} block={b} index={i} articleTitle={outline?.title ?? ""} opts={opts}
                    onChange={nb => setBlocks(prev => { const arr = [...prev]; arr[i] = nb; return arr; })} />
                ))}
              </Card>

              {/* Publish Card */}
              <Card>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, marginBottom: 16 }}>🚀 Publică Articolul</div>

                {/* Image in publish card */}
                {image?.localPath && (
                  <div style={{ display: "flex", gap: 14, alignItems: "center", background: "var(--surface2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                    <img src={image.localPath} alt="" style={{ width: 80, height: 54, objectFit: "cover", borderRadius: 6 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: "var(--dim)", marginBottom: 2 }}>IMAGINE ARTICOL</div>
                      <div style={{ fontSize: 11, color: "var(--green)", fontFamily: "var(--font-mono)" }}>{image.localPath}</div>
                    </div>
                    <button onClick={() => refreshImage(opts.topic, outline?.slug ?? "")} disabled={imageLoading}
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, padding: "5px 10px", fontSize: 11, color: "var(--muted)", cursor: "pointer" }}>
                      {imageLoading ? "..." : "🔄"}
                    </button>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                  <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, color: "var(--dim)", marginBottom: 3 }}>TITLU</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{outline?.title}</div>
                  </div>
                  <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, color: "var(--dim)", marginBottom: 3 }}>SLUG</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>/{outline?.slug}</div>
                  </div>
                </div>

                {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 9, padding: "9px 14px", color: "var(--red)", fontSize: 12, marginBottom: 14 }}>⚠ {error}</div>}

                <div style={{ display: "flex", gap: 10 }}>
                  <Btn variant="success" onClick={() => saveArticle("published")} disabled={saving}>
                    {saving ? <><Spinner /> Salvez...</> : "✓ Publică Acum"}
                  </Btn>
                  <Btn variant="ghost" onClick={() => saveArticle("draft")} disabled={saving}>
                    {saving ? <><Spinner /></> : "◈ Salvează Draft"}
                  </Btn>
                  <Btn variant="ghost" onClick={() => setStep(1)}>← Outline</Btn>
                </div>
              </Card>

              {/* Preview */}
              {preview && (
                <Card style={{ marginTop: 16, background: "#fff", color: "#111" }}>
                  <div style={{ fontFamily: "Georgia, serif", maxWidth: 680, margin: "0 auto" }}>
                    {(image?.localAdminPath || image?.localPath) && (
                      <img src={image.localAdminPath || image.localPath} alt={outline?.title} style={{ width: "100%", height: 300, objectFit: "cover", borderRadius: 8, marginBottom: 24 }} />
                    )}
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20, lineHeight: 1.3 }}>{outline?.title}</h1>
                    {blocks.map((b, i) => {
                      if (b.type === "h2") return <h2 key={i} style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 10 }}>{b.data.h2}</h2>;
                      if (b.type === "text_block") return <p key={i} style={{ marginBottom: 16, lineHeight: 1.8, fontSize: 15 }} dangerouslySetInnerHTML={{ __html: b.data.content }} />;
                      if (b.type === "block_quotes") return <blockquote key={i} style={{ borderLeft: "3px solid #333", paddingLeft: 16, margin: "20px 0", fontStyle: "italic", color: "#555" }}>{b.data.blocks}</blockquote>;
                      return null;
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* STEP 4 — Done */}
          {step === 4 && (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, marginBottom: 6 }}>Articol Salvat!</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Redirecționare spre lista de articole...</div>
            </Card>
          )}
        </div>

        {/* Log Sidebar */}
        <div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: 14, padding: "16px", position: "sticky", top: 20 }}>
            <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>▶ PIPELINE LOG</div>
            <div ref={logRef} style={{ height: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
              {logs.length === 0 && <div style={{ color: "var(--border)", fontSize: 10 }}>Nicio activitate...</div>}
              {logs.map(l => <div key={l.id} style={{ fontSize: 10, color: l.color, lineHeight: 1.5 }}>{l.msg}</div>)}
            </div>

            {image && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--surface2)" }}>
                <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>IMAGINE</div>
                <img src={image.localAdminPath || image.localPath} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 4 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div style={{ fontSize: 10, color: "var(--green)", fontFamily: "var(--font-mono)" }}>{image.publicUrl}</div>
              </div>
            )}

            {loading && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--surface2)" }}>
                <ProgressBar value={progress} label={loadingMsg} />
              </div>
            )}

            {meta && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--surface2)" }}>
                <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>META SEO</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>{meta.meta_title?.substring(0, 40)}…</div>
                <div style={{ fontSize: 10, color: "var(--dim)" }}>{meta.meta_keywords?.substring(0, 50)}</div>
              </div>
            )}

            {review && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--surface2)" }}>
                <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>REVIEW</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>Score: {sc}/100</div>
                <div style={{ fontSize: 10, color: review.ready_to_publish ? "var(--green)" : "var(--red)", marginTop: 2 }}>
                  {review.ready_to_publish ? "✓ Gata de publicare" : "✗ Necesită revizuire"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
