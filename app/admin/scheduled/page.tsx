"use client";
import { useState } from "react";

const TONES = ["Profesional", "Casual", "Tehnic", "Inspirațional", "Educativ", "Jurnalistic"];
const LENGTHS = [
  { label: "Scurt ~400", value: "short" },
  { label: "Mediu ~800", value: "medium" },
  { label: "Lung ~1500", value: "long" },
];
const FREQUENCIES = [
  { label: "O singură dată", value: "once" },
  { label: "Zilnic", value: "daily" },
  { label: "Săptămânal", value: "weekly" },
  { label: "Lunar", value: "monthly" },
];
const DAYS_OF_WEEK = [
  { label: "Luni", value: "monday" },
  { label: "Marți", value: "tuesday" },
  { label: "Miercuri", value: "wednesday" },
  { label: "Joi", value: "thursday" },
  { label: "Vineri", value: "friday" },
  { label: "Sâmbătă", value: "saturday" },
  { label: "Duminică", value: "sunday" },
];

// Mock data for UI
const MOCK_CATEGORIES = [
  { id: 1, name: "Tehnologie", color: "#3b82f6" },
  { id: 2, name: "Lifestyle", color: "#22c55e" },
  { id: 3, name: "Business", color: "#f59e0b" },
];
const MOCK_AUTHORS = [
  { id: 1, name: "Ion Popescu" },
  { id: 2, name: "Maria Ionescu" },
];
const MOCK_SITES = [
  { id: 1, name: "TechBlog.ro" },
  { id: 2, name: "LifeStyle.md" },
];

// Mock scheduled posts
const MOCK_SCHEDULED = [
  {
    id: 1,
    topic: "Best AI Tools for Developers in 2024",
    site: "TechBlog.ro",
    scheduledDate: "2024-12-20",
    scheduledTime: "09:00",
    frequency: "once",
    status: "pending",
  },
  {
    id: 2,
    topic: "Weekly Tech News Roundup",
    site: "TechBlog.ro",
    scheduledDate: "2024-12-21",
    scheduledTime: "14:00",
    frequency: "weekly",
    status: "active",
  },
  {
    id: 3,
    topic: "Morning Motivation Tips",
    site: "LifeStyle.md",
    scheduledDate: "2024-12-19",
    scheduledTime: "07:00",
    frequency: "daily",
    status: "paused",
  },
];

