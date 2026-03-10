import { downloadUnsplashImage } from "./lib/unsplash";

process.env.UNSPLASH_ACCESS_KEY = "U8M_kbxiUlOqDAmAmJkv3uKbZiZA7Kp6rZmQm32FgcU";

async function main() {
    try {
        console.log("Starting test...");
        const res = await downloadUnsplashImage(
            "moldova",
            "test-slug",
            "http://localhost:3001",
            "4521680a848bc1c66db4a64a0dcb3f4b3be3f1f233a0cd12dc8c8dbf775b6303"
        );
        console.log("SUCCESS:", res);
    } catch (e) {
        console.error("FAILED:", e);
    }
}
main();
