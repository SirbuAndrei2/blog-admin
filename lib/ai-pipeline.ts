import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import type { Block, Outline, ReviewResult, GenerateOptions } from "@/types";

// Initialized lazily to pick up .env changes
let client: Anthropic | null = null;

// ── Instruction file loader ─────────────────────────────────────
export interface PipelineInstructions {
  writing_rules: string;
  seo_optimization: string;
  clickbait_titles: string;
}

export function loadInstructions(instructionsDir?: string): PipelineInstructions {
  const dir = instructionsDir ?? path.join(process.cwd(), "instructions");

  const read = (filename: string): string => {
    const filePath = path.join(dir, filename);
    try {
      return fs.readFileSync(filePath, "utf-8").trim();
    } catch (err) {
      console.warn(`[Pipeline] Could not load instruction file: ${filePath}. Using empty string.`);
      return "";
    }
  };

  const instructions = {
    writing_rules: read("writing_rules.md"),
    seo_optimization: read("seo_optimization.md"),
    clickbait_titles: read("clickbait_titles.md"),
  };

  console.log(
    `[Pipeline] Loaded instructions — writing_rules: ${instructions.writing_rules.length}c, seo_optimization: ${instructions.seo_optimization.length}c, clickbait_titles: ${instructions.clickbait_titles.length}c`
  );

  return instructions;
}

// ── Core caller ────────────────────────────────────────────────
export const DEBUG_LOG = "/tmp/pipeline-debug.log";

export function logDebug(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(DEBUG_LOG, line);
  } catch (err) {
    console.error("Failed to write to debug log:", err);
  }
}

async function ask(prompt: string, temperature = 0.7, maxTokens = 6000): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY || "";
  
  if (!key) {
    logDebug("ERROR: ANTHROPIC_API_KEY missing");
    throw new Error("ANTHROPIC_API_KEY is missing. Check your .env file.");
  }

  // Always use a fresh client if key changed or not set
  if (!client || (client as any).apiKey !== key) {
    client = new Anthropic({ apiKey: key });
  }

  logDebug(`Calling Claude (${key.substring(0, 10)}...) | Prompt len: ${prompt.length}`);

  try {
    const msg = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: "user", content: prompt }],
    });

    const content = msg.content[0];
    if (content.type === "text") {
      logDebug(`Claude Success | Response len: ${content.text.length}`);
      return content.text;
    }
    logDebug("Claude Success but no text content");
    return "";
  } catch (err: any) {
    logDebug(`CLAUDE ERROR: ${err.message || err}`);
    if (err.stack) logDebug(err.stack);
    
    if (err.status === 401) throw new Error("Anthropic Authentication failed: Invalid API Key.");
    if (err.status === 404) throw new Error(`Anthropic Model Error: Model not found or inactive.`);
    throw err;
  }
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

