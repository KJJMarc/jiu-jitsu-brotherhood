import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import Welcome from "@/components/home/Welcome";
import Classes from "@/components/home/Classes";
import Testimonials from "@/components/home/Testimonials";
import Resources from "@/components/home/Resources";
import FinalCta from "@/components/home/FinalCta";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  // Home uses the default title (no template) and the canonical root URL.
  title: `${site.name} | Brazilian Jiu Jitsu in Kingston upon Thames`,
  description: site.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Welcome />
      <Classes />
      <Testimonials />
      <Resources />
      <FinalCta />
    </>
  );
}
