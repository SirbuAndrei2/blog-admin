import fs from "fs";
import path from "path";


// Translate topic to English keywords for Unsplash (better word extraction)
function extractKeywords(topic: string): string {
  // Remove common Romanian/stop words, keep meaningful terms
  const stopWords = ["acum", "este", "sunt", "care", "pentru", "din", "în", "la", "și", "sau", "că", "cea", "cei", "despre", "the", "a", "an", "in", "of", "for", "to", "how", "why", "what", "with", "around"];
  const words = topic
    .toLowerCase()
    .replace(/[^a-z0-9\sșțăîâ]/g, "")
    .split(/\s+/)
    .filter(w => !stopWords.includes(w) && w.length > 2);

  // Focus on first 3 meaningful words (usually the subject)
  return words.slice(0, 3).join(" ");
}

export interface DownloadedImage {
  localPath: string;   // relative path on the frontend /data/images/xyz.jpg
  publicUrl: string;   // full URL to the image on the frontend
  unsplashUrl: string; // original unsplash URL
  localAdminPath?: string; // Optional local path on the admin side
}

export async function downloadUnsplashImage(topic: string, slug: string, targetDomain: string, apiKey: string): Promise<DownloadedImage> {
  const allKeywords = extractKeywords(topic || slug);
  const keywordsList = allKeywords.split(" ");
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  let unsplashUrl = `https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200`; // Default fallback

  try {
    if (accessKey) {
      // Try with specific keywords first, then fall back to broader ones
      const searchQueries = [
        allKeywords,
        keywordsList[0], // Just the first (usually main) word
        "travel moldova", // Industry context fallback
        "scenery"        // Generic fallback
      ].filter(q => q && q.length > 0);

      for (const query of searchQueries) {
        console.log(`[unsplash] Fetching random image for: "${query}"`);
        const apiRes = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${accessKey}`, { cache: "no-store" });

        if (apiRes.ok) {
          const ad = await apiRes.json();
          unsplashUrl = ad.urls?.regular || ad.urls?.full || unsplashUrl;
          console.log(`[unsplash] Got image URL for "${query}": ${unsplashUrl}`);
          break; // Found one!
        } else {
          console.warn(`[unsplash] API Error for "${query}": ${apiRes.status}`);
          // If rate limit (403), stop retrying
          if (apiRes.status === 403) break;
        }
      }
    }

    const filename = `${slug.substring(0, 30)}-unsplash.jpg`;
    console.log(`[unsplash] Downloading: ${unsplashUrl}`);

    const response = await fetch(unsplashUrl, {
      headers: { "User-Agent": "BlogAdmin/1.0" },
      redirect: "follow",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // Push directly to the selected Satellite's frontend!
    const domain = targetDomain.replace(/\/$/, ""); // remove trailing slash
    const uploadUrl = `${domain}/api/upload`;

    console.log(`[unsplash] Pushing image (${buffer.length} bytes) to Satellite: ${uploadUrl}`);

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        image_base64: base64Image,
        image_name: filename
      })
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      throw new Error(`Satellite Upload Error (${uploadRes.status}): ${errBody}`);
    }

    const data = await uploadRes.json();

    // -- NEW: Save a local copy on Admin for preview/edit! --
    const localDir = path.join(process.cwd(), "public", "uploads", "articles");
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
    const localFilePath = path.join(localDir, filename);
    await fs.promises.writeFile(localFilePath, buffer);
    console.log(`[unsplash] Saved local admin copy: ${localFilePath}`);

    return {
      localPath: data.path, // The relative path ON THE FRONTEND (e.g., /data/images/xyz.jpg)
      publicUrl: `${domain}${data.path}`,
      unsplashUrl,
      localAdminPath: `/uploads/articles/${filename}`
    };
  } catch (error: any) {
    console.error(`[unsplash] Critical error: ${error.message}. Falling back to default.`);
    // Fallback: return a generic placeholder if everything fails, or rethrow if you want to block
    return {
      localPath: "/placeholder-article.jpg",
      publicUrl: "/placeholder-article.jpg",
      unsplashUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200",
    };
  }
}

// Delete a local image file (Admin side - unused now but keeping for backwards compatibility / local debug)
export function deleteLocalImage(localPath: string) {
  try {
    const fullPath = path.join(process.cwd(), "public", localPath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch { /* ignore */ }
}

