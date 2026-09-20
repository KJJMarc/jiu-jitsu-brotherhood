"use client";

import { useRef, useState, useTransition } from "react";
import { uploadContentFeaturedImage } from "@/app/admin/(console)/content/upload-image";
import {
  CONTENT_IMAGE_ACCEPT,
  CONTENT_IMAGE_MAX_BYTES,
  contentImageValidationError,
} from "@/lib/admin/content-image-upload";
import styles from "@/app/admin/admin.module.css";

export default function ContentFeaturedImageField({
  initialUrl,
  initialAlt,
}: {
  initialUrl: string;
  initialAlt: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [alt, setAlt] = useState(initialAlt);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewSrc = localPreview || url;

  function clearLocalPreview() {
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function removeImage() {
    clearLocalPreview();
    setUrl("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    const validationError = contentImageValidationError(file);
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
      const result = await uploadContentFeaturedImage(formData);
      if (!result.ok) {
        clearLocalPreview();
        setError(result.error);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setUrl(result.publicUrl);
      clearLocalPreview();
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  return (
    <div className={styles.featuredImageField}>
      <input type="hidden" name="featured_image_url" value={url} />

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
          {Math.round(CONTENT_IMAGE_MAX_BYTES / (1024 * 1024))} MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={CONTENT_IMAGE_ACCEPT}
          className={styles.srOnly}
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="content-featured-image-url">Image URL</label>
        <input
          id="content-featured-image-url"
          type="url"
          value={url}
          onChange={(event) => {
            clearLocalPreview();
            setUrl(event.target.value);
            setError(null);
          }}
          placeholder="https://…/image.jpg"
        />
        <p className={styles.fieldHint}>
          Uploads go to the <code>content-images</code> bucket. You can also
          paste an existing Shopify CDN or Supabase URL.
        </p>
      </div>

      <div className={styles.field}>
        <label htmlFor="content-featured-image-alt">Image alt text</label>
        <input
          id="content-featured-image-alt"
          name="featured_image_alt"
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
          {url ? "Replace image" : "Upload image"}
        </button>
        {url || localPreview ? (
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
    </div>
  );
}
