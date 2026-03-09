import { NextRequest } from "next/server";
import { generateAllBlocks, reviewArticle } from "@/lib/ai-pipeline";
import type { Outline, GenerateOptions } from "@/types";

export async function POST(req: NextRequest) {
  const { outline, opts }: { outline: Outline; opts: GenerateOptions } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const blocks = await generateAllBlocks(outline, opts, (msg, pct) => {
          send({ type: "progress", msg, pct });
        });

        send({ type: "progress", msg: "Review automat...", pct: 98 });
        const review = await reviewArticle(outline.title, blocks);

        send({ type: "done", blocks, review });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        send({ type: "error", msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
