"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import styles from "@/app/admin/admin.module.css";
import {
  deleteShippingBandAction,
  fulfilmentActionInitialState,
  saveFulfilmentSettingsAction,
  saveShippingBandAction,
} from "@/app/admin/(console)/store/fulfilment/actions";
import type { FulfilmentSettings, ShippingBand } from "@/lib/store/shipping";
import { formatPenceGbp } from "@/lib/store/shipping";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

type BandDraft = {
  id: string;
  minWeightGrams: string;
  maxWeightGrams: string;
  pricePounds: string;
  isEnabled: boolean;
};

const emptyDraft = (): BandDraft => ({
  id: "",
  minWeightGrams: "",
  maxWeightGrams: "",
  pricePounds: "",
  isEnabled: true,
});

export default function FulfilmentSettingsForm({
  settings,
  bands,
}: {
  settings: FulfilmentSettings;
  bands: ShippingBand[];
}) {
  const [settingsState, settingsAction] = useFormState(
    saveFulfilmentSettingsAction,
    fulfilmentActionInitialState,
  );
  const [bandState, bandAction] = useFormState(
    saveShippingBandAction,
    fulfilmentActionInitialState,
  );
  const [deleteState, deleteAction] = useFormState(
    deleteShippingBandAction,
    fulfilmentActionInitialState,
  );
  const [draft, setDraft] = useState<BandDraft>(emptyDraft);

  useEffect(() => {
    if (bandState.success) {
      setDraft(emptyDraft());
    }
  }, [bandState.success]);

  function startEdit(band: ShippingBand) {
    setDraft({
      id: band.id,
      minWeightGrams: String(band.minWeightGrams),
      maxWeightGrams: String(band.maxWeightGrams),
      pricePounds: (band.pricePence / 100).toFixed(2),
      isEnabled: band.isEnabled,
    });
    document.getElementById("band-editor")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <>
      <section className={styles.panel}>
        <h2>Collection & UK delivery</h2>
        <form action={settingsAction} className={styles.articleForm}>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              name="collection_enabled"
              defaultChecked={settings.collectionEnabled}
            />
            <span>Offer collection</span>
          </label>
          <div className={styles.field}>
            <label htmlFor="collection_label">Collection label</label>
            <input
              id="collection_label"
              name="collection_label"
              defaultValue={settings.collectionLabel}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="collection_instructions">
              Collection instructions
            </label>
            <textarea
              id="collection_instructions"
              name="collection_instructions"
              rows={4}
              defaultValue={settings.collectionInstructions}
            />
          </div>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              name="uk_shipping_enabled"
              defaultChecked={settings.ukShippingEnabled}
            />
            <span>Offer UK delivery</span>
          </label>
          {settingsState.error ? (
            <p className={styles.formError} role="alert">
              {settingsState.error}
            </p>
          ) : null}
          {settingsState.success ? (
            <p className={styles.formSuccess} role="status">
              {settingsState.success}
            </p>
          ) : null}
          <div className={styles.formActions}>
            <SubmitButton label="Save settings" />
          </div>
        </form>
      </section>

      <section className={styles.panel} style={{ marginTop: "1rem" }}>
        <h2>UK shipping bands</h2>
        <p className={styles.placeholderNote}>
          Inclusive gram ranges. Enabled bands must not overlap. To change a
          rate, use Edit — adding a new enabled band on top of an existing range
          will be rejected.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Min (g)</th>
                <th scope="col">Max (g)</th>
                <th scope="col">Price</th>
                <th scope="col">Enabled</th>
                <th scope="col">
                  <span className={styles.srOnly}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {bands.map((band) => (
                <tr key={band.id}>
                  <td>{band.minWeightGrams}</td>
                  <td>{band.maxWeightGrams}</td>
                  <td>{formatPenceGbp(band.pricePence)}</td>
                  <td>{band.isEnabled ? "Yes" : "No"}</td>
                  <td className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.rowActionLink}
                      onClick={() => startEdit(band)}
                    >
                      Edit
                    </button>
                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={band.id} />
                      <button type="submit" className={styles.rowActionLink}>
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {bands.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.tableMeta}>
                    No bands loaded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {deleteState.error ? (
          <p className={styles.formError} role="alert">
            {deleteState.error}
          </p>
        ) : null}
        {deleteState.success ? (
          <p className={styles.formSuccess} role="status">
            {deleteState.success}
          </p>
        ) : null}

        <h3 id="band-editor" style={{ marginTop: "1.25rem" }}>
          {draft.id ? "Edit band" : "Add band"}
        </h3>
        <form action={bandAction} className={styles.formGrid}>
          <input type="hidden" name="id" value={draft.id} />
          <div className={styles.field}>
            <label htmlFor="min_weight_grams">Min grams</label>
            <input
              id="min_weight_grams"
              name="min_weight_grams"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              required
              value={draft.minWeightGrams}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  minWeightGrams: event.target.value,
                }))
              }
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="max_weight_grams">Max grams</label>
            <input
              id="max_weight_grams"
              name="max_weight_grams"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              required
              value={draft.maxWeightGrams}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  maxWeightGrams: event.target.value,
                }))
              }
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="price_pounds">Price (GBP)</label>
            <input
              id="price_pounds"
              name="price_pounds"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              required
              placeholder="1.75"
              value={draft.pricePounds}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  pricePounds: event.target.value,
                }))
              }
            />
          </div>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              name="is_enabled"
              checked={draft.isEnabled}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  isEnabled: event.target.checked,
                }))
              }
            />
            <span>Enabled</span>
          </label>
          {bandState.error ? (
            <p className={styles.formError} role="alert">
              {bandState.error}
            </p>
          ) : null}
          {bandState.success ? (
            <p className={styles.formSuccess} role="status">
              {bandState.success}
            </p>
          ) : null}
          <div className={styles.formActions}>
            <SubmitButton label={draft.id ? "Update band" : "Add band"} />
            {draft.id ? (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setDraft(emptyDraft())}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </>
  );
}
