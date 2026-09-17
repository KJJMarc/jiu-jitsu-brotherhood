import styles from "@/components/pages.module.css";

export default function RoutePlaceholder({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body: string;
}) {
  return (
    <>
      <section className="pagehero">
        <div className="container">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          <p>{body}</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <p className={styles.backLink}>Nothing has been published here yet.</p>
        </div>
      </section>
    </>
  );
}
