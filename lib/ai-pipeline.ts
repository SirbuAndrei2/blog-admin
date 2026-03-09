import OpenAI from "openai";
import type { Block, Outline, ReviewResult, GenerateOptions } from "@/types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Core caller ────────────────────────────────────────────────
async function ask(prompt: string, temperature = 0.7, maxTokens = 6000): Promise<string> {
  const msg = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.choices[0].message.content ?? "";
}

function parseJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim()) as T;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) try { return JSON.parse(m[0]) as T; } catch { /* fall */ }
    return null;
  }
}

// ── Format backlinks for prompt ────────────────────────────────
function formatBacklinks(backlinks: Record<string, string>): string {
  const entries = Object.entries(backlinks);
  if (entries.length === 0) return "(none)";
  return entries.map(([anchor, url], i) => `- K${i + 1}: "${anchor}", L${i + 1}: "${url}"`).join("\n");
}

// ── Build the master template prompt (token-optimized) ──────────
function buildMasterPrompt(opts: GenerateOptions, lang: string, categories: string): string {
  const A = opts.ai_persona || "Professional journalist. Write accurately and engagingly.";
  const G = (opts as any).geography || "";
  const T = opts.topic;
  const blEntries = Object.entries(opts.backlinks || {});
  const blStr = blEntries.length > 0
    ? blEntries.map(([k, u], i) => `BL${i + 1}: anchor="${k}" url="${u}"`).join("\n")
    : "none";
  const today = new Date().toISOString().split("T")[0];

  return `A: ${A}

Lang: ${lang} | Geo: ${G || "global"} | Topic (T): "${T}"
Categories: ${categories} — pick ONE.

STEP 1 — TOPIC ANALYSIS (do this before writing anything):
Read T carefully. Extract every qualifier and constraint it contains.
Example: T="Non-Touristic Places around Chisinau" → qualifier="Non-Touristic" → you MUST write ONLY about genuinely off-the-beaten-path, locals-only places. EXCLUDE all well-known tourist attractions, city landmarks, and anything that appears in mainstream travel guides.
Write your internal qualifier list in internal_notes.a_role_used.

HARD RULES:
1. T exact string "${T}" must appear verbatim ≥1× in article_html.
2. SCOPE LOCK: Every qualifier in T is a hard constraint on the entire article. If T says "Non-Touristic" → zero mainstream tourist spots. If T says "budget" → no expensive options. If T says "vegan" → no meat dishes. Violating this = FAIL.
3. Backlinks — insert each anchor WORD-FOR-WORD as <a href="url">anchor</a> in contextually relevant sentences, spread naturally (never clustered). No extra links.
4. Article: 1500–2000 words, mostly prose (max 1–2 bullet lists). H1 ≈ T. Sections: H2 (4–7) + optional H3. Last section MUST be <h2>Final Thought</h2>.
5. Concrete specifics only — real (not invented) location names, street names, event dates, local dish names, prices. No generic filler.
6. Return ONLY valid JSON. No markdown, no preamble.

Backlinks:
${blStr}

OUTPUT JSON:
{
  "language":"${lang}","geography":"${G}","category":"...","topic_exact":"${T}",
  "title_h1":"...","slug":"lowercase-hyphen-slug",
  "article_html":"<h1>...</h1><p>...</p><h2>...</h2>...<h2>Final Thought</h2><p>...</p>",
  "meta":{"page_title":"≤60c","meta_title":"...","meta_description":"≤155c","meta_keywords":"...","og_title":"...","og_description":"...","twitter_title":"...","twitter_description":"...","robots":"index,follow","og_type":"article","twitter_card":"summary_large_image","canonical_url":"","og_image":""},
  "schema_jsonld":{"@context":"https://schema.org","@type":"BlogPosting","headline":"...","description":"...","inLanguage":"${lang}","author":{"@type":"Person","name":"..."},"datePublished":"${today}","dateModified":"${today}","publisher":{"@type":"Organization","name":"Editorial Team"},"mainEntityOfPage":{"@type":"WebPage","@id":""}},
  "internal_notes":{"a_role_used":"[list qualifiers extracted from T + what was EXCLUDED]","s_style_used":"...","backlinks_used":[{"anchor":"...","url":"..."}],"research_sources":[{"title":"...","url":"..."}],"word_count_estimate":0}
}

SLUG: lowercase, hyphen-separated, based on T.
FINAL CHECK: T verbatim in article_html ✓ | Backlink anchors exact ✓ | Ends with Final Thought ✓ | 1500–2000 words ✓ | Every qualifier in T honored ✓`;
}

