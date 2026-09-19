import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentDocument from "@/components/content/ContentDocument";
import JjAboutPage from "@/components/jjb-about/JjAboutPage";
import JjBeginnersGuidePage from "@/components/jjb-beginners-guide/JjBeginnersGuidePage";
import JjClubNetworkPage from "@/components/jjb-club-network/JjClubNetworkPage";
import JjContactPage from "@/components/jjb-contact/JjContactPage";
import JjLegalPageView from "@/components/jjb-legal/JjLegalPageView";
import PastEventsIndex from "@/components/jjb-past-events/PastEventsIndex";
import JjSuckLessPage from "@/components/jjb-suck-less/JjSuckLessPage";
import RoutePlaceholder from "@/components/RoutePlaceholder";
import { canonicalAlternate } from "@/lib/canonical";
import { getJjLegalPage } from "@/lib/jjb-legal/pages";
import { isPreservedPath } from "@/lib/migration/resolve";
import {
  getPublishedPageByHandle,
  listPublishedPastEvents,
} from "@/lib/content/public.server";
import { site } from "@/lib/site";

type Props = { params: Promise<{ handle: string }> };

function pagePath(handle: string): string {
  return `/pages/${handle}`;
}

const ABOUT_DESCRIPTION =
  "Jiu Jitsu Brotherhood was created in 2007 from a simple idea: that Jiu Jitsu gets better when knowledge is shared.";

const CONTACT_DESCRIPTION =
  "Questions about Jiu Jitsu Brotherhood, our articles, resources, shop or club network? Send us a message.";

const CLUB_NETWORK_DESCRIPTION =
  "A friendly international collaboration of independent Jiu Jitsu academies — not an affiliation, grading organisation or competition team.";

const PAST_EVENTS_DESCRIPTION =
  "Archive of Jiu Jitsu Brotherhood Club Network seminars, competitions and early network history.";

const BEGINNERS_GUIDE_HANDLE = "beginners-guide-to-bjj-signup";
const BEGINNERS_GUIDE_TITLE = "Beginner's Guide to Brazilian Jiu Jitsu";
const BEGINNERS_GUIDE_DESCRIPTION =
  "Free practical advice for starting Brazilian Jiu Jitsu — what to expect from your first class, what to learn early on, and how to make progress on the mats.";

/** Shopify SEO fallbacks for the Suck Less free-guide landing. */
const SUCK_LESS_HANDLE = "how-to-suck-less-at-jiu-jitsu";
const SUCK_LESS_TITLE = "How to Suck Less at Jiu Jitsu";
const SUCK_LESS_DESCRIPTION =
  "Download our free guide How to Suck Less at Jiu Jitsu and get 101 practical tips to improve your training, mindset, and progress on the mats.";

