import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { instructors, type Instructor } from "@/lib/instructors";
import FinalCta from "@/components/home/FinalCta";
import styles from "@/components/pages.module.css";

const featuredSlugs = ["master-mauricio-gomes", "marc-barton"];

function TeamCard({ i }: { i: Instructor }) {
  return (
    <li>
      <Link href={`/${i.slug}/`} className={styles.teamCard}>
        <span className={styles.teamMedia}>
          <Image
            src={i.image}
            alt={`${i.name} — ${i.rank}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 320px"
          />
        </span>
        <span className={styles.teamBody}>
          <span className={styles.teamRank}>{i.rank}</span>
          <span className={styles.teamName}>{i.name}</span>
          <span className={styles.teamRole}>{i.role}</span>
        </span>
      </Link>
    </li>
  );
}

export const metadata: Metadata = {
  title: "Instructors",
  description:
    "Meet the Kingston Jiu Jitsu coaching team — a group of dedicated black and brown belts led by head instructor Marc Barton, part of the Mauricio Gomes Legacy Team.",
  alternates: { canonical: "/instructors/" },
};

export default function InstructorsPage() {
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">Our team</p>
          <h1>Meet the instructors</h1>
          <p>
            Kingston Jiu Jitsu is led by a dedicated team of coaches across
            Brazilian Jiu Jitsu, Muay Thai and takedowns — proud members of the
            Mauricio Gomes Legacy Team.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ul className={styles.teamFeatured}>
            {featuredSlugs
              .map((s) => instructors.find((i) => i.slug === s))
              .filter((i): i is Instructor => Boolean(i))
              .map((i) => (
                <TeamCard key={i.slug} i={i} />
              ))}
          </ul>

          <ul className={styles.teamGrid}>
            {instructors
              .filter((i) => !featuredSlugs.includes(i.slug))
              .map((i) => (
                <TeamCard key={i.slug} i={i} />
              ))}
          </ul>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
