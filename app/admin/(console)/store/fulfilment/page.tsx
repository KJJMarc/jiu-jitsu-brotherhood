import type { Metadata } from "next";
import styles from "@/app/admin/admin.module.css";
import FulfilmentSettingsForm from "@/components/admin/store/FulfilmentSettingsForm";
import {
  getAdminFulfilmentSettings,
  getAdminShippingBands,
} from "@/lib/admin/fulfilment.server";
import type { FulfilmentSettings, ShippingBand } from "@/lib/store/shipping";

export const metadata: Metadata = {
  title: "Shipping & collection",
};

export default async function AdminStoreFulfilmentPage() {
  let settingsError: string | null = null;
  let settings: FulfilmentSettings;
  let bands: ShippingBand[];

  try {
    [settings, bands] = await Promise.all([
      getAdminFulfilmentSettings(),
      getAdminShippingBands(),
    ]);
  } catch (error) {
    // Don't swallow Next.js control-flow errors (auth redirects, notFound).
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      ((error as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
        (error as { digest: string }).digest.startsWith("NEXT_NOT_FOUND"))
    ) {
      throw error;
    }
    settingsError =
      error instanceof Error
        ? error.message
        : "Fulfilment tables are not available yet.";
    settings = {
      collectionEnabled: false,
      collectionLabel: "Collection",
      collectionInstructions: "",
      ukShippingEnabled: true,
    };
    bands = [];
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Store</p>
        <h1>Shipping & collection</h1>
        <p className={styles.lead}>
          Collection is free; UK delivery is priced by total physical shipment
          weight (grams → pence).
        </p>
      </header>

      {settingsError ? (
        <p className={styles.formError} role="alert">
          {settingsError} Apply migration{" "}
          <code>20260913140000_store_fulfilment_shipping.sql</code> then reload.
        </p>
      ) : null}

      <FulfilmentSettingsForm settings={settings} bands={bands} />
    </div>
  );
}
