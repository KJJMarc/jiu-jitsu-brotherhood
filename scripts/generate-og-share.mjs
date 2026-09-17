/**
 * Build the site-wide Open Graph / Twitter share image (1200×630).
 *
 * Uses the homepage hero photograph with the official KJJ wordmark logo
 * composited in the bottom-right on a soft white plate for contrast.
 *
 * Usage: node scripts/generate-og-share.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HERO = path.join(ROOT, "public/images/hero.jpg");
const LOGO = path.join(ROOT, "public/images/logo.png");
const OUT = path.join(ROOT, "public/images/og-share.jpg");

const W = 1200;
const H = 630;

async function main() {
  const heroMeta = await sharp(HERO).metadata();
  const cropH = Math.round(heroMeta.width / (W / H));
  // Bias the crop downward so the mats action stays in the safe centre.
  const top = Math.min(
    Math.max(0, Math.round((heroMeta.height - cropH) * 0.62)),
    heroMeta.height - cropH,
  );

  const base = await sharp(HERO)
    .extract({ left: 0, top, width: heroMeta.width, height: cropH })
    .resize(W, H, { fit: "fill" })
    .toBuffer();

  const logoH = 96;
  const logo = await sharp(LOGO)
    .resize({ height: logoH })
    .png()
    .toBuffer({ resolveWithObject: true });

  const pad = 48;
  const platePadX = 22;
  const platePadY = 16;
  const plateW = logo.info.width + platePadX * 2;
  const plateH = logoH + platePadY * 2;
  const radius = 18;
  const plateLeft = W - pad - plateW;
  const plateTop = H - pad - plateH;

  const plateSvg = Buffer.from(
    `<svg width="${plateW}" height="${plateH}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${plateW}" height="${plateH}" rx="${radius}" ry="${radius}"
        fill="rgba(255,255,255,0.92)"/>
    </svg>`,
  );

  const info = await sharp(base)
    .composite([
      { input: plateSvg, left: plateLeft, top: plateTop },
      {
        input: logo.data,
        left: plateLeft + platePadX,
        top: plateTop + platePadY,
      },
    ])
    .jpeg({
      quality: 86,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: "4:2:0",
    })
    .toFile(OUT);

  console.log(
    `og-share  ${path.relative(ROOT, OUT)}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
