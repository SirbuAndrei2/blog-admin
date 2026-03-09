// ── Block Types (matching your JSON structure) ─────────────────
export type BlockH2 = {
  type: "h2";
  data: { h2: string; short_paragraph: string | null };
};

export type BlockText = {
  type: "text_block";
  data: { content: string };
};

export type BlockVisuals = {
  type: "visuals";
  data: { image: string | null; link: string | null; alt: string | null; title: string | null };
};

export type BlockQuote = {
  type: "block_quotes";
  data: { title: string; source: string | null; source_link: string | null; blocks: string };
};

export type Block = BlockH2 | BlockText | BlockVisuals | BlockQuote;

// ── Article ────────────────────────────────────────────────────
export type ArticleMeta = {
  page_title: string;
  meta_title: string;
  meta_keywords: string;
  meta_description: string;
};

export type ArticleCategory = {
  name: string | null;
  slug: string | null;
  color: string | null;
};

export type ArticleAuthor = {
  id: number | null;
  name: string | null;
  image: string | null;
};

export type Article = {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  content: string;
  blocks: Block[];
  language: string;
  published_at: string | null;
  status: "draft" | "published" | "archived";
  category: ArticleCategory;
  author: ArticleAuthor;
  comments: unknown[];
  meta: ArticleMeta;
  site_id?: number | null;
};

// ── AI Pipeline ────────────────────────────────────────────────
export type Outline = {
  title: string;
  slug: string;
  angle: string;
  target_audience: string;
  h2_sections: { title: string; key_points: string[] }[];
};

export type ReviewResult = {
  score: number;
  tone_match: boolean;
  issues: string[];
  strengths: string[];
  suggestions: string[];
  ready_to_publish: boolean;
};

export interface GenerateOptions {
  topic: string;
  tone: string;
  length: "short" | "medium" | "long";
  language: string;
  category_id?: number;
  author_id?: number;
  site_id?: number;
  ai_persona?: string;
  backlinks?: Record<string, string>;
}