// ── Full Article Response type ────────────────────────────────
export interface FullArticleResult {
  language: string;
  geography: string;
  category: string;
  topic_exact: string;
  title_h1: string;
  slug: string;
  article_html: string;
  meta: {
    page_title: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    canonical_url: string;
    robots: string;
    og_title: string;
    og_description: string;
    og_type: string;
    og_image: string;
    twitter_card: string;
    twitter_title: string;
    twitter_description: string;
  };
  schema_jsonld: Record<string, unknown>;
  internal_notes: {
    a_role_used: string;
    s_style_used: string;
    backlinks_used: { anchor: string; url: string }[];
    research_sources: { title: string; url: string }[];
    word_count_estimate: number;
  };
}

// ── Stage 1: Generate outline (for UI display/progress) ─────
export async function generateOutline(opts: GenerateOptions): Promise<Outline> {
  const lang = opts.language === "ro" ? "Română" : "Engleză";
  const persona = opts.ai_persona || "Ești un jurnalist cu experiență.";

  const raw = await ask(`${persona}

ARTICLE TOPIC (T): "${opts.topic}"

Răspunde DOAR cu JSON valid, fără backticks sau text extra.
Limbă: ${lang}

Creează un plan de articol. Titlul trebuie să fie captivant, profesional și clickable — NU copia exact topicul.
Fiecare secțiune H2 trebuie să vizeze locații exacte, activități concrete sau detalii senzoriale specifice.

{
  "title": "titlu rafinat",
  "slug": "slug-in-engleza",
  "angle": "unghiul unic al articolului",
  "target_audience": "audiența țintă",
  "h2_sections": [
    { "title": "Titlu H2 Specific", "key_points": ["punct 1", "punct 2", "punct 3"] }
  ]
}

Include 4-6 secțiuni H2 obligatoriu, plus o secțiune finală "Final Thought". Slug-ul în engleză, lowercase.`, 0.4, 1500);

  const parsed = parseJSON<Outline>(raw);
  if (!parsed?.title) throw new Error("Outline invalid generat de AI.");
  return parsed;
}

// ── Stage 1b: Meta SEO ─────────────────────────────────────
export async function generateMeta(outline: Outline, lang: string, opts?: GenerateOptions) {
  const persona = opts?.ai_persona || "";
  const raw = await ask(`${persona}

Return ONLY valid JSON, no text or markdown.

Article outline:
Title: "${outline.title}"
Sections: ${outline.h2_sections?.map(s => s.title).join(", ")}
Topic: "${opts?.topic || outline.title}"
Language: ${lang === "ro" ? "Română" : "Engleză"}

Generate refined SEO meta:
{
  "page_title": "browser H1 title (max 60 chars)",
  "meta_title": "SEO meta title (max 60 chars)",
  "meta_keywords": "keyword1, keyword2, keyword3",
  "meta_description": "compelling SEO description (max 155 chars)"
}`, 0.3, 600);

  return parseJSON<Record<string, string>>(raw) ?? {
    page_title: outline.title,
    meta_title: outline.title,
    meta_keywords: "",
    meta_description: "",
  };
}

// ── Stage 2: Generate full article in one pass ────────────────
export async function generateFullArticle(
  opts: GenerateOptions,
  categories: string = "travel, culture, gastronomy"
): Promise<FullArticleResult> {
  const lang = opts.language === "ro" ? "ro" : "en";
  const prompt = buildMasterPrompt(opts, lang, categories);
  const raw = await ask(prompt, 0.6, 6000);
  const parsed = parseJSON<FullArticleResult>(raw);
  if (!parsed?.title_h1) throw new Error("Full article generation failed — invalid JSON from AI.");
  return parsed;
}

