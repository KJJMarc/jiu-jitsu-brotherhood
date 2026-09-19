import FreeGuideLanding from "@/components/jjb-free-guides/FreeGuideLanding";
import { localAssets } from "@/lib/home/prototype";

const cover = localAssets.beginnersGuide;

/**
 * Highlights condensed from the live Beginner's Guide landing
 * (100+ pages, first classes, starting right, academy/gear, positions,
 * nearly two decades on the mats).
 */
const HIGHLIGHTS = [
  "100+ pages of beginner-focused information",
  "What to expect in your first classes",
  "Practical advice for starting BJJ the right way",
  "How to choose the right academy and gear",
  "Key positions and principles every beginner should know",
  "Tips drawn from nearly two decades on the mats",
] as const;

/**
 * Below-the-fold themes expand on why the guide helps — not a repeat of
 * the hero bullets. Faithful to live-page themes (first classes, foundations,
 * academy/gear/consistency).
 */
const THEMES = [
  {
    title: "Getting started",
    body: "What to expect from your first classes and how to approach those confusing early weeks.",
  },
  {
    title: "Building the foundations",
    body: "The positions, principles and habits that give beginners something solid to build on.",
  },
  {
    title: "Training smarter",
    body: "Practical guidance on choosing an academy, getting the right gear and staying consistent.",
  },
] as const;

/**
 * Dedicated Beginner's Guide landing — preserves
 * /pages/beginners-guide-to-bjj-signup. MailerLite form n2l0c2 / mlb2-1721794.
 */
export default function JjBeginnersGuidePage() {
  return (
    <FreeGuideLanding
      landing="beginnersGuide"
      eyebrow="Free Beginner's Guide"
      title="Starting Brazilian Jiu Jitsu?"
      titleId="beginners-guide-heading"
      subhead="Get the guide I wish I'd had when I started."
      lead="Learning Jiu Jitsu can feel overwhelming at first. There's a lot to take in — the language, the techniques, even how to move. This free guide is designed to make those early steps easier."
      highlights={HIGHLIGHTS}
      cover={cover}
      attribution="Marc Barton"
      themesEyebrow="What's inside"
      themesHeading="Everything you need to find your feet"
      themesHeadingId="whats-inside-heading"
      themes={THEMES}
      finalHeading="Ready to get started?"
      finalHeadingId="ready-heading"
      finalLead="Enter your email and we'll send you the free Beginner's Guide."
      heroSignupId="beginners-guide-signup"
      footerSignupId="beginners-guide-signup-footer"
    />
  );
}