// ── Build the master template prompt ───────────────────────────
function buildMasterPrompt(
  opts: GenerateOptions,
  lang: string,
  categories: string,
  instructions?: PipelineInstructions
): string {
  const A = opts.ai_persona || "Professional journalist. Write accurately and engagingly.";
  const G = (opts as any).geography || "Global";
  const T = opts.topic;
  const Tone = opts.tone || "Profesional";
  const Length =
    opts.length === "short" ? "1000-1200" : opts.length === "medium" ? "1500-2000" : "2500-3000";

  const blEntries = Object.entries(opts.backlinks || {});
  const blStr =
    blEntries.length > 0
      ? blEntries.map(([k, u], i) => `BL${i + 1}: anchor="${k}" url="${u}"`).join("\n")
      : "none";
  const today = new Date().toISOString().split("T")[0];
  const keywords = opts.keywords?.trim();

  // Instruction files — inject as reference blocks for Claude
  const writingRulesBlock = instructions?.writing_rules
    ? `\n\n=== WRITING RULES (follow strictly) ===\n${instructions.writing_rules}\n=== END WRITING RULES ===`
    : opts.instructions?.trim()
    ? `\nSPECIAL INSTRUCTIONS (follow strictly): ${opts.instructions.trim()}`
    : "";

  const seoRulesBlock = instructions?.seo_optimization
    ? `\n\n=== SEO OPTIMIZATION RULES ===\n${instructions.seo_optimization}\n=== END SEO RULES ===`
    : "";

  return `ROLE: ${A}
TONE: ${Tone}
LENGTH: Target ~${Length} words.

Lang: ${lang} | Geo: ${G} | Topic (T): "${T}"
Categories: ${categories} — pick ONE category that fits T best.
${keywords ? `SEO KEYWORDS (weave naturally into the text): ${keywords}` : ""}
${writingRulesBlock}
${seoRulesBlock}

PIPELINE STEPS TO EXECUTE BEFORE WRITING:
1. TOPIC ANALYSIS — Read T carefully. Extract every qualifier and constraint. Honor all scope limits.
2. SEO PLANNING — identify primary keyword, 3-5 secondary keywords, craft meta_title (≤60c), meta_description (≤155c), slug.
3. ARTICLE STRUCTURE — Design H1 → intro → H2 sections (4-7) → H3 if needed → <h2>Final Thought</h2>.
4. WRITING — Apply the Writing Rules above. Use real locations, sensory details, micro-tips.
5. OPTIMIZATION — Verify keyword placement, backlink spread, paragraph length, engagement.

HARD RULES:
1. T verbatim in article_html ≥1×.
2. SCOPE LOCK: Honor all qualifiers in T.
3. Backlinks: Insert each anchor exactly as <a href="url">anchor</a>. Spread naturally.
4. Structure: H1 (Title) -> intro -> H2 sections (4-7) -> H3 if needed -> <h2>Final Thought</h2>.
5. Concrete specifics: Real locations, street names, local nuances. No AI filler.
6. Format: Return ONLY valid JSON.

Backlinks:
${blStr}

OUTPUT JSON:
{
  "language":"${lang}","geography":"${G}","category":"...","topic_exact":"${T}",
  "title_h1":"...","slug":"...",
  "titles_generated": ["title1","title2","title3","title4","title5","title6","title7","title8","title9","title10"],
  "article_html":"<h1>...</h1><p>...</p><h2>...</h2>...<h2>Final Thought</h2><p>...</p>",
  "meta":{"page_title":"≤60c","meta_title":"...","meta_description":"≤155c","meta_keywords":"...","og_title":"...","og_description":"...","twitter_title":"...","twitter_description":"...","robots":"index,follow","og_type":"article","twitter_card":"summary_large_image","canonical_url":"","og_image":""},
  "schema_jsonld":{"@context":"https://schema.org","@type":"BlogPosting","headline":"...","description":"...","inLanguage":"${lang}","author":{"@type":"Person","name":"..."},"datePublished":"${today}","dateModified":"${today}","publisher":{"@type":"Organization","name":"Editorial Team"}},
  "internal_notes":{"a_role_used":"...","s_style_used":"${Tone}","backlinks_used":[],"research_sources":[],"word_count_estimate":0}
}`;
}

