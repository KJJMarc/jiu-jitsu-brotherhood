"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { uploadArticleFeaturedImage } from "@/app/admin/(console)/articles/upload-image";
import {
  ARTICLE_IMAGE_ACCEPT,
  ARTICLE_IMAGE_MAX_BYTES,
  articleImageValidationError,
} from "@/lib/admin/article-image-upload";
import styles from "@/app/admin/admin.module.css";

export default function FeaturedImageField({
  initialPath,
  initialAlt,
  imageOptions,
}: {
  initialPath: string;
  initialAlt: string;
  imageOptions: string[];
}) {
  const [path, setPath] = useState(initialPath);
  const [alt, setAlt] = useState(initialAlt);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      imageOptions.filter((src) =>
        src.toLowerCase().includes(filter.trim().toLowerCase()),
      ),
    [filter, imageOptions],
  );

  const previewSrc = localPreview || path;

  function clearLocalPreview() {
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function selectLibraryPath(src: string) {
    clearLocalPreview();
    setPath(src);
    setError(null);
    setOpen(false);
  }

  function removeImage() {
    clearLocalPreview();
    setPath("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    const validationError = articleImageValidationError(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    clearLocalPreview();
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadArticleFeaturedImage(formData);
      if (!result.ok) {
        clearLocalPreview();
        setError(result.error);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setPath(result.publicUrl);
      clearLocalPreview();
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  return (
    <div className={styles.featuredImageField}>
      <input type="hidden" name="image_path" value={path} />

      <div className={styles.featuredImagePreview}>
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt={alt || ""} />
        ) : (
          <div className={styles.featuredImageEmpty}>No image selected</div>
        )}
      </div>

      <div
        className={`${styles.imageDropzone}${dragOver ? ` ${styles.imageDropzoneActive}` : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <p>
          {pending
            ? "Uploading…"
            : "Drag and drop an image here, or use Upload image."}
        </p>
        <p className={styles.fieldHint}>
          JPG, JPEG, PNG, or WebP · max{" "}
          {Math.round(ARTICLE_IMAGE_MAX_BYTES / (1024 * 1024))} MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ARTICLE_IMAGE_ACCEPT}
          className={styles.srOnly}
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="article-image-path">Image path / URL</label>
        <input
          id="article-image-path"
          type="text"
          value={path}
          onChange={(event) => {
            clearLocalPreview();
            setPath(event.target.value);
            setError(null);
          }}
          placeholder="/images/news/example.jpg"
        />
        <p className={styles.fieldHint}>
          Existing <code>/images/news/…</code> paths stay valid. New uploads
          save a Supabase Storage public URL into <code>image_path</code>{" "}
          (public bucket — URLs work even while the article is a draft).
        </p>
      </div>

      <div className={styles.field}>
        <label htmlFor="article-image-alt">Image alt text</label>
        <input
          id="article-image-alt"
          name="image_alt"
          type="text"
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
        />
      </div>

      <div className={styles.featuredImageActions}>
        <button
          type="button"
          className={styles.secondaryButtonCompact}
          disabled={pending}
          onClick={() => fileInputRef.current?.click()}
        >
          {path ? "Replace image" : "Upload image"}
        </button>
        <button
          type="button"
          className={styles.secondaryButtonCompact}
          disabled={pending}
          onClick={() => {
            setFilter("");
            setOpen(true);
          }}
        >
          Choose from library
        </button>
        {path || localPreview ? (
          <button
            type="button"
            className={styles.textButton}
            disabled={pending}
            onClick={removeImage}
          >
            Remove
          </button>
        ) : null}
      </div>

      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
      {pending ? (
        <p className={styles.fieldHint} aria-live="polite">
          Uploading to Supabase Storage…
        </p>
      ) : null}

      {open ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Choose featured image"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>News image library</h3>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Filter images"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
            <div className={styles.imageLibraryGrid}>
              {filtered.map((src) => (
                <button
                  key={src}
                  type="button"
                  className={styles.imageLibraryItem}
                  onClick={() => selectLibraryPath(src)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                  <span>{src.replace("/images/news/", "")}</span>
                </button>
              ))}
              {filtered.length === 0 ? (
                <p className={styles.placeholderNote}>No images match.</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
