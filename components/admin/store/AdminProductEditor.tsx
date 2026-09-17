"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  adjustStockAction,
  archiveProductAction,
  clearStockReviewAction,
  createProductAction,
  deleteProductAction,
  deleteProductImageAction,
  reorderProductImagesAction,
  setPrimaryProductImageAction,
  updateProductAction,
  type StoreFormState,
} from "@/app/admin/(console)/store/products/actions";
import { uploadProductImage } from "@/app/admin/(console)/store/products/upload-image";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import RichTextEditor from "@/components/admin/rich-text/RichTextEditor";
import {
  ADMIN_ADJUSTABLE_MOVEMENT_TYPES,
  ADMIN_STORE_PRODUCTS_PATH,
  adminStoreProductPreviewPath,
  penceToPoundsString,
  productStatusLabel,
  productTypeLabel,
  slugifyProductTitle,
  variantDisplayName,
  type AdminProductDetail,
  type AdminProductImage,
} from "@/lib/admin/store";
import {
  PRODUCT_IMAGE_ACCEPT,
  productImageValidationError,
} from "@/lib/admin/product-image-upload";
import styles from "@/app/admin/admin.module.css";

type DraftVariant = {
  key: string;
  id?: string;
  sku: string;
  option_name: string;
  option_value: string;
  price_pounds: string;
  track_inventory: boolean;
  is_active: boolean;
  stock_qty: number;
  stock_review_required: boolean;
  /** Blank string = unverified weight (stored as null). */
  weight_grams: string;
  initial_stock_qty: string;
};

