/**
 * Temporary homepage prototype content - second design pass.
 *
 * Sourced from the private Shopify audit / live JJB pages for visual
 * presentation only. Do not write these rows to Supabase.
 *
 * Image ratio notes (source):
 * - Article / technique thumbs: 1280×720 (16:9) - preserve with contain
 * - Beginner's Guide cover: 1920×1440 (4:3 landscape mockup)
 * - How to Suck Less cover: 1104×1439 (~0.767 portrait mockup)
 * - Hero photo: 1024×683 (~3:2)
 * - Oli portrait crop: from foundation composite (source left undisturbed)
 * - Summer fundraiser: 630×840 (3:4)
 * - Shop product shots: 1080×1080 (1:1)
 */

export type HomeImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  position?: string;
};

export type HomeArticle = {
  title: string;
  href: string;
  image: HomeImage;
  excerpt?: string;
  /** ISO date YYYY-MM-DD from Shopify publishedAt */
  publishedAt: string;
};

export type HomeTechnique = {
  title: string;
  href: string;
  image: HomeImage;
  excerpt?: string;
  publishedAt: string;
};

export type HomeProduct = {
  title: string;
  href: string;
  image: HomeImage;
  priceLabel?: string;
};

export type HomeResource = {
  title: string;
  href: string;
  description: string;
  image: HomeImage;
};

/** GBP display from whole pounds — avoids encoding surprises in source files. */
export function formatGbp(pounds: number): string {
  return `\u00A3${pounds}`;
}

/** Local JJB assets (copied from Marc supply / live Shopify CDN). */
export const localAssets = {
  hero: {
    src: "/images/jjb/hero-mixed-levels-L1110252-108.jpg",
    alt: "A Jiu Jitsu class on the mats - a seated practitioner in the foreground with the room training behind him",
    width: 1024,
    height: 683,
    position: "68% 42%",
  },
  historyPhoto: {
    src: "/images/jjb/about-mixed-levels.jpg",
    alt: "Jiu Jitsu practitioners training together",
    width: 4184,
    height: 2792,
    position: "center 35%",
    credit: "Photography courtesy of Alt Option Productions",
  },
  beginnersGuide: {
    src: "/images/jjb/beginners-guide-cover.png",
    alt: "Cover of A Beginner's Guide to Brazilian Jiu Jitsu by Marc Barton",
    width: 1291,
    height: 1400,
  },
  suckLess: {
    src: "/images/jjb/how-to-suck-less-cover.png",
    alt: "Cover of How to Suck Less at Jiu Jitsu by Marc Barton and Leigh Remedios",
    width: 1291,
    height: 1400,
  },
  oliPortrait: {
    src: "/images/jjb/oli-portrait-v2.png",
    alt: "Oliver Geddes in a blue gi",
    width: 707,
    height: 818,
  },
  summer: {
    src: "/images/jjb/summer-fundraiser.png",
    alt: "Fundraising image supporting Summer and her family",
    width: 630,
    height: 840,
  },
} as const;

/** Shopify CDN article/technique/product images - temporary until Storage migration. */
export const homeArticles: HomeArticle[] = [
  {
    title: "Why Every Generation Thinks Jiu Jitsu Has Changed for the Worse",
    href: "/blogs/blog/why-every-generation-thinks-jiu-jitsu-has-changed-for-the-worse",
    publishedAt: "2026-07-10",
    excerpt:
      "Why does every generation think Jiu Jitsu has changed for the worse? A thoughtful look at how the art has evolved through the decades.",
    image: {
      src: "https://cdn.shopify.com/s/files/1/0363/5125/articles/Which_Era.png?v=1783674181",
      alt: "Artwork for an article about how Jiu Jitsu changes across generations",
      width: 1280,
      height: 720,
    },
  },
  {
    title: "The Surprising Health Benefits of Strength Training",
    href: "/blogs/blog/the-surprising-health-benefits-of-strength-training",
    publishedAt: "2026-06-13",
    image: {
      src: "https://cdn.shopify.com/s/files/1/0363/5125/articles/Copy_of_DLR_Sit_Up_Sweeps_10afbde8-40b9-46ed-9e91-8d69453d21ae.png?v=1781364111",
      alt: "Artwork for an article on strength training for Jiu Jitsu",
      width: 1280,
      height: 720,
    },
  },
  {
    title: "Why You Should Compete at Least Once in BJJ",
    href: "/blogs/blog/why-you-should-compete-at-least-once-in-bjj",
    publishedAt: "2026-05-17",
    excerpt:
      "Why every practitioner should feel competition at least once - whatever their age, experience or ambition.",
    image: {
      src: "https://cdn.shopify.com/s/files/1/0363/5125/articles/Copy_of_Copy_of_Lape_Gubber_Thumb_b201b494-77a1-4fc0-a7a0-6a416867d6b2.png?v=1779099973",
      alt: "Artwork for an article about competing in BJJ",
      width: 1280,
      height: 720,
    },
  },
  {
    title:
      "Should You Train BJJ When You're Sick? (Doctor and Black Belt Explains)",
    href: "/blogs/blog/should-you-train-bjj-when-youre-sick-doctor-and-black-belt-explains",
    publishedAt: "2026-05-12",
    excerpt:
      "A doctor and black belt on the risks, when to rest, and how to return safely after illness.",
    image: {
      src: "https://cdn.shopify.com/s/files/1/0363/5125/articles/Should_You_Train_Sick_Thumbnail.png?v=1778572236",
      alt: "Artwork for an article about training when sick",
      width: 1280,
      height: 720,
    },
  },
];

