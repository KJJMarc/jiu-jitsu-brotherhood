import Image from "next/image";
import Link from "next/link";
import { externalLinks } from "@/lib/site";
import styles from "./home.module.css";

const resources = [
  {
    title: "Free Beginners' Guide",
    body: "Written by KJJ founder Marc Barton, our free 100-page guide covers everything you need to know to get started in Brazilian Jiu Jitsu.",
    image: "/images/resources/beginners-guide.jpg",
    alt: "Cover of the free Beginner's Guide to Brazilian Jiu Jitsu eBook",
    cta: "Download",
    href: externalLinks.beginnersGuide,
    external: true,
  },
  {
    title: "Mauricio Gomes Library",
    body: "Explore instructional videos and insights from the legendary Mauricio Gomes in his online library.",
    image: "/images/resources/library.jpg",
    alt: "Kingston Jiu Jitsu members drilling Brazilian Jiu Jitsu technique",
    cta: "Visit the library",
    href: externalLinks.library,
    external: true,
  },
  {
    title: "Online Portal",
    body: "An extensive collection of instructional videos following our curriculum — included with every membership.",
    image: "/images/resources/online-portal.jpg",
    alt: "Kingston Jiu Jitsu online learning portal",
    cta: "Explore the portal",
    href: externalLinks.onlinePortal,
    external: true,
  },
  {
    title: "Club News",
    body: "Stay informed, inspired and connected to our thriving jiu jitsu community — belt promotions, competitions and seminars.",
    image: "/images/resources/club-news.jpg",
    alt: "Kingston Jiu Jitsu members training together",
    cta: "Read club news",
    href: "/blogs/blog",
    external: false,
  },
];

export default function Resources() {
  return (
    <section className="section section--grey" aria-labelledby="resources-heading">
      <div className="container">
        <div className="section-head section-head--center">
          <p className="eyebrow">Start today</p>
          <h2 id="resources-heading">Free resources &amp; member extras</h2>
        </div>

        <ul className={styles.resourceGrid}>
          {resources.map((r) => (
            <li key={r.title} className={styles.resourceCard}>
              <div className={styles.resourceMedia}>
                <Image
                  src={r.image}
                  alt={r.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                  className={styles.coverImg}
                />
              </div>
              <div className={styles.resourceBody}>
                <h3 className={styles.resourceTitle}>{r.title}</h3>
                <p>{r.body}</p>
                {r.external ? (
                  <a
                    className={styles.classLink}
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {r.cta} →
                  </a>
                ) : (
                  <Link className={styles.classLink} href={r.href}>
                    {r.cta} →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
