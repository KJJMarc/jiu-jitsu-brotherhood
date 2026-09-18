import { MARC_BARTON_BIO } from "@/lib/content/author-bio";
import styles from "@/components/pages.module.css";

export default function MarcBartonAuthorBio() {
  const [first, second] = MARC_BARTON_BIO.paragraphs;
  const kingstonIdx = second.indexOf(MARC_BARTON_BIO.kingstonLabel);
  const before =
    kingstonIdx >= 0 ? second.slice(0, kingstonIdx) : second;
  const after =
    kingstonIdx >= 0
      ? second.slice(kingstonIdx + MARC_BARTON_BIO.kingstonLabel.length)
      : "";

  return (
    <aside className={styles.authorBio} aria-label="About the author">
      <h2 className={styles.authorBioHeading}>{MARC_BARTON_BIO.heading}</h2>
      <p className={styles.authorBioCopy}>{first}</p>
      <p className={styles.authorBioCopy}>
        {before}
        {kingstonIdx >= 0 ? (
          <a
            href={MARC_BARTON_BIO.kingstonHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {MARC_BARTON_BIO.kingstonLabel}
          </a>
        ) : null}
        {after}
      </p>
    </aside>
  );
}