// ── Full Article Response type ────────────────────────────────
export interface FullArticleResult {
  language: string;
  geography: string;
  category: string;
  topic_exact: string;
  title_h1: string;
  slug: string;
  titles_generated: string[];
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

// ── Stage 0 (new): Generate 10 candidate titles ───────────────
export async function generateTitles(
  opts: GenerateOptions,
  instructions?: PipelineInstructions
): Promise<string[]> {
  const lang = opts.language === "ro" ? "Română" : "English";
  const persona = opts.ai_persona || "Professional journalist.";
  const titleRules = instructions?.clickbait_titles
    ? `\n\n=== TITLE FORMULA RULES ===\n${instructions.clickbait_titles}\n=== END TITLE RULES ===`
    : "";

  const raw = await ask(
    `ROLE: ${persona}
TOPIC: "${opts.topic}"
LANGUAGE: ${lang}
${titleRules}

Generate exactly 10 highly engaging blog titles for the topic above.
Rules:
- Mix question, number, curiosity-gap, and statement formats
- Primary keyword in at least 7 titles
- Each title under 70 characters
- High CTR potential, no clichés

Return ONLY valid JSON array:
["title1","title2","title3","title4","title5","title6","title7","title8","title9","title10"]`,
    0.8,
    600
  );

  const parsed = parseJSON<string[]>(raw);
  if (!parsed || !Array.isArray(parsed)) {
    console.warn("[Pipeline] generateTitles: could not parse titles, returning empty array.");
    return [];
  }
  return parsed;
}

// ── Stage 1: Generate outline (for UI display/progress) ─────
export async function generateOutline(opts: GenerateOptions): Promise<Outline> {
  const lang = opts.language === "ro" ? "Română" : "Engleză";
  const persona = opts.ai_persona || "Ești un jurnalist cu experiență.";
  const tone = opts.tone || "Profesional";
  const length = opts.length || "medium";

  const raw = await ask(`ROLE: ${persona}
TONE: ${tone}
LENGTH: ${length}

ARTICLE TOPIC (T): "${opts.topic}"

Răspunde DOAR cu JSON valid, fără backticks sau text extra.
Limbă: ${lang}

Creează un plan de articol. Titlul trebuie să fie captivant, profesional și CLICKABLE — NU copia exact topicul.
Fiecare secțiune H2 trebuie să vizeze locații exacte, activități concrete sau detalii senzoriale specifice conform tonului (${tone}).

{
  "title": "titlu rafinat",
  "slug": "slug-in-engleza",
  "angle": "unghiul unic al articolul",
  "target_audience": "audiența țintă",
  "h2_sections": [
    { "title": "Titlu H2 Specific", "key_points": ["punct 1", "punct 2", "punct 3"] }
  ]
}

Include 4-6 secțiuni H2 obligatoriu, plus o secțiune finală "Final Thought". Slug-ul obligatoriu in engleza, lowercase, baza pe titlu.`, 0.4, 1500);

  const parsed = parseJSON<Outline>(raw);
  if (!parsed?.title) throw new Error("Outline invalid generat de AI.");
  return parsed;
}

// ── Stage 1b: Meta SEO ─────────────────────────────────────
export async function generateMeta(
  outline: Outline,
  lang: string,
  opts?: GenerateOptions,
  instructions?: PipelineInstructions
) {
  const persona = opts?.ai_persona || "";
  const seoRulesBlock = instructions?.seo_optimization
    ? `\n\n=== SEO RULES ===\n${instructions.seo_optimization}\n=== END SEO RULES ===`
    : "";

  const raw = await ask(`${persona}
${seoRulesBlock}

Return ONLY valid JSON, no text or markdown.

Article outline:
Title: "${outline.title}"
Sections: ${outline.h2_sections?.map((s) => s.title).join(", ")}
Topic: "${opts?.topic || outline.title}"
Language: ${lang === "ro" ? "Română" : "Engleză"}

Generate refined SEO meta:
{
  "page_title": "browser H1 title (max 60 chars)",
  "meta_title": "SEO meta title (max 60 chars)",
  "meta_keywords": "keyword1, keyword2, keyword3",
  "meta_description": "compelling SEO description (max 155 chars)"
}`, 0.3, 600);

  return (
    parseJSON<Record<string, string>>(raw) ?? {
      page_title: outline.title,
      meta_title: outline.title,
      meta_keywords: "",
      meta_description: "",
    }
  );
}

// ── Stage 2: Generate full article in one pass ────────────────
export async function generateFullArticle(
  opts: GenerateOptions,
  categories: string = "travel, culture, gastronomy",
  instructions?: PipelineInstructions
): Promise<FullArticleResult> {
  // Auto-load instructions if not provided
  const instr = instructions ?? loadInstructions();
  const lang = opts.language === "ro" ? "ro" : "en";
  const prompt = buildMasterPrompt(opts, lang, categories, instr);
  const raw = await ask(prompt, 0.6, 8000);
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
    .map((p) => p.trim())
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
      const inner = part
        .replace(/<\/?blockquote>/gi, "")
        .replace(/<\/?p>/gi, "")
        .trim();
      blocks.push({
        type: "block_quotes",
        data: { title: "", source: null, source_link: null, blocks: inner },
      });
    } else {
      // Wrap consecutive <p> tags as a single text_block
      const content = part
        .replace(/<p>/gi, "")
        .replace(/<\/p>/gi, "\n\n")
        .trim();
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
  opts: GenerateOptions,
  instructions?: PipelineInstructions
): Promise<Block[]> {
  const wt =
    opts.length === "short" ? 150 : opts.length === "medium" ? 280 : 450;
  const lang = opts.language === "ro" ? "Română" : "Engleză";
  const persona = opts.ai_persona || "";
  const personaSource = persona ? persona : "Ești un jurnalist cu experiență.";

  const writingRulesBlock = instructions?.writing_rules
    ? `\n\n=== WRITING RULES ===\n${instructions.writing_rules}\n=== END WRITING RULES ===`
    : "";

  const blMap = opts.backlinks || {};
  const blInstructions =
    Object.keys(blMap).length > 0
      ? `BACKLINK RULES (STRICT):\n1) Fiecare anchor must appear word-for-word.\n2) Linked to exact URL, unchanged.\n3) Spread naturally, not clustered.\n` +
        Object.entries(blMap)
          .map(([anchor, url], i) => `- K${i + 1}: "${anchor}" -> ${url}`)
          .join("\n")
      : "";

  const prevSummary = previousBlocks
    .filter((b) => b.type === "text_block")
    .slice(-2)
    .map(
      (b) =>
        (b as { type: "text_block"; data: { content: string } }).data.content.substring(0, 150) +
        "..."
    )
    .join("\n---\n");

  const raw = await ask(
    `${personaSource}
${writingRulesBlock}

ARTICLE TOPIC (T): "${opts.topic}"
ARTICLE: "${outline.title}"
ANGLE: ${outline.angle}
LANGUAGE: ${lang}

CURRENT SECTION: "${section.title}"
KEY POINTS: ${section.key_points.join(", ")}
PREVIOUS CONTEXT: ${prevSummary || "This is the first section."}
TARGET LENGTH: ~${wt} words
${blInstructions}

Return ONLY a JSON array of blocks:
[
  { "type": "text_block", "data": { "content": "fluid text with links and specific details..." } },
  { "type": "block_quotes", "data": { "title": "Insider Tip", "source": "...", "blocks": "..." } }
]`,
    0.7
  );

  const parsed = parseJSON<Block[]>(raw);
  if (!parsed || !Array.isArray(parsed))
    return [{ type: "text_block", data: { content: "Content generation error." } }];
  return parsed;
}

// ── Stage 3b: Conclusion ───────────────────────────────────
export async function generateConclusion(
  outline: Outline,
  opts: GenerateOptions
): Promise<Block> {
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
}`,
    0.6
  );

  return (
    parseJSON<Block>(raw) ?? {
      type: "block_quotes",
      data: { title: "Final Thought", source: null, source_link: null, blocks: "" },
    }
  );
}

// ── Stage 4: Generate all blocks (legacy section-by-section) ─
export async function generateAllBlocks(
  outline: Outline,
  opts: GenerateOptions,
  onProgress?: (msg: string, pct: number) => void,
  instructions?: PipelineInstructions
): Promise<Block[]> {
  const blocks: Block[] = [];
  const sections = outline.h2_sections;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    onProgress?.(
      `Section ${i + 1}/${sections.length}: "${section.title}"`,
      Math.round(((i) / (sections.length + 1)) * 100)
    );
    blocks.push({ type: "h2", data: { h2: section.title, short_paragraph: null } });
    const sectionBlocks = await generateSectionBlocks(outline, section, blocks, opts, instructions);
    blocks.push(...sectionBlocks);
  }

  onProgress?.("Final Thought...", 95);
  blocks.push(await generateConclusion(outline, opts));
  onProgress?.("Complete!", 100);
  return blocks;
}

// ── Stage 5: Review ────────────────────────────────────────────
export async function reviewArticle(
  title: string,
  blocks: Block[]
): Promise<ReviewResult> {
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

score: 0-100 (70+ = ready to publish). Check for: E-E-A-T, specificity, backlink presence, Final Thought section.`,
    0.2,
    1000
  );

  return (
    parseJSON<ReviewResult>(raw) ?? {
      score: 70,
      tone_match: true,
      issues: [],
      strengths: [],
      suggestions: [],
      ready_to_publish: true,
    }
  );
}