// ── Convert article_html → Block[] for the existing block renderer ──
export function htmlToBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  // Split on block-level tags
  const parts = html
    .replace(/\r\n/g, "\n")
    .split(/(?=<h1>|<h2>|<h3>|<blockquote>)/i)
    .map(p => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (/^<h1>/i.test(part)) {
      // Skip h1 — it's the article title already stored separately
      continue;
    }
    if (/^<h2>/i.test(part)) {
      const title = part.replace(/<\/?h2>/gi, "").trim();
      blocks.push({ type: "h2", data: { h2: title, short_paragraph: null } });
    } else if (/^<h3>/i.test(part)) {
      const title = part.replace(/<\/?h3>/gi, "").trim();
      blocks.push({ type: "h2", data: { h2: title, short_paragraph: null } } as any);
    } else if (/^<blockquote>/i.test(part)) {
      const inner = part.replace(/<\/?blockquote>/gi, "").replace(/<\/?p>/gi, "").trim();
      blocks.push({ type: "block_quotes", data: { title: "", source: null, source_link: null, blocks: inner } });
    } else {
      // Wrap consecutive <p> tags as a single text_block
      const content = part.replace(/<p>/gi, "").replace(/<\/p>/gi, "\n\n").trim();
      if (content) blocks.push({ type: "text_block", data: { content } });
    }
  }
  return blocks;
}

// ── Stage 3 (Legacy): Section-by-section generation ─────────
// Kept for backwards compatibility / regenerate single block
export async function generateSectionBlocks(
  outline: Outline,
  section: { title: string; key_points: string[] },
  previousBlocks: Block[],
  opts: GenerateOptions
): Promise<Block[]> {
  const wt = opts.length === "short" ? 150 : opts.length === "medium" ? 280 : 450;
  const lang = opts.language === "ro" ? "Română" : "Engleză";
  const persona = opts.ai_persona || "";
  const personaSource = persona ? persona : "Ești un jurnalist cu experiență.";

  const blMap = opts.backlinks || {};
  const blInstructions = Object.keys(blMap).length > 0
    ? `BACKLINK RULES (STRICT):\n1) Fiecare anchor must appear word-for-word.\n2) Linked to exact URL, unchanged.\n3) Spread naturally, not clustered.\n` +
    Object.entries(blMap).map(([anchor, url], i) => `- K${i + 1}: "${anchor}" -> ${url}`).join("\n")
    : "";

  const prevSummary = previousBlocks
    .filter((b) => b.type === "text_block")
    .slice(-2)
    .map((b) => (b as { type: "text_block"; data: { content: string } }).data.content.substring(0, 150) + "...")
    .join("\n---\n");

  const raw = await ask(`${personaSource}

ARTICLE TOPIC (T): "${opts.topic}"
ARTICLE: "${outline.title}"
ANGLE: ${outline.angle}
LANGUAGE: ${lang}

CURRENT SECTION: "${section.title}"
KEY POINTS: ${section.key_points.join(", ")}
PREVIOUS CONTEXT: ${prevSummary || "This is the first section."}
TARGET LENGTH: ~${wt} words

WRITING INSTRUCTIONS (STRICT):
1. MAXIMUM SPECIFICITY: No generalities. Include location names, specific activities, dishes, wine details, cultural events.
2. NARRATIVE: Use fluid storytelling, not just fact enumeration. Follow voice and tone from the persona (S).
3. POV: Use "I" sparingly and with impact only. Mostly use editorial "you" for guidance.
4. MICRO-TIPS: Include 2-4 practical tips (pacing, reservations, timing, "where to linger").
5. FORMALITY: Respect the formality level from the persona style guide.
6. STRUCTURE: Use h3 for internal sub-headings if useful, text_block for paragraphs, block_quotes for impactful ideas.
${blInstructions}

Return ONLY a JSON array of blocks:
[
  { "type": "text_block", "data": { "content": "fluid text with links and specific details..." } },
  { "type": "block_quotes", "data": { "title": "Insider Tip", "source": "...", "blocks": "..." } }
]`, 0.7);

  const parsed = parseJSON<Block[]>(raw);
  if (!parsed || !Array.isArray(parsed)) return [{ type: "text_block", data: { content: "Content generation error." } }];
  return parsed;
}

