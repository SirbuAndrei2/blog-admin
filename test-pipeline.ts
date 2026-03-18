import { generateOutline } from './lib/ai-pipeline';

async function test() {
  try {
    console.log("Starting generateOutline test with manually passed key...");
    console.log("Key present:", !!process.env.ANTHROPIC_API_KEY);
    
    const result = await generateOutline({
      topic: "Test Topic " + Date.now(),
      tone: "Profesional",
      length: "short",
      language: "ro"
    });
    console.log("SUCCESS:", JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error("FAILED with error:");
    console.error(err);
    if (err.stack) console.error(err.stack);
  }
}

test();