// ── Regenerate single block ────────────────────────────────────
export async function regenerateBlock(
  sectionTitle: string,
  articleTitle: string,
  opts: GenerateOptions,
  feedback?: string,
  instructions?: PipelineInstructions
): Promise<Block> {
  const lang = opts.language === "ro" ? "Română" : "Engleză";
  const persona = opts.ai_persona || "You are a professional journalist.";
  const writingRulesBlock = instructions?.writing_rules
    ? `\n\n=== WRITING RULES ===\n${instructions.writing_rules}\n=== END WRITING RULES ===`
    : "";

  const raw = await ask(`${persona}
${writingRulesBlock}

Rewrite the section "${sectionTitle}" for the article "${articleTitle}".
Language: ${lang}
${feedback ? `Specific feedback: ${feedback}` : "Rewrite with more depth, specific locations, and practical micro-tips."}

Include insider-level details — real place names, activities, food, or cultural events.
Return ONLY JSON:
{
  "type": "text_block",
  "data": { "content": "fully rewritten text..." }
}`,
    0.8
  );

  return (
    parseJSON<Block>(raw) ?? {
      type: "text_block",
      data: { content: "Regeneration error." },
    }
  );
}

// ── Re-export FullArticleResult type for route usage ─────────
export type { FullArticleResult as ArticleFullResult };
