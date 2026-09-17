import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

const NEWS_IMAGE_DIR = path.join(process.cwd(), "public", "images", "news");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

/** List existing public news image paths (e.g. /images/news/foo.jpg). */
export async function listNewsImagePaths(): Promise<string[]> {
  try {
    const entries = await readdir(NEWS_IMAGE_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `/images/news/${name}`);
  } catch {
    return [];
  }
}