const initialState: StoreFormState = { error: null, success: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

function makeDraftVariant(index: number): DraftVariant {
  return {
    key: `new-${index}-${Math.random().toString(36).slice(2, 8)}`,
    sku: "",
    option_name: "Size",
    option_value: index === 0 ? "Default" : "",
    price_pounds: "0.00",
    track_inventory: false,
    is_active: true,
    stock_qty: 0,
    stock_review_required: false,
    weight_grams: "",
    initial_stock_qty: "",
  };
}

function draftsFromProduct(product?: AdminProductDetail): DraftVariant[] {
  if (!product?.variants.length) return [makeDraftVariant(0)];
  return product.variants.map((variant) => ({
    key: variant.id,
    id: variant.id,
    sku: variant.sku ?? "",
    option_name: variant.option_name || "Size",
    option_value: variant.option_value || "",
    price_pounds: penceToPoundsString(variant.price_pence),
    track_inventory: variant.track_inventory,
    is_active: variant.is_active,
    stock_qty: variant.stock_qty,
    stock_review_required: variant.stock_review_required,
    weight_grams:
      variant.weight_grams != null && variant.weight_grams > 0
        ? String(variant.weight_grams)
        : "",
    initial_stock_qty: "",
  }));
}

export default function AdminProductEditor({
  mode,
  product,
}: {
  mode: "create" | "edit";
  product?: AdminProductDetail;
}) {
  const pageTitle = mode === "create" ? "Add product" : "Edit product";
  const pageLead =
    mode === "create"
      ? "Create a draft or active product for the shop catalogue."
      : product
        ? `Update “${product.title}”. Inventory changes are recorded as movements.`
        : "Update product details. Inventory changes are recorded as movements.";
  const saveAction =
    mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction] = useFormState(saveAction, initialState);
  const [archiveState, archiveAction] = useFormState(
    archiveProductAction,
    initialState
  );
  const [deleteState, deleteAction] = useFormState(
    deleteProductAction,
    initialState
  );
  const [stockState, stockAction] = useFormState(
    adjustStockAction,
    initialState
  );
  const [stockReviewState, stockReviewAction] = useFormState(
    clearStockReviewAction,
    initialState
  );
  const [imageState, imageAction] = useFormState(
    deleteProductImageAction,
    initialState
  );
  const [primaryState, primaryAction] = useFormState(
    setPrimaryProductImageAction,
    initialState
  );
  const [, reorderAction] = useFormState(
    reorderProductImagesAction,
    initialState
  );

  const [dirty, setDirty] = useState(false);
  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
  const [variants, setVariants] = useState<DraftVariant[]>(() =>
    draftsFromProduct(product)
  );
  const [images, setImages] = useState<AdminProductImage[]>(
    product?.images ?? []
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadPending, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    setImages(product?.images ?? []);
  }, [product?.images]);

  // Keep draft variants aligned with the server:
  // - when the form is clean, fully resync (picks up new ids after save/revalidate)
  // - when dirty, only refresh stock_qty for existing variant ids (stock adjustments)
  useEffect(() => {
    if (!product) return;
    if (!dirty) {
      setTitle(product.title);
      setSlug(product.slug);
      setVariants(draftsFromProduct(product));
      return;
    }
    setVariants((prev) =>
      prev.map((draft) => {
        if (!draft.id) return draft;
        const server = product.variants.find((v) => v.id === draft.id);
        return server
          ? {
              ...draft,
              stock_qty: server.stock_qty,
              stock_review_required: server.stock_review_required,
            }
          : draft;
      })
    );
  }, [product, dirty]);

  const variantsJson = useMemo(
    () =>
      JSON.stringify(
        variants.map((variant, index) => ({
          id: variant.id,
          sku: variant.sku,
          option_name: variant.option_name,
          option_value: variant.option_value,
          price_pounds: variant.price_pounds,
          track_inventory: variant.track_inventory,
          is_active: variant.is_active,
          sort_order: index,
          weight_grams: variant.weight_grams.trim(),
          initial_stock_qty:
            mode === "create" && variant.track_inventory
              ? variant.initial_stock_qty
              : undefined,
        }))
      ),
    [variants, mode]
  );

  const trackedVariants = (product?.variants ?? []).filter(
    (variant) => variant.track_inventory
  );

  const errorMessage =
    state.error ||
    archiveState.error ||
    deleteState.error ||
    stockState.error ||
    stockReviewState.error ||
    imageState.error ||
    primaryState.error ||
    uploadError;
  const successMessage =
    state.success ||
    archiveState.success ||
    stockState.success ||
    stockReviewState.success ||
    imageState.success ||
    primaryState.success;

  function updateVariant(key: string, patch: Partial<DraftVariant>) {
    setDirty(true);
    setVariants((prev) =>
      prev.map((variant) =>
        variant.key === key ? { ...variant, ...patch } : variant
      )
    );
  }

  function handleFiles(fileList: FileList | null) {
    if (mode !== "edit" || !product || !fileList?.length) return;
    const files = Array.from(fileList);

    for (const file of files) {
      const validationError = productImageValidationError(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }
    }

    startUpload(async () => {
      try {
        for (const file of files) {
          const formData = new FormData();
          formData.set("file", file);
          formData.set("product_id", product.id);
          const result = await uploadProductImage(formData);
          if (!result.ok) {
            setUploadError(result.error);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }
        }
        setUploadError(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed unexpectedly.";
        setUploadError(
          /body exceeded|413|entity too large/i.test(message)
            ? "Image is too large for upload. Please use a JPG/PNG/WebP under 4 MB."
            : message
        );
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

  function moveImage(imageId: string, direction: -1 | 1) {
    if (!product) return;
    const index = images.findIndex((img) => img.id === imageId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= images.length) return;

    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setImages(next);

    const formData = new FormData();
    formData.set("product_id", product.id);
    formData.set("ordered_image_ids", next.map((img) => img.id).join(","));
    reorderAction(formData);
  }

  return (
    <div>
      <form
        className={styles.articleForm}
        action={formAction}
        onInput={() => setDirty(true)}
      >
        {mode === "edit" && product ? (
          <input type="hidden" name="id" value={product.id} />
        ) : null}
        <input type="hidden" name="variants_json" value={variantsJson} />

        <div className={styles.pageActionBar}>
          <SubmitButton
            label={mode === "create" ? "Create product" : "Save product"}
          />
          {mode === "edit" && product ? (
            <Link
              href={adminStoreProductPreviewPath(product.id)}
              className={styles.secondaryButtonCompact}
            >
              Preview product page
            </Link>
          ) : null}
          <Link
            href={ADMIN_STORE_PRODUCTS_PATH}
            className={styles.secondaryButtonCompact}
          >
            Back to products
          </Link>
        </div>

        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>Store</p>
          <h1>{pageTitle}</h1>
          <p className={styles.lead}>{pageLead}</p>
        </header>

        {errorMessage ? (
          <p className={styles.formError} role="alert">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className={styles.formSuccess} role="status">
            {successMessage}
          </p>
        ) : null}

        <AdminFormSection
          title="Basics"
          description="Title, slug, type and status."
        >
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="product-title">Title</label>
              <input
                id="product-title"
                name="title"
                type="text"
                required
                value={title}
                onChange={(event) => {
                  const next = event.target.value;
                  setTitle(next);
                  if (!slugTouched) setSlug(slugifyProductTitle(next));
                }}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="product-slug">Slug</label>
              <input
                id="product-slug"
                name="slug"
                type="text"
                required
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title="Lowercase letters, numbers, and hyphens"
              />
              {product?.shopify_handle ? (
                <p className={styles.fieldHint}>
                  Imported from Shopify handle{" "}
                  <code>{product.shopify_handle}</code> (import key; Shopify
                  store unchanged).
                </p>
              ) : null}
            </div>
            <div className={styles.field}>
              <label htmlFor="product-type">Product type</label>
              <select
                id="product-type"
                name="product_type"
                defaultValue={product?.product_type ?? "physical"}
              >
                <option value="physical">{productTypeLabel("physical")}</option>
                <option value="non_shipping">
                  {productTypeLabel("non_shipping")}
                </option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="product-status">Status</label>
              <select
                id="product-status"
                name="status"
                defaultValue={product?.status ?? "draft"}
              >
                <option value="draft">{productStatusLabel("draft")}</option>
                <option value="active">{productStatusLabel("active")}</option>
                <option value="archived">
                  {productStatusLabel("archived")}
                </option>
              </select>
              <p className={styles.fieldHint}>
                Active products appear on the public shop. Draft and archived
                stay hidden.
              </p>
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection
          title="Description"
          description="Use the existing rich-text editor."
        >
          <RichTextEditor
            name="description_html"
            initialHtml={product?.description_html ?? ""}
            imageOptions={[]}
            placeholder="Describe the product…"
          />
        </AdminFormSection>

        <AdminFormSection
          title="SEO"
          description="Optional overrides for a future storefront."
        >
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="product-seo-title">SEO title</label>
              <input
                id="product-seo-title"
                name="seo_title"
                type="text"
                defaultValue={product?.seo_title ?? ""}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="product-seo-description">SEO description</label>
              <textarea
                id="product-seo-description"
                name="seo_description"
                rows={3}
                defaultValue={product?.seo_description ?? ""}
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection
          title="Variants"
          description="Sizes/SKUs with GBP pricing. Shipping weight is whole grams — leave blank if unverified (never treated as zero). After create, stock changes use inventory movements."
        >
          {product?.product_type === "physical" &&
          product.variants.some(
            (variant) => variant.weight_grams == null || variant.weight_grams <= 0
          ) ? (
            <p className={styles.formError} role="status">
              One or more variants are missing a verified shipping weight. UK
              delivery cannot be calculated for those items until a weight in
              grams is set.
            </p>
          ) : null}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Option</th>
                  <th scope="col">Value</th>
                  <th scope="col">SKU</th>
                  <th scope="col">Price (GBP)</th>
                  <th scope="col">Weight (g)</th>
                  <th scope="col">Track stock</th>
                  <th scope="col">Active</th>
                  <th scope="col">
                    {mode === "create" ? "Initial stock" : "Stock"}
                  </th>
                  <th scope="col">
                    <span className={styles.srOnly}>Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.key}>
                    <td>
                      <input
                        aria-label="Option name"
                        value={variant.option_name}
                        onChange={(event) =>
                          updateVariant(variant.key, {
                            option_name: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Option value"
                        required
                        value={variant.option_value}
                        onChange={(event) =>
                          updateVariant(variant.key, {
                            option_value: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="SKU"
                        value={variant.sku}
                        onChange={(event) =>
                          updateVariant(variant.key, { sku: event.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Price in GBP"
                        inputMode="decimal"
                        required
                        value={variant.price_pounds}
                        onChange={(event) =>
                          updateVariant(variant.key, {
                            price_pounds: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Shipping weight in grams"
                        inputMode="numeric"
                        value={variant.weight_grams}
                        placeholder="—"
                        onChange={(event) =>
                          updateVariant(variant.key, {
                            weight_grams: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        aria-label="Track inventory"
                        checked={variant.track_inventory}
                        onChange={(event) =>
                          updateVariant(variant.key, {
                            track_inventory: event.target.checked,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        aria-label="Variant active"
                        checked={variant.is_active}
                        onChange={(event) =>
                          updateVariant(variant.key, {
                            is_active: event.target.checked,
                          })
                        }
                      />
                    </td>
                    <td>
                      {mode === "create" ? (
                        <input
                          aria-label="Initial stock"
                          inputMode="numeric"
                          disabled={!variant.track_inventory}
                          value={variant.initial_stock_qty}
                          onChange={(event) =>
                            updateVariant(variant.key, {
                              initial_stock_qty: event.target.value,
                            })
                          }
                          placeholder={variant.track_inventory ? "0" : "—"}
                        />
                      ) : (
                        <div>
                          <span className={styles.tableMeta}>
                            {variant.track_inventory ? variant.stock_qty : "—"}
                          </span>
                          {variant.track_inventory &&
                          variant.stock_review_required ? (
                            <div className={styles.badgeSoon}>
                              Needs stock review
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.textButton}
                        disabled={variants.length <= 1}
                        onClick={() => {
                          setDirty(true);
                          setVariants((prev) =>
                            prev.filter((row) => row.key !== variant.key)
                          );
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className={styles.secondaryButtonCompact}
            onClick={() => {
              setDirty(true);
              setVariants((prev) => [...prev, makeDraftVariant(prev.length)]);
            }}
          >
            Add variant
          </button>
        </AdminFormSection>

      </form>

      {mode === "edit" && product ? (
        <>
          <AdminFormSection
            title="Images"
            description="Imported Shopify images appear as external URL references. New uploads go to the product-images Supabase bucket. Removing an external reference only affects this catalogue — Shopify is unchanged."
          >
            <div className={styles.field}>
              <input
                ref={fileInputRef}
                type="file"
                accept={PRODUCT_IMAGE_ACCEPT}
                multiple
                onChange={(event) => handleFiles(event.target.files)}
              />
              <p className={styles.fieldHint}>
                JPG, PNG, or WebP up to 4 MB. You can select multiple files.
                {uploadPending ? " Uploading…" : ""}
              </p>
              {uploadError ? (
                <p className={styles.formError} role="alert">
                  {uploadError}
                </p>
              ) : null}
              {imageState.error ? (
                <p className={styles.formError} role="alert">
                  {imageState.error}
                </p>
              ) : null}
              {imageState.success ? (
                <p className={styles.formSuccess} role="status">
                  {imageState.success}
                </p>
              ) : null}
              {primaryState.error ? (
                <p className={styles.formError} role="alert">
                  {primaryState.error}
                </p>
              ) : null}
            </div>

            {images.length === 0 ? (
              <p className={styles.placeholderNote}>No images yet.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Preview</th>
                      <th scope="col">Source</th>
                      <th scope="col">Primary</th>
                      <th scope="col">Order</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {images.map((image, index) => (
                      <tr key={image.id}>
                        <td>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.public_url}
                            alt={image.alt_text || ""}
                            width={72}
                            height={72}
                            style={{
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid var(--admin-border, #ddd)",
                            }}
                          />
                        </td>
                        <td>
                          {image.source_type === "external" ? (
                            <span className={styles.badgeSoon}>Shopify URL</span>
                          ) : (
                            <span className={styles.badgeOk}>Uploaded</span>
                          )}
                        </td>
                        <td>
                          {image.is_primary ? (
                            <span className={styles.badgeOk}>Primary</span>
                          ) : (
                            <form action={primaryAction}>
                              <input
                                type="hidden"
                                name="product_id"
                                value={product.id}
                              />
                              <input
                                type="hidden"
                                name="image_id"
                                value={image.id}
                              />
                              <button
                                type="submit"
                                className={styles.textButton}
                              >
                                Make primary
                              </button>
                            </form>
                          )}
                        </td>
                        <td className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.textButton}
                            disabled={index === 0}
                            onClick={() => moveImage(image.id, -1)}
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            className={styles.textButton}
                            disabled={index === images.length - 1}
                            onClick={() => moveImage(image.id, 1)}
                          >
                            Down
                          </button>
                        </td>
                        <td>
                          <form action={imageAction}>
                            <input
                              type="hidden"
                              name="product_id"
                              value={product.id}
                            />
                            <input
                              type="hidden"
                              name="image_id"
                              value={image.id}
                            />
                            <button type="submit" className={styles.textButton}>
                              {image.source_type === "external"
                                ? "Remove reference"
                                : "Delete upload"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminFormSection>

          <AdminFormSection
            title="Inventory adjustments"
            description="Stock changes write to inventory_movements. Do not edit stock_qty directly. Imported Shopify quantities were missing — tracked variants show “Needs stock review” until you correct or confirm stock."
          >
            {trackedVariants.some((v) => v.stock_review_required) ? (
              <p className={styles.badgeSoon} role="status">
                Some variants still need stock review. The shown quantity is a
                placeholder (usually 0), not confirmed Shopify inventory.
              </p>
            ) : null}
            {trackedVariants.length === 0 ? (
              <p className={styles.placeholderNote}>
                Enable inventory tracking on a saved variant to adjust stock.
              </p>
            ) : (
              <>
              <form className={styles.formGrid} action={stockAction}>
                <input type="hidden" name="product_id" value={product.id} />
                <div className={styles.field}>
                  <label htmlFor="stock-variant">Variant</label>
                  <select id="stock-variant" name="variant_id" required>
                    {trackedVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variantDisplayName(variant, { includeDefault: true })} (stock {variant.stock_qty}
                        {variant.stock_review_required
                          ? " — needs review"
                          : ""}
                        )
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="stock-delta">Quantity change</label>
                  <input
                    id="stock-delta"
                    name="quantity_delta"
                    type="number"
                    required
                    placeholder="e.g. 10 or -2"
                  />
                  <p className={styles.fieldHint}>
                    Positive increases stock; negative decreases it. Recording a
                    change also clears the stock-review flag.
                  </p>
                </div>
                <div className={styles.field}>
                  <label htmlFor="stock-type">Movement type</label>
                  <select
                    id="stock-type"
                    name="movement_type"
                    defaultValue="manual_adjustment"
                  >
                    {ADMIN_ADJUSTABLE_MOVEMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="stock-note">Reason / note</label>
                  <input id="stock-note" name="note" type="text" />
                </div>
                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.secondaryButtonCompact}
                  >
                    Record stock change
                  </button>
                </div>
              </form>

              {trackedVariants.some((v) => v.stock_review_required) ? (
                <form className={styles.formGrid} action={stockReviewAction}>
                  <input type="hidden" name="product_id" value={product.id} />
                  <div className={styles.field}>
                    <label htmlFor="review-variant">
                      Confirm stock without changing quantity
                    </label>
                    <select id="review-variant" name="variant_id" required>
                      {trackedVariants
                        .filter((variant) => variant.stock_review_required)
                        .map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variantDisplayName(variant, { includeDefault: true })} (shown qty{" "}
                            {variant.stock_qty})
                          </option>
                        ))}
                    </select>
                    <p className={styles.fieldHint}>
                      Use only after verifying the on-hand quantity matches the
                      shown value (including zero).
                    </p>
                  </div>
                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.secondaryButtonCompact}
                    >
                      Mark stock reviewed
                    </button>
                  </div>
                </form>
              ) : null}
              </>
            )}

            {product.recent_movements.length > 0 ? (
              <div className={styles.tableWrap} style={{ marginTop: "1rem" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">When</th>
                      <th scope="col">Type</th>
                      <th scope="col">Delta</th>
                      <th scope="col">Result</th>
                      <th scope="col">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.recent_movements.map((movement) => (
                      <tr key={movement.id}>
                        <td className={styles.tableDate}>
                          {new Date(movement.created_at).toLocaleString(
                            "en-GB"
                          )}
                        </td>
                        <td>{movement.movement_type}</td>
                        <td>
                          {movement.quantity_delta > 0
                            ? `+${movement.quantity_delta}`
                            : movement.quantity_delta}
                        </td>
                        <td>{movement.resulting_quantity}</td>
                        <td className={styles.tableMeta}>
                          {movement.note || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </AdminFormSection>

          <AdminFormSection
            title="Archive / delete"
            description={
              product.can_hard_delete
                ? "This product has no order-related inventory history and may be permanently deleted."
                : "Order-related inventory history exists. Archive instead of deleting so historical data stays valid."
            }
          >
            <div className={styles.formActions}>
              <form action={archiveAction}>
                <input type="hidden" name="id" value={product.id} />
                <button
                  type="submit"
                  className={styles.secondaryButtonCompact}
                >
                  Archive product
                </button>
              </form>
              {product.can_hard_delete ? (
                <form
                  action={deleteAction}
                  onSubmit={(event) => {
                    if (
                      !window.confirm(
                        "Permanently delete this unused product and its variants?"
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={product.id} />
                  <button type="submit" className={styles.textButton}>
                    Delete permanently
                  </button>
                </form>
              ) : null}
            </div>
          </AdminFormSection>
        </>
      ) : null}
    </div>
  );
}
