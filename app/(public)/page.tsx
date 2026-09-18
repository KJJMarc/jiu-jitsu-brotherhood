import type { Metadata } from "next";
import { site } from "@/lib/site";
import {
  homeArticles,
  homeFreeResources,
  homeProducts,
  homeTechniques,
} from "@/lib/home/prototype";
import {
  BELT_SYSTEM_SEO_DESCRIPTION,
  contentToHomeArticle,
} from "@/lib/home/from-contents";
import {
  listLatestPublishedArticles,
  listLatestPublishedTechniques,
} from "@/lib/content/public.server";
import HomeHero from "@/components/jjb-home/HomeHero";
import LatestArticles from "@/components/jjb-home/LatestArticles";
import Since2007 from "@/components/jjb-home/Since2007";
import HomeTechniques from "@/components/jjb-home/HomeTechniques";
import FreeStuff from "@/components/jjb-home/FreeStuff";
import OliverGeddes from "@/components/jjb-home/OliverGeddes";
import SummersJourney from "@/components/jjb-home/SummersJourney";
import ShopPreview from "@/components/jjb-home/ShopPreview";
import OuroborosBand from "@/components/jjb-home/OuroborosBand";
import NewsletterBand from "@/components/jjb-home/NewsletterBand";
import styles from "@/components/jjb-home/jjb-home.module.css";

export const metadata: Metadata = {
  title: {
    absolute: site.name,
  },
  description: site.description,
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [liveArticles, liveTechniques] = await Promise.all([
    listLatestPublishedArticles(5),
    listLatestPublishedTechniques(3),
  ]);

  const articles =
    liveArticles.length > 0
      ? liveArticles.map((row) => {
          const mapped = contentToHomeArticle(row);
          if (row.handle === "progression-the-belt-system") {
            return {
              ...mapped,
              excerpt: BELT_SYSTEM_SEO_DESCRIPTION,
            };
          }
          return mapped;
        })
      : homeArticles;

  const techniques =
    liveTechniques.length > 0
      ? liveTechniques.map(contentToHomeArticle)
      : homeTechniques;

  return (
    <div className={styles.homePage}>
      <HomeHero />
      <LatestArticles articles={articles} />
      <Since2007 />
      <HomeTechniques techniques={techniques} />
      <FreeStuff resources={homeFreeResources} />
      <OliverGeddes />
      <SummersJourney />
      <ShopPreview products={homeProducts} />
      <OuroborosBand />
      <NewsletterBand />
    </div>
  );
}
