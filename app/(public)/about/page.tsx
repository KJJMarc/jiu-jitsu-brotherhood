import type { Metadata } from "next";
import Image from "next/image";
import FinalCta from "@/components/home/FinalCta";
import styles from "@/components/pages.module.css";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "The story of Kingston Jiu Jitsu — from one hour of training on a Monday night in Kingston to a thriving seven-day-a-week Brazilian Jiu Jitsu academy for adults, children and families.",
  alternates: { canonical: "/about/" },
};

type Entry = {
  year: string;
  title: string;
  paras: string[];
  creed?: string;
  image: string;
  alt: string;
};

const entries: Entry[] = [
  {
    year: "2006",
    title: "The journey begins",
    paras: [
      "At 30, Marc began Brazilian Jiu Jitsu at the Roger Gracie Academy in London.",
      "He had trained in martial arts since his teens, earning a second-degree black belt in karate in his twenties, but BJJ began a new journey. At RGA he met influential teachers and training partners, including Mauricio Gomes, Nicolas Gregoriades and Steve Finan.",
    ],
    image: "/images/story/2006-rga.jpg",
    alt: "Early Brazilian Jiu Jitsu training at the Roger Gracie Academy",
  },
  {
    year: "2012",
    title: "One hour on a Monday night",
    paras: [
      "After being promoted to purple belt, Marc began teaching a handful of friends in Kingston.",
      "There was no academy and no big timetable. Just one hour of Jiu Jitsu every Monday evening.",
      "Those sessions became Kingston Jiu Jitsu.",
    ],
    image: "/images/story/2012.jpg",
    alt: "Early Kingston Jiu Jitsu members piled together after a Monday night class",
  },
  {
    year: "2013",
    title: "The kids arrive",
    paras: [
      "Marc’s son became interested in training, leading to KJJ’s first children’s classes.",
      "His two daughters would eventually join him on the mats too, and what had begun as a group of friends was becoming a family affair.",
    ],
    image: "/images/story/kids.jpg",
    alt: "Kingston Jiu Jitsu children’s class group photo with instructors",
  },
  {
    year: "2015",
    title: "Clare starts training",
    paras: [
      "Marc’s wife Clare joined a beginners course and started training herself. With the whole family now involved, Jiu Jitsu had truly become part of family life.",
      "Clare would go on to build KJJ’s hugely popular women’s programme and become an important part of the academy’s teaching team.",
    ],
    image: "/images/story/beginners-course.jpg",
    alt: "Kingston Jiu Jitsu beginners course group holding their certificates",
  },
  {
    year: "2016",
    title: "Black belt",
    paras: [
      "Ten years after starting BJJ, Marc was promoted to black belt at RGA by Nicolas Gregoriades and Mauricio Gomes.",
      "By then, the small Monday night sessions in Kingston had grown considerably, with classes running several days a week and a thriving community beginning to take shape.",
    ],
    image: "/images/story/coaches.jpg",
    alt: "Two Kingston Jiu Jitsu black belt coaches on the mats",
  },
  {
    year: "2018",
    title: "Seven days a week",
    paras: [
      "By 2018, Kingston Jiu Jitsu had grown from one weekly class into a seven-day-a-week academy, with an expanding programme for adults and children.",
      "The club was much bigger, but the aim remained simple: great Jiu Jitsu in a friendly, welcoming environment.",
    ],
    image: "/images/story/black-belt.jpg",
    alt: "Marc Barton and Mauricio Gomes in Roger Gracie Jiu Jitsu gis at a seminar",
  },
  {
    year: "2023",
    title: "The next generation",
    paras: [
      "By 2023, Marc had promoted several of his own students to black belt and KJJ had developed a large, experienced teaching team, including Yang, Andreas, Simon and Dan.",
      "The handful of people training on Monday nights had become an academy with its own black belts, coaches and next generation of teachers.",
    ],
    image: "/images/story/team.jpg",
    alt: "The Kingston Jiu Jitsu academy team photographed together",
  },
  {
    year: "Today",
    title: "Kingston Jiu Jitsu",
    paras: [
      "Today, Kingston Jiu Jitsu is home to a thriving community of adults, children and families.",
      "Some train to compete. Some want to get fitter or learn a martial art. Others simply discover that they love being on the mats.",
      "More than a decade after those first Monday night sessions, the philosophy remains much the same:",
    ],
    creed: "Train hard. Look after each other. Keep learning. Enjoy Jiu Jitsu.",
    image: "/images/story/training.jpg",
    alt: "Members sparring during a busy Kingston Jiu Jitsu class",
  },
];

const values = [
  {
    title: "A welcoming community",
    body: "Friendly, supportive and ego-free. From your first class, you’ll be made to feel welcome and part of the team.",
  },
  {
    title: "World-class lineage",
    body: "We’re proud members of the Mauricio Gomes Legacy Team, with a lineage and approach to Jiu Jitsu shaped by one of the sport’s most respected pioneers.",
  },
  {
    title: "Jiu Jitsu for everyone",
    body: "Adults, kids, complete beginners and experienced competitors all train at KJJ. Whatever your age or experience, there’s a place for you on the mats.",
  },
  {
    title: "Seven days a week",
    body: "With beginners’, fundamentals and advanced classes, kids’ sessions, open mats and Muay Thai, there are plenty of opportunities to train throughout the week.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">Our story</p>
          <h1>From one class a week to a seven-day academy</h1>
          <p>
            Kingston Jiu Jitsu didn’t begin with a business plan or a grand plan
            to open an academy. It started with a love of Jiu Jitsu, a handful of
            friends and one hour of training on a Monday night.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ol className={styles.timeline}>
            {entries.map((e) => (
              <li key={e.year} className={styles.tlEntry}>
                <div className={styles.tlFigure}>
                  <Image
                    src={e.image}
                    alt={e.alt}
                    fill
                    sizes="(max-width: 820px) 100vw, 500px"
                  />
                </div>
                <div className={styles.tlBody}>
                  <p className={styles.tlYear}>{e.year}</p>
                  <h2>{e.title}</h2>
                  {e.paras.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {e.creed && <p className={styles.tlCreed}>{e.creed}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--grey">
        <div className="container">
          <ul className={styles.cardGrid}>
            {values.map((v) => (
              <li key={v.title} className={styles.card}>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
