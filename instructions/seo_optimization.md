# SEO Optimization Rules

## Keyword Strategy
- Identify one primary keyword and 3–5 secondary keywords based on the topic.
- Primary keyword must appear: in the H1 title, within the first 100 words, in the meta title, and in the meta description.
- Secondary keywords spread naturally throughout H2 headings and body text — never forced.
- Use long-tail variants and semantic synonyms to capture broader search intent.
- Target informational, commercial, or educational intent — match keyword use to the identified intent.

## Meta Tags
- `meta_title`: Max 60 characters. Format: `[Primary Keyword] — [Modifier] | [Brand]`
- `meta_description`: Max 155 characters. Must include primary keyword + a compelling call-to-action or value proposition.
- `og_title` and `twitter_title`: Can be punchier and more curiosity-driven than the meta title.
- `og_description` / `twitter_description`: Match search intent; highlight unique value.
- `robots`: Default to `index,follow` unless otherwise specified.

## URL Slug Rules
- Slug must be in English, lowercase, hyphen-separated.
- Include the primary keyword.
- Maximum 5–7 words.
- No stop words (a, the, and, of, in) unless essential for readability.

## Content Structure for SEO
- H1: single, contains primary keyword, unique per article.
- H2: 4–7 sections. Each targets a secondary keyword or subtopic.
- H3: use for sub-sections within long H2 blocks.
- Final H2 section must be titled "Final Thought" — good for featured snippet capture.
- Include a FAQ-style block or numbered list in at least one section for PAA (People Also Ask) targeting.

## Schema & Structured Data
- Always generate a `schema_jsonld` block with `@type: BlogPosting`.
- Include `headline`, `description`, `datePublished`, `dateModified`, `author`, `publisher`.
- Author `name` must match the assigned persona.

## E-E-A-T Signals
- Reference real sources, locations, or expert perspectives in the article body.
- Author persona must be referenced with credentials in the `internal_notes`.
- Content must demonstrate Experience (first-hand detail), Expertise (accurate specifics), Authority (confident voice), and Trust (no exaggerated claims).

## Keyword Density
- Primary keyword: 1–2% density (roughly once per 100 words).
- Never repeat primary keyword consecutively — use synonyms between mentions.
- Secondary keywords: once or twice each, naturally embedded.
