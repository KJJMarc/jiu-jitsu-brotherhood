import type { Metadata } from "next";
import { site } from "@/lib/site";
import {
  homeArticles,
  homeFreeResources,
  homeProducts,
  homeTechniques,
} from "@/lib/home/prototype";
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

export default function HomePage() {
  return (
    <div className={styles.homePage}>
      <HomeHero />
      <LatestArticles articles={homeArticles} />
      <Since2007 />
      <HomeTechniques techniques={homeTechniques} />
      <FreeStuff resources={homeFreeResources} />
      <OliverGeddes />
      <SummersJourney />
      <ShopPreview products={homeProducts} />
      <OuroborosBand />
      <NewsletterBand />
    </div>
  );
}
