import styles from "@/components/content/ContentBody.module.css";

/** Responsive 16:9 YouTube embed. Privacy-friendly host optional later. */
export default function YoutubeEmbed({ id }: { id: string }) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;

  return (
    <div className={styles.youtubeWrap}>
      <iframe
        className={styles.youtubeFrame}
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
