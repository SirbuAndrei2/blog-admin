import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateFullArticle, htmlToBlocks, loadInstructions } from "@/lib/ai-pipeline";
import { downloadUnsplashImage } from "@/lib/unsplash";

// GET /api/jobs/process - Trigger worker to process scheduled jobs
// Security: In production, this should be protected by a secret token or IP whitelist
export async function GET() {
  const now = new Date();
  console.log(`[Worker] Started at ${now.toISOString()}`);

  // Load instruction files once for the entire worker run
  const pipelineInstructions = loadInstructions();

  try {
    // Find jobs that are active or pending and should have run by now
    const jobs = await prisma.automationJob.findMany({
      where: {
        status: { in: ["active", "pending"] },
        scheduled_at: { lte: now }
      },
      include: {
        site: true
      }
    });

    console.log(`[Worker] Found ${jobs.length} jobs to process`);
    if (jobs.length === 0) {
      return NextResponse.json({ message: "No jobs to process", time: now.toISOString() });
    }

    const results = [];

    for (const job of jobs) {
      try {
        console.log(`[Worker] Processing job ${job.id}: ${job.topic}`);
        
        // 1. Generate Article using AI Pipeline
        console.log(`[Worker] Generating article for job ${job.id}...`);
        const categories = await prisma.category.findMany({ select: { name: true } });
        const catNames = categories.map(c => c.name).join(", ");

        // Helper to safely parse backlinks
        const parseBacklinks = (input: string | null) => {
          if (!input) return {};
          try {
            return JSON.parse(input);
          } catch (e) {
            console.error(`[Worker] Failed to parse backlinks for job ${job.id}, using empty object:`, e);
            // If it's not JSON, it might just be a URL. But pipeline expects {anchor: url}
            // For now, we'll just return {} to avoid crashing the whole job
            return {};
          }
        };

        const jobConfig = (job.config ?? {}) as Record<string, any>;
        const autoPublish = jobConfig.autoPublish !== false; // default true

        const articleResult = await generateFullArticle({
          topic: job.topic,
          language: job.language,
          tone: job.tone,
          length: job.length as any,
          ai_persona: job.site.ai_persona || undefined,
          backlinks: parseBacklinks(job.backlinks),
          instructions: job.instructions || undefined,
          keywords: job.keywords || undefined,
        }, catNames, pipelineInstructions);

        console.log(`[Worker] Article generated: "${articleResult.title_h1}"`);

        // 2. Fetch Unsplash image (non-blocking — failure just skips image)
        let articleImageUrl: string | null = null;
        try {
          console.log(`[Worker] Fetching Unsplash image for job ${job.id}...`);
          const imageResult = await downloadUnsplashImage(
            job.topic,
            articleResult.slug,
            job.site.domain,
            job.site.api_key
          );
          articleImageUrl = imageResult.publicUrl ?? null;
          console.log(`[Worker] Image fetched: ${articleImageUrl}`);
        } catch (imgErr: any) {
          console.warn(`[Worker] Unsplash image fetch failed for job ${job.id}: ${imgErr.message}. Article will be saved without image.`);
        }

        // 3. Convert HTML to blocks
        const blocks = htmlToBlocks(articleResult.article_html);

        // 3. Create Article in DB
        console.log(`[Worker] Saving article to database...`);
        const article = await prisma.article.create({
          data: {
            title: articleResult.title_h1,
            slug: articleResult.slug,
            topic: job.topic,
            content: articleResult.article_html,
            blocks: blocks as any,
            image: articleImageUrl,
            language: job.language,
            status: autoPublish ? "published" : "draft",
            published_at: autoPublish ? new Date() : null,
            site_id: job.site_id,
            category_id: job.category_id,
            author_id: job.author_id,
            meta: {
              create: {
                page_title: articleResult.meta.page_title,
                meta_title: articleResult.meta.meta_title,
                meta_keywords: articleResult.meta.meta_keywords,
                meta_description: articleResult.meta.meta_description,
              }
            }
          }
        });

        console.log(`[Worker] Article saved with ID ${article.id}`);

        // 4. Update Job status / next run time
        console.log(`[Worker] Updating job status for job ${job.id}...`);
        let nextStatus = job.status;
        let nextScheduledAt = job.scheduled_at;

        if (job.frequency === "once") {
          nextStatus = "completed";
        } else {
          // Calculate next run time
          const date = new Date(job.scheduled_at);
          if (job.frequency === "daily") date.setDate(date.getDate() + 1);
          if (job.frequency === "weekly") date.setDate(date.getDate() + 7);
          if (job.frequency === "monthly") date.setMonth(date.getMonth() + 1);
          
          nextScheduledAt = date;
          // If the new date is still in the past (e.g. system was down), 
          // we might want to catch up, but for simplicity we'll just set it to future
          if (nextScheduledAt <= now) {
            nextScheduledAt = now;
            if (job.frequency === "daily") nextScheduledAt.setDate(nextScheduledAt.getDate() + 1);
            // ... etc
          }
        }

        await prisma.automationJob.update({
          where: { id: job.id },
          data: {
            status: nextStatus,
            scheduled_at: nextScheduledAt
          }
        });

        results.push({ id: job.id, success: true, article_id: article.id });
      } catch (e: any) {
        console.error(`[Worker] Failed to process job ${job.id}:`, e);
        results.push({ id: job.id, success: false, error: e.message });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
