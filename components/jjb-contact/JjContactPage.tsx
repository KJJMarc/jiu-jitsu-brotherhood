import ContactForm from "@/components/jjb-contact/ContactForm";
import { venues } from "@/lib/site";
import styles from "./jjb-contact.module.css";

const tiffin = venues[0];

/**
 * Dedicated JJB Contact page — continuous white + charcoal collection band.
 * Routed only from /pages/contact — does not alter ContentDocument.
 */
export default function JjContactPage() {
  const formStartedAt = Date.now();

  return (
    <div className={styles.page}>
      <section className={styles.intro} aria-labelledby="contact-heading">
        <div className={`container ${styles.introInner}`}>
          <p className={styles.eyebrow}>Get in touch</p>
          <h1 id="contact-heading" className={styles.title}>
            Contact us
          </h1>
          <p className={styles.lead}>
            Questions about Jiu Jitsu Brotherhood, our articles, resources, shop
            or club network? Send us a message.
          </p>
          <ContactForm formStartedAt={formStartedAt} />
        </div>
      </section>

      <section
        className={styles.collection}
        aria-labelledby="collection-heading"
      >
        <div className={`container ${styles.collectionInner}`}>
          <div className={styles.collectionCopy}>
            <p className={styles.collectionKicker}>Collecting an order?</p>
            <h2 id="collection-heading">
              <a
                className={styles.collectionTitleLink}
                href="https://www.kingstonjiujitsu.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Kingston Jiu Jitsu
              </a>
            </h2>
            <p>
              If you selected collection when ordering from JJB, your order can
              be collected from Kingston Jiu Jitsu at Tiffin Sports Centre.
            </p>
            <p className={styles.directionsNote}>
              Please wait for collection confirmation before travelling.
            </p>
            <address className={styles.address}>
              <strong>Kingston Jiu Jitsu</strong>
              <br />
              {tiffin.name}
              <br />
              {tiffin.street}
              <br />
              {tiffin.locality}
              <br />
              {tiffin.postcode}
            </address>
            <a
              className={styles.directions}
              href={tiffin.maps}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions
            </a>
          </div>

          <div className={styles.mapWrap}>
            <div className={styles.mapFrame}>
              <iframe
                title="Map showing Tiffin Sports Centre, Kingston upon Thames"
                src={tiffin.mapEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