const CLUB_NETWORK_HANDLE = "jiu-jitsu-brotherhood-club-network";
const PAST_EVENTS_HANDLE = "past-events";
const PRIVACY_HANDLE = "privacy-policy";
const TERMS_HANDLE = "terms-conditions";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const path = pagePath(handle);

  if (handle === PRIVACY_HANDLE) {
    const legal = getJjLegalPage("privacy");
    return {
      title: legal.title,
      description: legal.description,
      alternates: canonicalAlternate(legal.path),
    };
  }

  if (handle === TERMS_HANDLE) {
    const legal = getJjLegalPage("terms");
    return {
      title: legal.title,
      description: legal.description,
      alternates: canonicalAlternate(legal.path),
    };
  }

  if (handle === "about") {
    const content = await getPublishedPageByHandle(handle);
    return {
      title: content?.seo_title?.trim() || "About",
      description: content?.seo_description?.trim() || ABOUT_DESCRIPTION,
      alternates: canonicalAlternate("/pages/about"),
      robots: content?.noindex
        ? { index: false, follow: true }
        : { index: true, follow: true },
      openGraph: {
        title: content?.seo_title?.trim() || `About - ${site.name}`,
        description: content?.seo_description?.trim() || ABOUT_DESCRIPTION,
      },
    };
  }

  if (handle === "contact") {
    const content = await getPublishedPageByHandle(handle);
    return {
      title: content?.seo_title?.trim() || "Contact",
      description: content?.seo_description?.trim() || CONTACT_DESCRIPTION,
      alternates: canonicalAlternate("/pages/contact"),
      robots: content?.noindex
        ? { index: false, follow: true }
        : { index: true, follow: true },
      openGraph: {
        title: content?.seo_title?.trim() || `Contact - ${site.name}`,
        description: content?.seo_description?.trim() || CONTACT_DESCRIPTION,
      },
    };
  }

  if (handle === CLUB_NETWORK_HANDLE) {
    const content = await getPublishedPageByHandle(handle);
    return {
      title: content?.seo_title?.trim() || "Club Network",
      description:
        content?.seo_description?.trim() || CLUB_NETWORK_DESCRIPTION,
      alternates: canonicalAlternate(`/pages/${CLUB_NETWORK_HANDLE}`),
      robots: content?.noindex
        ? { index: false, follow: true }
        : { index: true, follow: true },
      openGraph: {
        title: content?.seo_title?.trim() || `Club Network - ${site.name}`,
        description:
          content?.seo_description?.trim() || CLUB_NETWORK_DESCRIPTION,
      },
    };
  }

  if (handle === PAST_EVENTS_HANDLE) {
    const content = await getPublishedPageByHandle(handle);
    return {
      title: content?.seo_title?.trim() || "Past Events",
      description:
        content?.seo_description?.trim() || PAST_EVENTS_DESCRIPTION,
      alternates: canonicalAlternate(`/pages/${PAST_EVENTS_HANDLE}`),
      robots: content?.noindex
        ? { index: false, follow: true }
        : { index: true, follow: true },
      openGraph: {
        title: content?.seo_title?.trim() || `Past Events - ${site.name}`,
        description:
          content?.seo_description?.trim() || PAST_EVENTS_DESCRIPTION,
      },
    };
  }

  if (handle === BEGINNERS_GUIDE_HANDLE) {
    const content = await getPublishedPageByHandle(handle);
    return {
      title: content?.seo_title?.trim() || BEGINNERS_GUIDE_TITLE,
      description:
        content?.seo_description?.trim() || BEGINNERS_GUIDE_DESCRIPTION,
      alternates: canonicalAlternate(`/pages/${BEGINNERS_GUIDE_HANDLE}`),
      robots: content?.noindex
        ? { index: false, follow: true }
        : { index: true, follow: true },
      openGraph: {
        title:
          content?.seo_title?.trim() ||
          `${BEGINNERS_GUIDE_TITLE} - ${site.name}`,
        description:
          content?.seo_description?.trim() || BEGINNERS_GUIDE_DESCRIPTION,
      },
    };
  }

  if (handle === SUCK_LESS_HANDLE) {
    const content = await getPublishedPageByHandle(handle);
    return {
      title: content?.seo_title?.trim() || SUCK_LESS_TITLE,
      description:
        content?.seo_description?.trim() || SUCK_LESS_DESCRIPTION,
      alternates: canonicalAlternate(`/pages/${SUCK_LESS_HANDLE}`),
      robots: content?.noindex
        ? { index: false, follow: true }
        : { index: true, follow: true },
      openGraph: {
        title:
          content?.seo_title?.trim() || `${SUCK_LESS_TITLE} - ${site.name}`,
        description:
          content?.seo_description?.trim() || SUCK_LESS_DESCRIPTION,
      },
    };
  }

  const content = await getPublishedPageByHandle(handle);

  if (content) {
    return {
      title: content.seo_title?.trim() || content.title,
      description:
        content.seo_description?.trim() || content.excerpt || undefined,
      alternates: canonicalAlternate(content.canonical_path),
      robots: content.noindex
        ? { index: false, follow: true }
        : { index: true, follow: true },
    };
  }

  if (!isPreservedPath(path)) {
    return { robots: { index: false, follow: false } };
  }

  return {
    title: handle.replace(/-/g, " "),
    robots: { index: false, follow: true },
    alternates: canonicalAlternate(path),
  };
}

export default async function ShopifyPageRoute({ params }: Props) {
  const { handle } = await params;
  const path = pagePath(handle);

  if (handle === PRIVACY_HANDLE) {
    return <JjLegalPageView page={getJjLegalPage("privacy")} />;
  }

  if (handle === TERMS_HANDLE) {
    return <JjLegalPageView page={getJjLegalPage("terms")} />;
  }

  if (handle === "about") {
    return <JjAboutPage />;
  }

  if (handle === "contact") {
    return <JjContactPage />;
  }

  if (handle === CLUB_NETWORK_HANDLE) {
    return <JjClubNetworkPage />;
  }

  if (handle === PAST_EVENTS_HANDLE) {
    const events = await listPublishedPastEvents();
    return <PastEventsIndex records={events} />;
  }

  if (handle === BEGINNERS_GUIDE_HANDLE) {
    return <JjBeginnersGuidePage />;
  }

  if (handle === SUCK_LESS_HANDLE) {
    return <JjSuckLessPage />;
  }

  const content = await getPublishedPageByHandle(handle);

  if (content) {
    if (content.canonical_path !== path) notFound();
    return <ContentDocument content={content} />;
  }

  if (!isPreservedPath(path)) notFound();

  return (
    <RoutePlaceholder
      title={handle.replace(/-/g, " ")}
      body="This page is reserved at its historical Shopify URL. Copy is not imported yet."
    />
  );
}
