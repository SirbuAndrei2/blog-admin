# Blog Admin — AI Powered

Admin panel Next.js 14 cu generare articole AI (GPT-4o) și MySQL.

## Setup Rapid

### 1. Instalează dependențele
```bash
npm install
```

### 2. Configurează variabilele de mediu
```bash
cp .env.example .env
```

Editează `.env`:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/NUMELE_TAU_DB"
OPENAI_API_KEY="sk-..."
```

### 3. Creează tabelele în MySQL
```bash
npm run db:push
```

### 4. Pornește serverul
```bash
npm run dev
```

Deschide [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Structura DB (MySQL)

| Tabel         | Descriere                              |
|---------------|----------------------------------------|
| `Article`     | Articole cu blocks JSON + content HTML |
| `ArticleMeta` | Meta SEO per articol                   |
| `Category`    | Categorii cu culoare                   |
| `Author`      | Autori cu bio și imagine               |

### Format JSON blocks (identic cu structura ta):
```json
[
  { "type": "h2", "data": { "h2": "Titlu", "short_paragraph": null } },
  { "type": "text_block", "data": { "content": "..." } },
  { "type": "visuals", "data": { "image": null, "link": "...", "alt": "...", "title": "..." } },
  { "type": "block_quotes", "data": { "title": "Concluzie", "source": null, "source_link": null, "blocks": "..." } }
]
```

---

## API Endpoints

| Method | URL | Descriere |
|--------|-----|-----------|
| GET | `/api/articles` | Listă articole (filter: status, page, limit) |
| POST | `/api/articles` | Creează articol |
| GET | `/api/articles/:id` | Detalii articol |
| PATCH | `/api/articles/:id` | Actualizează articol |
| DELETE | `/api/articles/:id` | Șterge articol |
| GET | `/api/categories` | Listă categorii |
| POST | `/api/categories` | Creează categorie |
| GET | `/api/authors` | Listă autori |
| POST | `/api/authors` | Creează autor |
| POST | `/api/generate/outline` | Generează outline + meta SEO |
| POST | `/api/generate/blocks` | Generează blocks (SSE stream) |
| POST | `/api/generate/regenerate` | Regenerează un block |

---

## Pipeline AI (5 etape)

```
1. Configurare  →  topic, ton, lungime, limbă, categorie, autor
2. Outline      →  Claude generează structura + meta SEO
3. Generare     →  Fiecare block generat separat (SSE streaming)
4. Review       →  Editor blocks + score automat 0-100
5. Publică      →  Salvare în MySQL (draft sau published)
```

## Comenzi utile
```bash
npm run db:studio    # Prisma Studio (UI vizual pentru DB)
npm run db:migrate   # Rulează migrații
npm run build        # Build producție
```
