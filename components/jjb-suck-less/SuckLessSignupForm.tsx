"use client";

import FreeGuideSignupForm from "@/components/jjb-free-guides/FreeGuideSignupForm";

type Props = {
  anchorId?: string;
  variant?: "hero" | "footer";
  primary?: boolean;
};

/** How to Suck Less MailerLite form (a1f8n6 / mlb2-1722026). */
export default function SuckLessSignupForm({
  anchorId = "suck-less-signup",
  variant = "hero",
  primary = false,
}: Props) {
  return (
    <FreeGuideSignupForm
      landing="suckLess"
      anchorId={anchorId}
      variant={variant}
      primary={primary}
    />
  );
}
