export type Instructor = {
  slug: string;
  name: string;
  rank: string;
  role: string;
  image: string;
  intro: string;
  body: string[];
};

/**
 * Instructor profiles, taken verbatim from the live Kingston Jiu Jitsu
 * WordPress pages (/instructors/ and each /<name>/ profile). Order and rank
 * captions match the live instructors page.
 */
export const instructors: Instructor[] = [
  {
    slug: "master-mauricio-gomes",
    name: "Master Mauricio Gomes",
    rank: "8th Degree Coral Belt",
    role: "Affiliation Head & Mentor",
    image: "/images/instructors/mauricio-gomes.jpg",
    intro:
      "Kingston Jiu Jitsu is affiliated to the Mauricio Gomes Legacy Team.",
    body: [
      "Mauricio began training in Jiu-Jitsu at just four years of age. His father, who was a brown belt, started his journey and took him to classes at João Alberto Barreto’s academy.",
      "As a teenager, Mauricio began training with the legendary Rolls Gracie. Under Rolls’ guidance, he became a highly successful competitor and won the absolute division of the Rio de Janeiro State Championships in 1981. Shortly after this victory, Rolls awarded Mauricio his black belt. Mauricio continued training with Rolls until his tragic death in 1982.",
      "Through his close ties with the Gracie family, Mauricio met Reila Gracie, the daughter of Carlos Gracie Sr. The two married, and although their relationship didn’t last, they had a son, Roger Gracie. Roger became a ten-time World Champion and is widely recognised as the greatest Jiu-Jitsu competitor of all time.",
      "In the late 1990s, Mauricio came to the UK and established the very first Gracie Barra gym there. Through his teaching, many new gyms opened, and Brazilian Jiu-Jitsu is now the fastest-growing martial art in the UK. Because of his efforts to grow the sport in the country, Mauricio is affectionately known as the ‘Godfather of British Jiu-Jitsu’.",
      "Mauricio acts as a mentor to Kingston Jiu Jitsu Head Instructor Marc and regularly visits the club to teach classes and seminars and take grades.",
    ],
  },
  {
    slug: "marc-barton",
    name: "Marc Barton",
    rank: "3rd Degree Black Belt",
    role: "Founder & Head Instructor",
    image: "/images/instructors/marc-barton.jpg",
    intro:
      "Marc is the founder and head instructor of Kingston Jiu Jitsu.",
    body: [
      "He has trained in martial arts for most of his life. He began at a young age with ninjutsu, before moving into Shotokan karate in his late teens. He trained in Shotokan for many years and was awarded his 2nd Dan black belt. In 1999, karate took him to Japan, where he spent three months training at the Shotokan Headquarters in Tokyo. That experience shaped how he thinks about discipline, repetition, and long-term skill development.",
      "Marc discovered Brazilian Jiu Jitsu in 2006 after joining the Roger Gracie Academy in London. The art quickly became his main focus. After a decade of training, he was awarded his black belt at the Roger Gracie Academy in December 2016.",
      "Marc is one of a small number of black belts personally mentored by Mauricio Gomes, who introduced Brazilian Jiu Jitsu to the UK in the early 2000s and is the father of Roger Gracie. He was promoted to 3rd-degree black belt by Mauricio Gomes in December 2025.",
    ],
  },
  {
    slug: "yiyang-ng",
    name: "Yiyang Ng",
    rank: "1st Degree Black Belt",
    role: "Instructor",
    image: "/images/instructors/yiyang-ng.jpg",
    intro:
      "Yiyang is a martial arts enthusiast, a medical doctor, and a certified personal trainer. Before discovering Brazilian jiu jitsu and grappling, he spent his younger years training in various striking disciplines, namely Taekwondo, Kungfu and Kickboxing. After almost 14 years of training, Yiyang was promoted to 1st-degree black belt by Marc and Mauricio in December 2025.",
    body: [
      "Yiyang regularly teaches some of our teenage jiu-jitsu classes and helps with the adult classes on an ad hoc basis. In addition to martial arts, he advocates body weight and movement-based workouts and has developed his own training program, which is available here.",
    ],
  },
  {
    slug: "andreas-wichmann",
    name: "Andreas Wichmann",
    rank: "1st Degree Black Belt",
    role: "Instructor",
    image: "/images/instructors/andreas-wichmann.jpg",
    intro:
      "Andreas came to Jiu Jitsu via training in Muay Thai and grappling in his early thirties in 2003. Due to work commitments, he took a break for a few years but returned to Jiu-Jitsu in 2015 to get in shape for his wedding. He hasn’t left us since, and apparently, you can teach an old dog new tricks as he won a gold medal in the NAGA No-Gi competition and silver and bronze medals in IBJFF, NAGA and the Surrey Open Gi. He was awarded his black belt by Marc in December 2022 and promoted to 1st-degree black belt by Marc and Mauricio in December 2025.",
    body: [
      "Andreas’ attention to detail teaching style helps our beginners get up to speed quickly and understand the basic concepts of jiu jitsu. He also very much enjoys stretching and yoga and emphasises it in his warm-ups, having learned the hard way how important flexibility is. Andreas is our competition team captain and runs the Thursday night all-levels classes, which are great for people who want to compete and have more of a focus on sports, jiu-jitsu.",
    ],
  },
  {
    slug: "simon-marshall",
    name: "Simon Marshall",
    rank: "Black Belt",
    role: "Instructor",
    image: "/images/instructors/simon-marshall.jpg",
    intro:
      "Simon has a lifelong passion for martial arts and a diverse background in various disciplines. He has extensive training in Japanese Ju Jitsu, kickboxing, Muay Thai, judo, and Brazilian jiu jitsu. His competitive journey includes ventures in kickboxing, Muay Thai, and Judo, with success in all of them, including a WAKO and AMA British kickboxing title.",
    body: [
      "Simon was promoted to black belt by Marc in September 2024. In addition, he currently holds a brown belt in Judo.",
      "Simon coaches our takedown and transitions sessions and is committed to helping students succeed and grow.",
    ],
  },
  {
    slug: "dan-lau",
    name: "Dan Lau",
    rank: "Black Belt",
    role: "Instructor",
    image: "/images/instructors/dan-lau.jpg",
    intro:
      "Dan is a highly skilled and experienced jiu jitsu practitioner who was promoted to black belt in December 2025 by Marc and Mauricio. He is known for his relaxed and smooth style and for his attention to technical details, which makes him a popular instructor with students of all levels.",
    body: [
      "Dan is dedicated to helping his students improve their techniques and reach their full potential and teaches the Wednesday evening all-levels class. Dan also teaches the Drills and Rolls class every Wednesday, which is a fun class that consists of 30 minutes of timed drilling and 30 minutes sparring.",
    ],
  },
  {
    slug: "clare-barton",
    name: "Clare Barton",
    rank: "Brown Belt",
    role: "Women's Classes & Safeguarding",
    image: "/images/instructors/clare-barton.jpg",
    intro:
      "Clare has been practising martial arts for nearly 30 years, starting with Shotokan karate at university in 1997 and gaining her 1st Dan black belt in 2001. She also travelled to Japan with Marc to train at the Shotokan Headquarters in Tokyo for 3 months in 1999.",
    body: [
      "Clare started her jiu-jitsu journey in 2014 after constant nagging by her kids, taking part in the first Kingston Jiu Jitsu beginner’s course. She fell in love with the art and has continued training ever since. Clare was awarded her brown belt in April 2023. She organises and teaches our women's only classes on Tuesday evenings and is our Designated Safeguarding Officer.",
    ],
  },
  {
    slug: "ray-stokes",
    name: "Ray Stokes",
    rank: "Brown Belt",
    role: "Head Kids Instructor",
    image: "/images/instructors/ray-stokes.jpg",
    intro:
      "Ray is the head instructor of our kids Brazilian jiu jitsu programme.",
    body: [
      "Ray currently holds the rank of brown belt and teaches many of the children's classes throughout the week. He has helped build a children’s curriculum with Marc that ensures a vibrant and enriching class experience.",
      "Ray's contagious passion and enthusiasm for jiu jitsu not only ensure effective learning but also create a safe and fun environment for the children. Beyond teaching techniques, Ray is dedicated to fostering confidence, discipline, and respect in every child. His sessions help children face new challenges, become more resilient and make lasting friendships, instilling confidence in parents about their child's jiu jitsu journey.",
    ],
  },
  {
    slug: "iacopo-sassi",
    name: "Iacopo Sassi",
    rank: "Brown Belt",
    role: "Instructor",
    image: "/images/instructors/iacopo-sassi.jpg",
    intro:
      "Iacopo started training in martial arts at a young age, becoming a brown belt in Shotokan karate in his teens. In the same years, he began teaching kids classes at a local academy in Italy. During these years, he also explored other disciplines, including boxing and self-defence.",
    body: [
      "Iacopo was promoted to brown belt in Brazilian jiu jitsu in December 2025, and he currently teaches children's classes on Sunday afternoons and our Saturday morning adult no-gi class.",
    ],
  },
  {
    slug: "charlie-villaroman",
    name: "Charlie Villaroman",
    rank: "Head Kickboxing Instructor",
    role: "Muay Thai Instructor",
    image: "/images/instructors/charlie-villaroman.jpg",
    intro:
      "Charlie is the head instructor of our Muay Thai kickboxing programme.",
    body: [
      "Charlie began his martial arts training in 2005 with taekwondo, in which he is currently a 2nd Dan black belt. After competing in several tournaments, he became an assistant instructor in 2008. Charlie started training in Muay Thai kickboxing at Roger Gracie Academy in London in 2015, and this quickly became his main focus.",
      "Charlie has gained considerable experience coaching Muay Thai and kickboxing since then. He became a personal trainer in 2018, and most of his clients also train in Muay Thai kickboxing with him. In addition to his considerable experience in the striking arts, Charlie has also been training in Brazilian jiu jitsu since 2011 and currently holds the rank of purple belt.",
    ],
  },
];

export const instructorSlugs = instructors.map((i) => i.slug);

export function getInstructor(slug: string): Instructor | undefined {
  return instructors.find((i) => i.slug === slug);
}
