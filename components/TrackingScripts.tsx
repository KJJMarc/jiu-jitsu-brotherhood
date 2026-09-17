"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  readConsent,
  type ConsentRecord,
} from "@/lib/cookies";
import {
  isGoogleTagConfigured,
  isMetaPixelConfigured,
  type TrackingSettings,
} from "@/lib/tracking-settings";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type Props = {
  settings: TrackingSettings;
};

/**
 * Install the Google-recommended gtag stub.
 * Must push the Arguments object — a rest-parameter Array is ignored by gtag.js
 * when draining the queue, so /g/collect never fires.
 */
function ensureGtagStub(): void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === "function") return;
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
}

/**
 * Consent-gated Meta Pixel + Google tag loader for the public marketing site.
 * Never mounts in admin layouts.
 */
export default function TrackingScripts({ settings }: Props) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentRecord | null>(null);

  useEffect(() => {
    setConsent(readConsent());
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<ConsentRecord>).detail;
      setConsent(detail ?? readConsent());
    };
    window.addEventListener("kjj-consent-change", onChange);
    return () => window.removeEventListener("kjj-consent-change", onChange);
  }, []);

  const metaOk = isMetaPixelConfigured(settings);
  const googleOk = isGoogleTagConfigured(settings);
  const allowMarketing = Boolean(consent?.marketing);
  const allowAnalytics = Boolean(consent?.analytics);

  const loadMeta = metaOk && allowMarketing;
  const loadGoogle =
    googleOk &&
    (allowMarketing ||
      (allowAnalytics &&
        Boolean(settings.google_tag_id?.trim().toUpperCase().startsWith("G-"))));

  const metaId = settings.meta_pixel_id?.trim() ?? "";
  const googleId = settings.google_tag_id?.trim() ?? "";

  const metaInit = useMemo(
    () =>
      loadMeta
        ? `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${metaId}');fbq('track','PageView');`
        : "",
    [loadMeta, metaId],
  );

  useEffect(() => {
    if (!loadGoogle || !googleId) return;
    ensureGtagStub();
    window.gtag!("js", new Date());
    // Default send_page_view stays enabled; page_path covers App Router navigations.
    window.gtag!("config", googleId, { page_path: pathname });
  }, [loadGoogle, googleId, pathname]);

  if (!loadMeta && !loadGoogle) return null;

  return (
    <>
      {loadMeta ? (
        <Script id="kjj-meta-pixel" strategy="afterInteractive">
          {metaInit}
        </Script>
      ) : null}
      {loadGoogle ? (
        <Script
          id="kjj-google-gtag"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleId)}`}
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}
