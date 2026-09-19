import FreeGuideLanding from "@/components/jjb-free-guides/FreeGuideLanding";
import { localAssets } from "@/lib/home/prototype";

const cover = localAssets.suckLess;

/**
 * Highlights condensed from the live How to Suck Less landing while
 * preserving the verified facts (101 tips, two black belts, 60+ years
 * combined experience, mindset, training, foundations, plateaus/injuries,
 * lifestyle).
 */
const HIGHLIGHTS = [
  "101 practical tips from two black belts",
  "Over 60 years of combined martial arts experience",
  "Build the right mindset and avoid common traps",
  "Train smarter and make better use of mat time",
  "Strengthen the technical foundations that support long-term progress",
  "Deal with plateaus, injuries and burnout — plus lifestyle habits that keep you progressing",
] as const;

/**
 * Below-the-fold themes expand on why the guide helps — not a repeat of
 * the hero bullets.
 */
const THEMES = [
  {
    title: "Train smarter",
    body: "Making better use of your mat time and avoiding common training mistakes.",
  },
  {
    title: "Keep progressing",
    body: "Mindset, plateaus, motivation, injuries and burnout — while maintaining momentum.",
  },
  {
    title: "Build for the long term",
    body: "Technical foundations and lifestyle habits that support continued progress.",
  },
] as const;

/**
 * Dedicated How to Suck Less landing — preserves
 * /pages/how-to-suck-less-at-jiu-jitsu. MailerLite form a1f8n6 / mlb2-1722026.
 */
export default function JjSuckLessPage() {
  return (
    <FreeGuideLanding
      landing="suckLess"
      eyebrow="Free Jiu Jitsu Guide"
      title="How to Suck Less at Jiu Jitsu"
      titleId="suck-less-heading"
      subhead="101 tips that actually help."
      lead="Jiu Jitsu is tough. Progress can feel slow, and it's easy to get lost or frustrated. This free guide brings together 101 practical tips you can use to train smarter, keep progressing and get more from your time on the mats."
      highlights={HIGHLIGHTS}
      cover={cover}
      attribution="Marc Barton & Leigh Remedios"
      themesEyebrow="101 Practical Tips"
      themesHeading="Small changes. Better Jiu Jitsu."
      themesHeadingId="tips-inside-heading"
      themes={THEMES}
      finalHeading="Ready to suck less?"
      finalHeadingId="ready-suck-less"
      finalLead="Enter your email and we'll send you the free guide."
      heroSignupId="suck-less-signup"
      footerSignupId="suck-less-signup-footer"
    />
  );
}
