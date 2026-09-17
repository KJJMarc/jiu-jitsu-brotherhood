"use client";

import { useMemo, useState } from "react";
import StorefrontSafeImage from "@/components/storefront/StorefrontSafeImage";
import styles from "@/components/storefront/storefront.module.css";
import type { StorefrontImage } from "@/lib/storefront/types";

export default function ProductGallery({
  images,
  title,
}: {
  images: StorefrontImage[];
  title: string;
}) {
  const ordered = useMemo(
    () =>
      [...images].sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        return a.sortOrder - b.sortOrder;
      }),
    [images]
  );

  const [activeId, setActiveId] = useState(ordered[0]?.id ?? "");
  const active =
    ordered.find((img) => img.id === activeId) ?? ordered[0] ?? null;

  if (!active) {
    return (
      <div className={styles.gallery}>
        <div className={styles.galleryMain}>
          <div className={styles.cardPlaceholder}>No images yet</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.galleryMain}>
        <StorefrontSafeImage
          src={active.url}
          alt={active.alt || title}
          placeholderLabel="Image unavailable"
        />
      </div>
      {ordered.length > 1 ? (
        <div className={styles.thumbs} role="list">
          {ordered.map((img) => (
            <button
              key={img.id}
              type="button"
              className={`${styles.thumb} ${
                img.id === active.id ? styles.thumbActive : ""
              }`}
              onClick={() => setActiveId(img.id)}
              aria-label={`View image: ${img.alt || title}`}
              aria-pressed={img.id === active.id}
            >
              <StorefrontSafeImage src={img.url} alt="" placeholderLabel="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
