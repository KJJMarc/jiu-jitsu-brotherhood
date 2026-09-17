/**
 * Genuine content for the individual class / programme pages, taken from the
 * live WordPress pages (each is mostly an embedded YouTube video plus copy).
 * Images reference the locally-optimised class photos in /public/images.
 */

export type ClassSection = {
  heading?: string;
  body?: string[];
  list?: string[];
};

export type ClassPage = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  intro: string;
  image: string | null;
  imageAlt: string;
  youtube: string | null;
  sections: ClassSection[];
  secondaryLink?: { label: string; href: string };
  testimonials?: { quote: string; author: string }[];
};

export const classPages: ClassPage[] = [
  {
    slug: "adult-classes",
    title: "Adult Classes",
    eyebrow: "Adult programme",
    description:
      "Adult Brazilian Jiu Jitsu at Kingston Jiu Jitsu — beginner, all-levels and advanced gi and no-gi classes, women's only and Muay Thai, under black belt coaches of the Mauricio Gomes Legacy Team.",
    intro:
      "From complete beginners to experienced martial artists — build skill, fitness and confidence as part of a supportive community.",
    image: "/images/classes/adult-classes.jpg",
    imageAlt: "Kingston Jiu Jitsu adult class training on the mats",
    youtube: "RHa0oWxNgM8",
    sections: [
      {
        body: [
          "At Kingston Jiu Jitsu, adults of all ages and experience levels train together. Some people come to learn a martial art or get fitter, others want to compete, and plenty simply discover that Jiu Jitsu is a great way to spend their time.",
          "Our timetable runs seven days a week, with beginners, fundamentals, all-levels and advanced training in both Gi and No-Gi. You'll learn from an experienced coaching team in a friendly environment where you can train seriously, progress at your own pace and enjoy being on the mats.",
          "Membership also includes access to our online training portal, with more than 270 video lessons to help you continue learning away from the academy.",
        ],
      },
    ],
  },
  {
    slug: "beginners-classes",
    title: "Beginners' Classes",
    eyebrow: "Beginners programme",
    description:
      "New to Brazilian Jiu Jitsu? Kingston Jiu Jitsu's beginner's programme is simple, structured and welcoming — two weekly classes building your foundation towards blue belt.",
    intro:
      "Simple, structured and enjoyable from day one — the ideal introduction to Brazilian Jiu Jitsu.",
    image: "/images/classes/beginners-classes.jpg",
    imageAlt: "Beginners learning fundamentals at Kingston Jiu Jitsu",
    youtube: "auB88eaXEE8",
    sections: [
      {
        body: [
          "Starting Jiu Jitsu can feel intimidating, so we've designed our beginners' programme to make getting started as easy as possible.",
          "You'll learn the fundamentals step by step, alongside other beginners and with plenty of support from our coaching team. You don't need any previous martial arts experience or a particular level of fitness — just come along and start learning.",
        ],
      },
    ],
    secondaryLink: {
      label: "Our Beginners' Programme",
      href: "/beginners-programme/",
    },
    testimonials: [
      {
        quote:
          "10 months ago, I signed up for Kingston Jiu-Jitsu's beginner's classes, and it's proven to be one of my best decisions to date. Starting a martial art can be intimidating; I was hesitant at first, but Marc's friendly, welcoming nature made it easy to come back week after week. My training partners became my friends fast!",
        author: "Joshua Sadraoui",
      },
      {
        quote:
          "The thing that struck me immediately about my first evening at the beginner's class was the supportive atmosphere. Marc and the other students made me feel so welcome. At the end of the class, I knew that I had found my school, and that Jiu-Jitsu would be part of my life moving forward.",
        author: "Marvin Reid",
      },
    ],
  },
  {
    slug: "kids-classes",
    title: "Kids' Classes",
    eyebrow: "Kids programme",
    description:
      "Kids Brazilian Jiu Jitsu at Kingston Jiu Jitsu for ages 5–16 — self-confidence, discipline and self-defence through fun, structured, safe classes.",
    intro:
      "Self-confidence, discipline, body awareness and balance — in a safe and fun environment for ages 5–16.",
    image: "/images/classes/kids-classes.jpg",
    imageAlt: "Children training in a Kingston Jiu Jitsu kids class",
    youtube: "PLzN2WrFiP4",
    sections: [
      {
        body: [
          "Brazilian Jiu Jitsu is a brilliant way for children to build confidence, coordination and resilience while learning practical skills in a safe and supportive environment.",
          "Our classes are designed to be fun and engaging, with children learning through a mixture of technique, games and supervised training. We welcome children aged 5–16, from complete beginners upwards. Our experienced coaching team makes sure every child can learn at their own pace, have fun and feel part of the club.",
        ],
      },
    ],
    secondaryLink: {
      label: "Parents: term dates, uniform & class information",
      href: "/kids-class-information/",
    },
  },
  {
    slug: "ladies-classes",
    title: "Women's Classes",
    eyebrow: "Women's programme",
    description:
      "Women's only Brazilian Jiu Jitsu at Kingston Jiu Jitsu — a safe, supportive environment to learn self-defence and be part of a vibrant community.",
    intro:
      "A friendly, supportive women-only environment to learn Jiu Jitsu, build confidence and enjoy training together.",
    image: "/images/classes/womens-classes.jpg",
    imageAlt: "Women's only Brazilian Jiu Jitsu class at Kingston Jiu Jitsu",
    youtube: "o5x8ufPlfQg",
    sections: [
      {
        body: [
          "Our women's classes are a welcoming place to start or develop your Jiu Jitsu, with experienced coaching and a great group of women training together. Complete beginners are always welcome, and you don't need any previous martial arts experience or particular level of fitness to get started.",
          "The women's section has grown into a big part of the KJJ community, both on and off the mats. Alongside regular training, the group organises social events and activities throughout the year, creating friendships that go well beyond Jiu Jitsu.",
        ],
      },
    ],
  },
  {
    slug: "no-gi-classes",
    title: "No-Gi Classes",
    eyebrow: "No-gi grappling",
    description:
      "No-Gi Brazilian Jiu Jitsu at Kingston Jiu Jitsu — dynamic, fast-paced submission grappling in rash guard and shorts, ideal for MMA and wrestling crossover.",
    intro:
      "Dynamic, fast-paced submission grappling without the gi — a great way to develop a more complete grappling game.",
    image: "/images/classes/no-gi-classes.jpg",
    imageAlt: "No-gi grappling class at Kingston Jiu Jitsu",
    youtube: "09X-t-XNQAI",
    sections: [
      {
        body: [
          "Our No-Gi classes focus on grappling without the traditional kimono. We train in a rash guard and grappling shorts, with no gripping of clothing, creating a faster style of Jiu Jitsu with plenty of emphasis on movement, control and submissions.",
          "No-Gi is a great complement to Gi training, but it's also a discipline in its own right. Our classes are ideal for anyone interested in submission grappling, wrestling or simply developing a broader and more adaptable Jiu Jitsu game.",
        ],
      },
    ],
  },
  {
    slug: "muay-thai-classes",
    title: "Muay Thai Classes",
    eyebrow: "Muay Thai kickboxing",
    description:
      "Muay Thai kickboxing at Kingston Jiu Jitsu — three weekly adult classes plus kids Muay Thai at Tiffin Sports Centre. Open to all, drop-ins welcome.",
    intro:
      "Traditional Thai boxing for all skill levels — a great way to develop striking, fitness and confidence.",
    image: "/images/classes/muay-thai-classes.jpg",
    imageAlt: "Muay Thai kickboxing class at Kingston Jiu Jitsu",
    youtube: "hYtXvxGWZcQ",
    sections: [
      {
        body: [
          "Our Muay Thai classes are open to everyone, from complete beginners to experienced martial artists. You'll learn the fundamentals of Thai boxing, including punches, kicks, knees, elbows, footwork and defence, with an emphasis on good technique and safe, enjoyable training.",
          "With several classes each week for adults as well as a dedicated kids' session, Muay Thai has become a growing part of KJJ. It works brilliantly alongside Jiu Jitsu, but you don't need to train BJJ or be a KJJ member to join us.",
        ],
      },
    ],
  },
  {
    slug: "tnt-takedowns-n-transitions",
    title: "TNT: Takedowns 'n' Transitions",
    eyebrow: "Takedowns & transitions",
    description:
      "TNT: Takedowns 'n' Transitions at Kingston Jiu Jitsu — a fun, dynamic Friday-evening class blending BJJ takedowns with fluid transitions into ground fighting.",
    intro:
      "A fun, dynamic Friday-evening class connecting stand-up grappling with Jiu Jitsu on the ground.",
    image: "/images/classes/tnt.jpg",
    imageAlt: "Takedown and transition drilling at Kingston Jiu Jitsu",
    youtube: "l0-mkdFyNqQ",
    sections: [
      {
        body: [
          "Led by coach Simon, TNT focuses on one of the most important parts of Jiu Jitsu: getting the fight safely and effectively from standing to the mat. You'll work on takedowns, throws and the transitions that connect them directly into control and attacking positions.",
          "The class draws on Jiu Jitsu, wrestling and other grappling styles, with plenty of practical drilling and live training. It's open to all levels and a great way to become more confident on your feet and improve the transitions in your overall game.",
        ],
      },
    ],
  },
  {
    slug: "open-mats",
    title: "Open Mats",
    eyebrow: "Open training",
    description:
      "Open mats at Kingston Jiu Jitsu — Sunday-afternoon open training to roll, drill and connect with teammates in a relaxed, friendly setting.",
    intro:
      "Sunday-afternoon open training to roll, drill and connect with your teammates.",
    image: "/images/classes/open-mats.jpg",
    imageAlt: "Members rolling together during an open mat session",
    youtube: null,
    sections: [
      {
        body: [
          "Open mats are a great chance for members to come together, roll and share knowledge in a relaxed setting. Held on Sunday afternoons, they provide the ideal opportunity to sharpen your skills, experiment with new techniques and get extra mat time at your own pace.",
          "They're also a perfect way to connect with teammates, build confidence and enjoy the social side of training. Whether you want hard sparring, light rolling or just time to drill, open mats give you the freedom to train how you like in a friendly and supportive environment.",
        ],
      },
    ],
  },
  {
    slug: "seminars-and-events",
    title: "Seminars and Events",
    eyebrow: "Seminars & events",
    description:
      "Seminars and events at Kingston Jiu Jitsu — regular seminars with Mauricio Gomes and other world-class instructors, plus socials as part of the Jiu Jitsu Brotherhood.",
    intro:
      "World-class seminars, in-house competitions and club socials throughout the year.",
    image: "/images/classes/seminars-events.jpg",
    imageAlt: "Kingston Jiu Jitsu seminar with a visiting instructor",
    youtube: "NLkj8zHaNqk",
    sections: [
      {
        body: [
          "Alongside our regular classes, we host seminars, special events and club gatherings throughout the year. These are a big part of what makes Kingston Jiu Jitsu more than just a place to train.",
        ],
      },
      {
        heading: "Learn from the source",
        body: [
          "Our head instructor's mentor, Maurício Motta Gomes — Coral Belt and one of the most respected figures in Brazilian Jiu Jitsu — regularly teaches seminars at the academy. Training under someone with his lineage and depth of experience is something very few clubs can offer.",
          "Over the years we have also welcomed:",
        ],
        list: [
          "José Leão Teixeira \u201cZé Beleza\u201d",
          "Kit Dale",
          "Women's World Champion Emily Kwok",
          "Old-school UK BJJ pioneer Ben Poppleton",
          "And many other high-level instructors from the UK and abroad",
        ],
      },
      {
        heading: "Part of the Jiu Jitsu Brotherhood",
        body: ["We are proud to be part of the Jiu Jitsu Brotherhood network. This means:"],
        list: [
          "Inter-club training opportunities",
          "Hosted competitions and in-house events",
          "Shared seminars across the network",
          "A wider community beyond a single academy",
        ],
      },
      {
        heading: "More than just training",
        body: [
          "We also organise regular social events and club outings — club meals and celebrations, trips to Go Ape, Ninja Warrior courses, team days and social gatherings. Because Jiu Jitsu is not only about what happens on the mat; it's about the people you train with. Keep an eye on our newsletter and announcements for upcoming seminars and events.",
        ],
      },
    ],
  },
];

export const classPageSlugs = classPages.map((p) => p.slug);

export function getClassPage(slug: string): ClassPage | undefined {
  return classPages.find((p) => p.slug === slug);
}