export const homeTechniques: HomeTechnique[] = [
  {
    title: "Oliver Geddes - His Go-To Half Guard Pass",
    href: "/blogs/techniques/oliver-geddes-his-go-to-half-guard-pass",
    publishedAt: "2026-08-26",
    excerpt:
      "Head-down underhook half guard passing - pressure, position and control.",
    image: {
      src: "https://cdn.shopify.com/s/files/1/0363/5125/articles/Head_Down_Underhook_Half_Guard_Pass.png?v=1787767071",
      alt: "Technique thumbnail: Oliver Geddes half guard pass",
      width: 1280,
      height: 720,
    },
  },
  {
    title: "Omoplata Roll Escape Counter | Maintaining Control",
    href: "/blogs/techniques/omoplata-roll-escape-counter-maintaining-control",
    publishedAt: "2026-07-29",
    excerpt:
      "Counter the shoulder-roll defence, keep the omoplata and move to side control.",
    image: {
      src: "https://cdn.shopify.com/s/files/1/0363/5125/articles/Copy_of_Copy_of_Copy_of_DLR_Sit_Up_Sweeps_a575b03e-c88d-45d5-8c1b-9299c93a417b.png?v=1785340847",
      alt: "Technique thumbnail: omoplata roll escape counter",
      width: 1280,
      height: 720,
    },
  },
  {
    title: "Closed Guard Omoplata Fundamentals",
    href: "/blogs/techniques/closed-guard-omoplata-fundamentals",
    publishedAt: "2026-06-24",
    image: {
      src: "https://cdn.shopify.com/s/files/1/0363/5125/articles/Fix_Your_Omoplata.png?v=1782295874",
      alt: "Technique thumbnail: closed guard omoplata fundamentals",
      width: 1280,
      height: 720,
    },
  },
];

export const homeProducts: HomeProduct[] = [
  {
    title: "The Astrum Gi",
    href: "/products/astrum-gi",
    priceLabel: formatGbp(115),
    image: {
      src: "/images/jjb/shop/astrum-gi.png",
      alt: "The Astrum Gi in navy with yellow embroidery",
      width: 1080,
      height: 1080,
    },
  },
  {
    title: "The Gentle Art Rashguard",
    href: "/products/the-gentle-art-rashguard",
    priceLabel: formatGbp(38),
    image: {
      src: "/images/jjb/shop/gentle-art-rashguard.png",
      alt: "The Gentle Art rashguard",
      width: 1080,
      height: 1080,
    },
  },
  {
    title: "Enso 4.0 Gi (Black)",
    href: "/products/enso-4-0-gi-black",
    priceLabel: formatGbp(100),
    image: {
      src: "/images/jjb/shop/enso-4-0-black.png",
      alt: "Enso 4.0 Gi in black",
      width: 1080,
      height: 1080,
    },
  },
];

export const homeFreeResources: HomeResource[] = [
  {
    title: "Beginner's Guide to BJJ",
    href: "/pages/beginners-guide-to-bjj-signup",
    description:
      "Practical advice for your first months on the mats - what to expect, what to learn and how to get started.",
    image: localAssets.beginnersGuide,
  },
  {
    title: "How to Suck Less at Jiu Jitsu",
    href: "/pages/how-to-suck-less-at-jiu-jitsu",
    description:
      "101 practical tips to help you get better at Jiu Jitsu - learned the hard way and shared from the mats.",
    image: localAssets.suckLess,
  },
];

export function formatUkDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  if (!y || !m || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
}