// ── Stage 3b: Conclusion ───────────────────────────────────
export async function generateConclusion(outline: Outline, opts: GenerateOptions): Promise<Block> {
  const lang = opts.language === "ro" ? "Română" : "Engleză";
  const persona = opts.ai_persona || "";
  const personaSource = persona ? persona : "Ești un jurnalist cu experiență.";
  const raw = await ask(`${personaSource}

Article: "${outline.title}"
Language: ${lang}

Generate a "Final Thought" conclusion section that respects the persona's voice and tone.
Return ONLY JSON:
{
  "type": "block_quotes",
  "data": {
    "title": "Final Thought",
    "source": "...",
    "source_link": null,
    "blocks": "conclusion text..."
  }
}`, 0.6);

  return parseJSON<Block>(raw) ?? {
    type: "block_quotes",
    data: { title: "Final Thought", source: null, source_link: null, blocks: "" },
  };
}

// ── Stage 4: Generate all blocks (legacy section-by-section) ─
export async function generateAllBlocks(
  outline: Outline,
  opts: GenerateOptions,
  onProgress?: (msg: string, pct: number) => void
): Promise<Block[]> {
  const blocks: Block[] = [];
  const sections = outline.h2_sections;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    onProgress?.(`Section ${i + 1}/${sections.length}: "${section.title}"`, Math.round(((i) / (sections.length + 1)) * 100));
    blocks.push({ type: "h2", data: { h2: section.title, short_paragraph: null } });
    const sectionBlocks = await generateSectionBlocks(outline, section, blocks, opts);
    blocks.push(...sectionBlocks);
  }

  onProgress?.("Final Thought...", 95);
  blocks.push(await generateConclusion(outline, opts));
  onProgress?.("Complete!", 100);
  return blocks;
}

// ── Stage 5: Review ────────────────────────────────────────────
export async function reviewArticle(title: string, blocks: Block[]): Promise<ReviewResult> {
  const fullText = blocks
    .filter((b) => b.type === "text_block")
    .map((b) => (b as { type: "text_block"; data: { content: string } }).data.content)
    .join("\n\n")
    .substring(0, 3000);

  const raw = await ask(`You are a senior editor. Return ONLY valid JSON.

Evaluate the quality of this blog article:
Title: "${title}"
Content:
${fullText}

Return a complete evaluation:
{
  "score": 85,
  "tone_match": true,
  "issues": ["specific issue 1", "specific issue 2"],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "suggestions": ["concrete suggestion 1", "concrete suggestion 2"],
  "ready_to_publish": true
}

score: 0-100 (70+ = ready to publish). Check for: E-E-A-T, specificity, backlink presence, Final Thought section.`, 0.2, 1000);

  return parseJSON<ReviewResult>(raw) ?? {
    score: 70, tone_match: true, issues: [], strengths: [], suggestions: [], ready_to_publish: true,
  };
}

// ── Regenerate single block ────────────────────────────────────
export async function regenerateBlock(
  sectionTitle: string,
  articleTitle: string,
  opts: GenerateOptions,
  feedback?: string
): Promise<Block> {
  const lang = opts.language === "ro" ? "Română" : "Engleză";
  const persona = opts.ai_persona || "You are a professional journalist.";
  const raw = await ask(`${persona}

Rewrite the section "${sectionTitle}" for the article "${articleTitle}".
Language: ${lang}
${feedback ? `Specific feedback: ${feedback}` : "Rewrite with more depth, specific locations, and practical micro-tips."}

Include insider-level details — real place names, activities, food, or cultural events.
Return ONLY JSON:
{
  "type": "text_block",
  "data": { "content": "fully rewritten text..." }
}`, 0.8);

  return parseJSON<Block>(raw) ?? { type: "text_block", data: { content: "Regeneration error." } };
}

// ── Re-export FullArticleResult type for route usage ─────────
export type { FullArticleResult as ArticleFullResult };