function Tag({ val, current, onClick }: { val: string; current: string; onClick: () => void }) {
  const active = val === current;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 13px",
        borderRadius: 7,
        fontSize: 12,
        border: active ? "none" : "1px solid var(--border)",
        background: active ? "var(--accent)" : "var(--surface2)",
        color: active ? "#000" : "var(--muted)",
        fontWeight: active ? 700 : 400,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {val}
    </button>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: string;
  small?: boolean;
}) {
  const bg: Record<string, string> = {
    primary: "var(--accent)",
    ghost: "var(--surface2)",
    success: "var(--green)",
    danger: "var(--red)",
  };
  const col: Record<string, string> = {
    primary: "#000",
    ghost: "var(--muted)",
    success: "#000",
    danger: "#fff",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "5px 14px" : "9px 22px",
        borderRadius: 9,
        fontWeight: 700,
        fontSize: small ? 12 : 13,
        background: bg[variant],
        color: col[variant],
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 10,
          color: "var(--muted)",
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
          marginBottom: 7,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 5 }}>{hint}</div>
      )}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="animate-fadein"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--surface2)",
        borderRadius: 16,
        padding: "26px 30px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function DaySelector({
  selectedDays,
  onChange,
}: {
  selectedDays: string[];
  onChange: (days: string[]) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {DAYS_OF_WEEK.map((day) => {
        const active = selectedDays.includes(day.value);
        return (
          <button
            key={day.value}
            onClick={() => {
              if (active) {
                onChange(selectedDays.filter((d) => d !== day.value));
              } else {
                onChange([...selectedDays, day.value]);
              }
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 11,
              border: active ? "none" : "1px solid var(--border)",
              background: active ? "var(--accent)" : "var(--surface2)",
              color: active ? "#000" : "var(--muted)",
              fontWeight: active ? 700 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "rgba(245,158,11,0.15)", color: "var(--accent)", label: "În așteptare" },
    active: { bg: "rgba(34,197,94,0.15)", color: "var(--green)", label: "Activ" },
    paused: { bg: "rgba(100,116,139,0.15)", color: "var(--muted)", label: "Pauză" },
    completed: { bg: "rgba(59,130,246,0.15)", color: "var(--blue)", label: "Finalizat" },
  };
  const s = styles[status] || styles.pending;
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {s.label}
    </span>
  );
}

export default function ScheduledPostsPage() {
  const [view, setView] = useState<"list" | "create">("list");
  const [formData, setFormData] = useState({
    topic: "",
    tone: "Profesional",
    length: "medium",
    language: "ro",
    category_id: "",
    author_id: "",
    site_id: "",
    instructions: "",
    keywords: "",
    backlinks: "",
    scheduledDate: "",
    scheduledTime: "09:00",
    frequency: "once",
    selectedDays: [] as string[],
    dayOfMonth: "1",
    autoPublish: true,
    notifyEmail: "",
    maxRetries: "3",
  });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: -0.5,
            }}
          >
            ◷ Programări Articole
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 3, fontSize: 12 }}>
            Programează generarea și publicarea automată a articolelor
          </p>
        </div>
        <Btn onClick={() => setView(view === "list" ? "create" : "list")}>
          {view === "list" ? "+ Programare Nouă" : "◀ Înapoi la Listă"}
        </Btn>
      </div>

      {view === "list" ? (
        <>
          {/* Stats Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {[
              { label: "Total Programări", value: "12", icon: "◷", color: "var(--accent)" },
              { label: "Active", value: "5", icon: "▶", color: "var(--green)" },
              { label: "În Așteptare", value: "4", icon: "◉", color: "var(--blue)" },
              { label: "Finalizate Azi", value: "3", icon: "✓", color: "var(--muted)" },
            ].map((stat) => (
              <Card key={stat.label} style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${stat.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{stat.label}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Scheduled Posts List */}
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                Programări Existente
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    width: "auto",
                    minWidth: 120,
                  }}
                >
                  <option value="">Toate Site-urile</option>
                  {MOCK_SITES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    width: "auto",
                    minWidth: 120,
                  }}
                >
                  <option value="">Toate Statusurile</option>
                  <option value="active">Active</option>
                  <option value="pending">În Așteptare</option>
                  <option value="paused">Pauză</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {["Topic", "Site", "Data", "Ora", "Frecvență", "Status", "Acțiuni"].map(
                      (header) => (
                        <th
                          key={header}
                          style={{
                            textAlign: "left",
                            padding: "12px 8px",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--muted)",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          {header}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_SCHEDULED.map((post) => (
                    <tr
                      key={post.id}
                      style={{
                        borderBottom: "1px solid var(--surface2)",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "14px 8px", maxWidth: 250 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--text)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {post.topic}
                        </div>
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 5,
                            fontSize: 11,
                            background: "var(--surface2)",
                            color: "var(--muted)",
                          }}
                        >
                          {post.site}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "14px 8px",
                          color: "var(--muted)",
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                        }}
                      >
                        {post.scheduledDate}
                      </td>
                      <td
                        style={{
                          padding: "14px 8px",
                          color: "var(--accent)",
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {post.scheduledTime}
                      </td>
                      <td style={{ padding: "14px 8px", color: "var(--muted)", fontSize: 12 }}>
                        {post.frequency === "once"
                          ? "O dată"
                          : post.frequency === "daily"
                          ? "Zilnic"
                          : post.frequency === "weekly"
                          ? "Săptămânal"
                          : "Lunar"}
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        <StatusBadge status={post.status} />
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn small variant="ghost">
                            ✎
                          </Btn>
                          <Btn small variant="ghost">
                            {post.status === "paused" ? "▶" : "⏸"}
                          </Btn>
                          <Btn small variant="ghost">
                            ✕
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State - hidden when there are items */}
            {MOCK_SCHEDULED.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "var(--muted)",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◷</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Nicio programare încă
                </div>
                <div style={{ fontSize: 12, color: "var(--dim)" }}>
                  Creează prima ta programare pentru a genera articole automat
                </div>
              </div>
            )}
          </Card>
        </>
      ) : (
        /* Create Form */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
          {/* Main Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Article Configuration */}
            <Card>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 16,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: "#000",
                  }}
                >
                  1
                </span>
                Configurare Articol
              </div>

              <Field label="Topic Principal" hint="Subiectul principal al articolului">
                <input
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="ex: Best AI Tools for Developers in 2024"
                />
              </Field>

              <Field label="Instrucțiuni Speciale" hint="Indicații detaliate pentru generarea AI">
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="ex: Include exemple practice, menționează prețuri, compară cu alternative..."
                  style={{ minHeight: 100, resize: "vertical" }}
                />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Cuvinte Cheie SEO" hint="Separate prin virgulă">
                  <input
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="ai tools, developers, programming"
                  />
                </Field>
                <Field label="Backlinks" hint="URL-uri pentru link-uri interne">
                  <input
                    value={formData.backlinks}
                    onChange={(e) => setFormData({ ...formData, backlinks: e.target.value })}
                    placeholder="https://site.com/articol"
                  />
                </Field>
              </div>

              <Field label="Ton">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TONES.map((t) => (
                    <Tag
                      key={t}
                      val={t}
                      current={formData.tone}
                      onClick={() => setFormData({ ...formData, tone: t })}
                    />
                  ))}
                </div>
              </Field>

              <Field label="Lungime Articol">
                <div style={{ display: "flex", gap: 6 }}>
                  {LENGTHS.map((l) => (
                    <Tag
                      key={l.value}
                      val={l.label}
                      current={
                        LENGTHS.find((x) => x.value === formData.length)?.label || ""
                      }
                      onClick={() => setFormData({ ...formData, length: l.value })}
                    />
                  ))}
                </div>
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <Field label="Site Satelit">
                  <select
                    value={formData.site_id}
                    onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                  >
                    <option value="">Selectează site</option>
                    {MOCK_SITES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Categorie">
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Selectează</option>
                    {MOCK_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Autor">
                  <select
                    value={formData.author_id}
                    onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
                  >
                    <option value="">Selectează</option>
                    {MOCK_AUTHORS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Card>

            {/* Schedule Configuration */}
            <Card>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 16,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "var(--green)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: "#000",
                  }}
                >
                  2
                </span>
                Programare
              </div>

              <Field label="Frecvență">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {FREQUENCIES.map((f) => (
                    <Tag
                      key={f.value}
                      val={f.label}
                      current={
                        FREQUENCIES.find((x) => x.value === formData.frequency)?.label || ""
                      }
                      onClick={() => setFormData({ ...formData, frequency: f.value })}
                    />
                  ))}
                </div>
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field
                  label={formData.frequency === "once" ? "Data Publicării" : "Data de Start"}
                >
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledDate: e.target.value })
                    }
                  />
                </Field>
                <Field label="Ora Publicării">
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledTime: e.target.value })
                    }
                  />
                </Field>
              </div>

              {formData.frequency === "weekly" && (
                <Field label="Zilele Săptămânii" hint="Selectează zilele pentru publicare">
                  <DaySelector
                    selectedDays={formData.selectedDays}
                    onChange={(days) => setFormData({ ...formData, selectedDays: days })}
                  />
                </Field>
              )}

              {formData.frequency === "monthly" && (
                <Field label="Ziua din Lună">
                  <select
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                    style={{ width: 120 }}
                  >
                    {Array.from({ length: 28 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </Card>

            {/* Advanced Options */}
            <Card>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 16,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "var(--blue)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: "#fff",
                  }}
                >
                  3
                </span>
                Opțiuni Avansate
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Email Notificare" hint="Primește notificări la publicare">
                  <input
                    type="email"
                    value={formData.notifyEmail}
                    onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.value })}
                    placeholder="email@example.com"
                  />
                </Field>
                <Field label="Încercări Maxime" hint="În caz de eroare">
                  <select
                    value={formData.maxRetries}
                    onChange={(e) => setFormData({ ...formData, maxRetries: e.target.value })}
                    style={{ width: 80 }}
                  >
                    {[1, 2, 3, 5, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  background: "var(--surface2)",
                  borderRadius: 10,
                  marginTop: 8,
                }}
              >
                <button
                  onClick={() =>
                    setFormData({ ...formData, autoPublish: !formData.autoPublish })
                  }
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: formData.autoPublish ? "var(--green)" : "var(--border)",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: 3,
                      left: formData.autoPublish ? 23 : 3,
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }}
                  />
                </button>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Publicare Automată</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    Publică automat după generare fără review manual
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Preview Card */}
            <Card style={{ position: "sticky", top: 20 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 14,
                  marginBottom: 16,
                  color: "var(--muted)",
                }}
              >
                Preview Programare
              </div>

              <div
                style={{
                  background: "var(--surface2)",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 12,
                    color: formData.topic ? "var(--text)" : "var(--dim)",
                  }}
                >
                  {formData.topic || "Topic necompletat"}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--dim)" }}>Site</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      {MOCK_SITES.find((s) => s.id.toString() === formData.site_id)?.name ||
                        "—"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--dim)" }}>Data</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--accent)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {formData.scheduledDate || "—"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--dim)" }}>Ora</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--accent)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {formData.scheduledTime}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--dim)" }}>Frecvență</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      {FREQUENCIES.find((f) => f.value === formData.frequency)?.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--dim)" }}>Ton</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{formData.tone}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--dim)" }}>Lungime</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      {LENGTHS.find((l) => l.value === formData.length)?.label}
                    </span>
                  </div>
                </div>
              </div>

              {formData.frequency !== "once" && (
                <div
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 16,
                    borderLeft: "3px solid var(--blue)",
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: "var(--blue)", fontWeight: 600, marginBottom: 4 }}
                  >
                    Programare Recurentă
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {formData.frequency === "daily" && "Articol nou în fiecare zi"}
                    {formData.frequency === "weekly" &&
                      `În fiecare ${formData.selectedDays.length > 0 ? formData.selectedDays.join(", ") : "săptămână"}`}
                    {formData.frequency === "monthly" &&
                      `În fiecare zi ${formData.dayOfMonth} a lunii`}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Btn disabled={!formData.topic || !formData.site_id || !formData.scheduledDate}>
                  Salvează Programare
                </Btn>
                <Btn variant="ghost" onClick={() => setView("list")}>
                  Anulează
                </Btn>
              </div>
            </Card>

            {/* Tips Card */}
            <Card style={{ background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.2)" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--accent)",
                  marginBottom: 10,
                }}
              >
                Tips
              </div>
              <ul
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  paddingLeft: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  margin: 0,
                }}
              >
                <li>Folosește instrucțiuni clare pentru rezultate mai bune</li>
                <li>Programează publicarea în orele de vârf (9-11, 14-16)</li>
                <li>Verifică timezone-ul serverului</li>
                <li>Setează email pentru notificări importante</li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
