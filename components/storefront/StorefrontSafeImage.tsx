"use client";

import { useState } from "react";
import styles from "@/components/storefront/storefront.module.css";

/**
 * Product media with a graceful placeholder when the URL is missing or broken.
 */
export default function StorefrontSafeImage({
  src,
  alt,
  className,
  placeholderClassName,
  placeholderLabel = "No image",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  placeholderLabel?: string;
}) {
  const [broken, setBroken] = useState(false);
  const showPlaceholder = !src || broken;

  if (showPlaceholder) {
    return (
      <div className={placeholderClassName ?? styles.cardPlaceholder}>
        {placeholderLabel}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setBroken(true)}
    />
  );
}
