"use client";

import { JJB_LEGAL_ENTITY } from "@/lib/legal-entity";
import styles from "@/components/pages.module.css";

const CANCEL_EMAIL = JJB_LEGAL_ENTITY.email;
const CANCEL_SUBJECT = "JJB order cancellation request";
const mailtoHref = `mailto:${CANCEL_EMAIL}?subject=${encodeURIComponent(CANCEL_SUBJECT)}`;

const FIELDS = [
  { id: "goods", label: "Goods" },
  { id: "ordered", label: "Ordered on / received on" },
  { id: "order", label: "Order number" },
  { id: "name", label: "Your name" },
  { id: "address", label: "Your address" },
  {
    id: "signature",
    label: "Signature",
    hint: "Only needed if you print and post this form",
  },
  { id: "date", label: "Date" },
] as const;

export default function OptionalCancellationForm() {
  return (
    <section
      className={styles.cancelSection}
      id="optional-cancellation-form"
      aria-labelledby="optional-cancellation-heading"
    >
      <h2 id="optional-cancellation-heading">12. Optional cancellation form</h2>
      <p>
        You do not have to use this form. You can cancel by emailing us at{" "}
        <a href={`mailto:${CANCEL_EMAIL}`}>{CANCEL_EMAIL}</a> with your name,
        order number and a clear statement that you wish to cancel.
      </p>

      <div className={`${styles.cancelActions} no-print`}>
        <a className="btn btn--primary" href={mailtoHref}>
          Email us to cancel
        </a>
        <button
          type="button"
          className="btn btn--outline"
          onClick={() => window.print()}
        >
          Print cancellation form
        </button>
      </div>

      <div className={styles.cancelCard} data-print-form>
        <p className={styles.cancelCardEyebrow}>Send to</p>
        <p className={styles.cancelCardRecipient}>
          <strong>{JJB_LEGAL_ENTITY.operatorLegalName}</strong>
          <br />
          trading as {JJB_LEGAL_ENTITY.tradingName}
          <br />
          {JJB_LEGAL_ENTITY.registeredOffice}
          <br />
          <a href={`mailto:${CANCEL_EMAIL}`}>{CANCEL_EMAIL}</a>
        </p>

        <p className={styles.cancelCardLead}>
          I want to cancel my order for the following goods:
        </p>

        <div className={styles.cancelFields}>
          {FIELDS.map((field) => (
            <div key={field.id} className={styles.cancelField}>
              <label htmlFor={`cancel-${field.id}`}>
                {field.label}
                {"hint" in field && field.hint ? (
                  <span className={styles.cancelFieldHint}> — {field.hint}</span>
                ) : null}
              </label>
              <div
                id={`cancel-${field.id}`}
                className={
                  field.id === "address" || field.id === "goods"
                    ? styles.cancelLineTall
                    : styles.cancelLine
                }
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
