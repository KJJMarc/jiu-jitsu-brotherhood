import type { Metadata } from "next";
import JjLegalPageView from "@/components/jjb-legal/JjLegalPageView";
import { canonicalAlternate } from "@/lib/canonical";
import { getJjLegalPage } from "@/lib/jjb-legal/pages";

const page = getJjLegalPage("delivery-returns");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: canonicalAlternate(page.path),
};

export default function DeliveryReturnsPage() {
  return <JjLegalPageView page={page} />;
}
