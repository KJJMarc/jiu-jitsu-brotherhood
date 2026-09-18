"use client";

import FreeGuideSignupForm from "@/components/jjb-free-guides/FreeGuideSignupForm";

type Props = {
  anchorId?: string;
  variant?: "hero" | "footer";
  primary?: boolean;
};

/** Beginner's Guide MailerLite form (n2l0c2 / mlb2-1721794). */
export default function BeginnersGuideSignupForm({
  anchorId = "beginners-guide-signup",
  variant = "hero",
  primary = false,
}: Props) {
  return (
    <FreeGuideSignupForm
      landing="beginnersGuide"
      anchorId={anchorId}
      variant={variant}
      primary={primary}
    />
  );
}
