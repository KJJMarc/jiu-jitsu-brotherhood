import Image from "next/image";
import Link from "next/link";
import { localAssets } from "@/lib/home/prototype";
import styles from "./jjb-about.module.css";

const adultClasses = {
  src: "/images/jjb/about-adult-classes.jpg",
  alt: "Jiu Jitsu practitioners training together on the mats",
  width: 3212,
  height: 2143,
  position: "center 40%",
} as const;

const communityGroup = {
  src: "/images/jjb/about-community-group.jpg",
  alt: "A Jiu Jitsu group portrait on the mats",
  width: 1024,
  height: 764,
  position: "center 35%",
} as const;

const ouroboros = {
  src: "/images/jjb/about-ouroboros.jpg",
  alt: "Jiu Jitsu Brotherhood ouroboros mark",
  width: 1021,
  height: 1024,
} as const;

/**
 * Dedicated JJB About page — continuous white editorial layout.
 * Routed only from /pages/about — does not alter ContentDocument.
 */
export default function JjAboutPage() {
  const history = localAssets.historyPhoto;

  return (
    <div className={styles.page}>
      <section className={styles.intro} aria-labelledby="about-hero-heading">
        <div className={`container ${styles.narrowInner}`}>
          <p className={styles.eyebrow}>About Jiu Jitsu Brotherhood</p>
          <h1 id="about-hero-heading" className={styles.heroTitle}>
            Sharing knowledge. Building community. Honouring the art.
          </h1>
          <p className={styles.heroLead}>
            Jiu Jitsu Brotherhood was created in 2007 from a simple idea: that
            Jiu Jitsu gets better when knowledge is shared.
          </p>
          <p className={styles.heroLead}>
            What began as a place to exchange ideas about training has grown
            into a collection of articles, techniques, resources and projects
            built around the art and the people who practise it.
          </p>
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="about-built-heading"
      >
        <div className={`container ${styles.split}`}>
          <div className={styles.copy}>
            <p className={styles.kicker}>Since 2007</p>
            <h2 id="about-built-heading">Built around Jiu Jitsu</h2>
            <p>
              Jiu Jitsu Brotherhood began at a very different time for Brazilian
              Jiu Jitsu. The art was still relatively small in the UK, good
              information was harder to find, and much of what we learned was
              passed directly from one training partner to another.
            </p>
            <p>
              The website grew from that same culture of sharing. Over the years
              it has documented techniques, explored ideas about training and
              improvement, told stories from the mats and followed the
              continuing evolution of Jiu Jitsu.
            </p>
          </div>
          <div className={styles.media}>
            <Image
              src={history.src}
              alt={history.alt}
              fill
              sizes="(max-width: 899px) 100vw, 48vw"
              className={styles.mediaImgBright}
              style={{ objectFit: "cover", objectPosition: history.position }}
            />
          </div>
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="about-knowledge-heading"
      >
        <div className={`container ${styles.split} ${styles.splitMediaFirst}`}>
          <div className={styles.media}>
            <Image
              src={adultClasses.src}
              alt={adultClasses.alt}
              fill
              sizes="(max-width: 899px) 100vw, 48vw"
              className={styles.mediaImgBright}
              style={{
                objectFit: "cover",
                objectPosition: adultClasses.position,
              }}
            />
          </div>
          <div className={styles.copy}>
            <p className={styles.kicker}>Knowledge</p>
            <h2 id="about-knowledge-heading">There is always more to learn</h2>
            <p>
              No matter how long you train, Jiu Jitsu has a habit of showing you
              how much you still don&apos;t know.
            </p>
            <p>
              That&apos;s why teaching and learning remain at the heart of JJB.
              Our articles explore everything from technique and training to
              history, health and longevity, while our instructional archive
              preserves techniques and ideas from experienced practitioners.
            </p>
            <div className={styles.actions}>
              <Link className={styles.btnPrimary} href="/blogs/blog">
                Explore Articles
              </Link>
              <Link className={styles.btnOutline} href="/blogs/techniques">
                Explore Techniques
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="about-community-heading"
      >
        <div className={`container ${styles.split}`}>
          <div className={styles.copy}>
            <p className={styles.kicker}>Community</p>
            <h2 id="about-community-heading">More than a website</h2>
            <p>
              Jiu Jitsu has always been about people as much as technique.
            </p>
            <p>
              Over the years JJB has brought people together through seminars,
              events, collaborative projects and a network of independent
              academies connected by friendship rather than a traditional
              affiliation structure.
            </p>
            <div className={styles.actions}>
              <Link
                className={styles.btnPrimary}
                href="/pages/jiu-jitsu-brotherhood-club-network"
              >
                Explore the Club Network
              </Link>
            </div>
          </div>
          <div className={styles.media}>
            <Image
              src={communityGroup.src}
              alt={communityGroup.alt}
              fill
              sizes="(max-width: 899px) 100vw, 48vw"
              className={styles.mediaImgBright}
              style={{
                objectFit: "cover",
                objectPosition: communityGroup.position,
              }}
            />
          </div>
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="about-journey-heading"
      >
        <div className={`container ${styles.split} ${styles.splitMediaFirst}`}>
          <div className={`${styles.media} ${styles.mediaOuro}`}>
            <Image
              src={ouroboros.src}
              alt={ouroboros.alt}
              fill
              sizes="(max-width: 899px) 100vw, 42vw"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </div>
          <div className={styles.copy}>
            <p className={styles.kicker}>The Journey</p>
            <h2 id="about-journey-heading">Progress has no finish line</h2>
            <p>
              The Ouroboros has been part of Jiu Jitsu Brotherhood from the
              beginning.
            </p>
            <p>
              A circle without an end, it represents continual learning, renewal
              and the idea that progress is a process rather than a destination.
            </p>
            <p>
              It&apos;s an idea that fits Jiu Jitsu particularly well. You learn
              something, test it, refine it and eventually pass it on to somebody
              else. Then the process begins again.
            </p>
          </div>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.closingSection}`}
        aria-labelledby="about-today-heading"
      >
        <div className={`container ${styles.narrowInner}`}>
          <p className={styles.kicker}>Today</p>
          <h2 id="about-today-heading">The Brotherhood continues</h2>
          <p>
            JJB continues to publish new articles and techniques while
            preserving material accumulated over nearly two decades.
          </p>
          <p>
            Alongside that are free resources for people beginning and
            developing their Jiu Jitsu, occasional events and projects, and the
            club network.
          </p>
          <p className={styles.closing}>Learn. Share. Pass it on.</p>
          <div className={styles.actions}>
            <Link className={styles.btnPrimary} href="/blogs/blog">
              Explore Articles
            </Link>
            <Link className={styles.btnOutline} href="/#free-stuff">
              Free Stuff
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
