/**
 * One-off asset optimisation for the Phase 1 homepage and core pages.
 *
 * Reads genuine Kingston Jiu Jitsu media previously downloaded from the live
 * public site (https://www.kingstonjiujitsu.com/wp-content/uploads/...) into a
 * temp directory, then writes appropriately sized/compressed copies into
 * /public/images. The raw downloads are intentionally NOT committed.
 *
 * Class images are cropped to a consistent 16:10 using subject-aware cropping
 * so faces/subjects stay in frame across the cards and the classes hub.
 *
 * Usage: node scripts/optimize-images.mjs [SRC_DIR]
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = process.argv[2] || "/tmp/kjj-assets";
const INSTR_SRC = process.env.INSTR_SRC || "/tmp/kjj-instr";
const OUT = path.resolve("public/images");

// Instructor headshots — genuine portraits from the live WordPress media
// library (wp-content/uploads/...). Cropped to a consistent 4:5 portrait with a
// top gravity so heads stay in frame. Download each source as <slug>.jpg into
// INSTR_SRC first. Source files (by slug):
//   master-mauricio-gomes  2024/04/Mauricio.jpg
//   marc-barton            2024/04/Marc.jpg
//   yiyang-ng              2024/04/Yang.jpg
//   andreas-wichmann       2024/04/Andreas.jpg
//   simon-marshall         2024/09/Simon-BB-scaled.jpg
//   dan-lau                2025/12/Dan-black-belt.jpg
//   clare-barton           2024/04/Clare.jpg
//   ray-stokes             2025/12/Ray-brown-belt.jpg
//   iacopo-sassi           2025/12/Iacopo-brown-belt.jpg
//   charlie-villaroman     2024/04/Charlie.jpg
const instructorPhotos = [
  "master-mauricio-gomes:mauricio-gomes",
  "marc-barton",
  "yiyang-ng",
  "andreas-wichmann",
  "simon-marshall",
  "dan-lau",
  "clare-barton",
  "ray-stokes",
  "iacopo-sassi",
  "charlie-villaroman",
];

// Width-only photos (aspect handled by CSS or already correct).
const widthPhotos = [
  { src: "hero.jpg", out: "hero.jpg", width: 2000, quality: 78 },
  { src: "community.jpg", out: "community.jpg", width: 1400, quality: 80 },
  { src: "guide.jpg", out: "resources/beginners-guide.jpg", width: 720 },
  { src: "portal.jpg", out: "resources/online-portal.jpg", width: 720 },
  // "Club News" resource card — the club's genuine news photo.
  { src: "news2.jpg", out: "resources/club-news.jpg", width: 720 },
  // NOTE: resources/library.jpg is a user-supplied photo (Mauricio Gomes) and
  // is generated separately — intentionally not regenerated here.
];

// Class grid / hub images — fixed 16:10 with subject-aware crop.
// `cropFrac` (0=top … 1=bottom) sets the vertical position of the 16:10 crop
// window for tall sources, used to keep subjects' heads near the top.
const classPhotos = [
  { src: "adult.jpg", out: "classes/adult-classes.jpg" },
  { src: "kids.jpg", out: "classes/kids-classes.jpg" },
  // NOTE: classes/beginners-classes.jpg is a user-supplied photo and is
  // generated separately — intentionally not regenerated here.
  { src: "nogi2.jpg", out: "classes/no-gi-classes.jpg" },
  { src: "womens.jpg", out: "classes/womens-classes.jpg", cropFrac: 0.28 },
  { src: "news1.jpg", out: "classes/open-mats.jpg" },
  { src: "tnt.jpg", out: "classes/tnt.jpg" },
  // Centre crop keeps the coach's face and the kick in frame (attention drops low).
  { src: "muaythai.jpg", out: "classes/muay-thai-classes.jpg", position: "centre" },
  { src: "masterclass.jpg", out: "classes/seminars-events.jpg" },
];

async function ensureDir(file) {
  await mkdir(path.dirname(file), { recursive: true });
}

async function processWidth({ src, out, width, quality = 80 }) {
  const outPath = path.join(OUT, out);
  await ensureDir(outPath);
  const info = await sharp(path.join(SRC, src))
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true, progressive: true })
    .toFile(outPath);
  console.log(`photo  ${out.padEnd(34)} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}

const CW = 1000;
const CH = 625;

async function processClass({ src, out, position, cropFrac }) {
  const outPath = path.join(OUT, out);
  await ensureDir(outPath);

  let pipeline;
  if (typeof cropFrac === "number") {
    // Fit to width, then extract a 16:10 band at the requested vertical offset.
    const wide = await sharp(path.join(SRC, src)).rotate().resize({ width: CW }).toBuffer();
    const meta = await sharp(wide).metadata();
    const top = Math.max(0, Math.round((meta.height - CH) * cropFrac));
    pipeline = sharp(wide).extract({ left: 0, top, width: CW, height: CH });
  } else {
    pipeline = sharp(path.join(SRC, src))
      .rotate()
      .resize(CW, CH, { fit: "cover", position: position || sharp.strategy.attention });
  }

  const info = await pipeline
    .jpeg({ quality: 80, mozjpeg: true, progressive: true })
    .toFile(outPath);
  console.log(`class  ${out.padEnd(34)} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}

async function headerLogo() {
  const outPath = path.join(OUT, "logo.png");
  await ensureDir(outPath);
  const info = await sharp(path.join(SRC, "logo-small.png"))
    .resize({ height: 120, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`logo   logo.png                          ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}

async function logoMark() {
  const outPath = path.join(OUT, "logo-mark.png");
  await ensureDir(outPath);
  const info = await sharp(path.join(SRC, "logo.png"))
    .resize({ width: 512, height: 512, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`logo   logo-mark.png                     ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}

const PW = 640;
const PH = 800;

async function processPortrait(entry) {
  const file = entry.includes(":") ? entry.split(":")[1] : entry;
  const outPath = path.join(OUT, "instructors", `${file}.jpg`);
  await ensureDir(outPath);
  const info = await sharp(path.join(INSTR_SRC, `${file}.jpg`))
    .rotate()
    .resize(PW, PH, { fit: "cover", position: "top" })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(outPath);
  console.log(`team   ${("instructors/" + file + ".jpg").padEnd(34)} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}

async function main() {
  for (const p of widthPhotos) await processWidth(p);
  for (const p of classPhotos) await processClass(p);
  for (const p of instructorPhotos) await processPortrait(p);
  await headerLogo();
  await logoMark();
  console.log("\nDone. Output ->", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
