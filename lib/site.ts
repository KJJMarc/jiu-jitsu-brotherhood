/**
 * Central public site configuration for Jiu Jitsu Brotherhood (Phase 1).
 *
 * Academy-specific KJJ copy remains further down this file for retired routes
 * and is not linked from the public shell.
 */

export const site = {
  name: "Jiu Jitsu Brotherhood",
  shortName: "JJB",
  tagline: "Brazilian Jiu Jitsu",
  description:
    "Since 2007, Jiu Jitsu Brotherhood has shared techniques, ideas and stories from the mats - a content and community home for people who believe there is always more to learn.",
  footerBlurb: "Sharing Jiu Jitsu knowledge since 2007.",
  canonicalOrigin: "https://www.jiujitsubrotherhood.com",
  // Contact details are not approved for Phase 1 public display.
  email: "",
  phone: "",
  phoneHref: "",
} as const;

/**
 * Public shop path. Empty academy keys remain so retired pages still
 * typecheck; they are not linked from the JJB shell and must not point at
 * Dojo Director or KJJ services.
 */
export const externalLinks = {
  shop: "/collections/all",
  freeTrial: "",
  membership: "",
  googleReviews: "",
  beginnersGuide: "",
  library: "",
  onlinePortal: "",
} as const;

/** Social URLs are unset until JJB profiles are approved. */
export const social = {
  facebook: "",
  instagram: "",
  twitter: "",
  youtube: "",
} as const;

/** Training venues (from the live "How to Find Us" page). */
export const venues = [
  {
    name: "Tiffin Sports Centre",
    street: "Queen Elizabeth Road",
    locality: "Kingston upon Thames",
    postcode: "KT2 6RL",
    country: "GB",
    maps: "https://www.google.com/maps/search/?api=1&query=Tiffin+Sports+Centre+Queen+Elizabeth+Road+Kingston+upon+Thames+KT2+6RL",
    // Embed by coordinates with a custom marker label so Google shows a plain
    // pin (no business listing card / ratings / review buttons).
    mapEmbed:
      "https://www.google.com/maps?q=51.4113273,-0.2936959(Tiffin%20Sports%20Centre)&z=16&output=embed",
  },
  {
    name: "St John's Parish Hall",
    street: "Grove Lane",
    locality: "Kingston upon Thames",
    postcode: "KT1 2SU",
    country: "GB",
    maps: "https://www.google.com/maps/search/?api=1&query=St+Johns+Parish+Hall+Grove+Lane+Kingston+upon+Thames+KT1+2SU",
    mapEmbed:
      "https://www.google.com/maps?q=51.402789,-0.299558(St%20John%27s%20Parish%20Hall)&z=16&output=embed",
  },
] as const;

export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
  /** Render as a non-clickable label (dropdown trigger only). */
  nolink?: boolean;
  children?: NavItem[];
};

/**
 * Public navigation: preserved Shopify destinations (Phase 2B).
 */
export const primaryNav: NavItem[] = [
  { label: "About", href: "/pages/about" },
  { label: "Articles", href: "/blogs/blog" },
  { label: "Techniques", href: "/blogs/techniques" },
  { label: "Free Stuff", href: "/#free-stuff" },
  {
    label: "Club Network",
    href: "/pages/jiu-jitsu-brotherhood-club-network",
  },
  { label: "Shop", href: externalLinks.shop },
  { label: "Contact", href: "/pages/contact" },
];

/** Footer Explore group — content-first destinations. */
export const footerExploreNav: NavItem[] = [
  { label: "Articles", href: "/blogs/blog" },
  { label: "Techniques", href: "/blogs/techniques" },
  { label: "Free Stuff", href: "/#free-stuff" },
  { label: "About", href: "/pages/about" },
];

/** Footer Shop group. */
export const footerShopNav: NavItem[] = [
  { label: "Shop", href: externalLinks.shop },
  { label: "Bag", href: "/cart" },
];

/** Footer Information group — existing canonical routes only. */
export const footerInfoNav: NavItem[] = [
  { label: "Contact", href: "/pages/contact" },
  { label: "Privacy", href: "/pages/privacy-policy" },
  { label: "Cookies", href: "/cookie-policy" },
  { label: "Terms", href: "/pages/terms-conditions" },
];

export type ClassCard = {
  title: string;
  slug: string;
  href: string;
  image: string;
  alt: string;
  body: string;
};

/** Class/programme content (copy verbatim from the WordPress homepage). */
export const classes: ClassCard[] = [
  {
    title: "Adult Classes",
    slug: "adult",
    href: "/adult-classes/",
    image: "/images/classes/adult-classes.jpg",
    alt: "Kingston Jiu Jitsu adult class training on the mats",
    body: "Explore our full range of adult classes, including beginner and advanced level jiu jitsu, as well as a no-gi grappling programme, women's only, wrestling and Muay Thai kickboxing classes.",
  },
  {
    title: "Kids' Classes",
    slug: "kids",
    href: "/kids-classes/",
    image: "/images/classes/kids-classes.jpg",
    alt: "Children training in a Kingston Jiu Jitsu kids class",
    body: "Brazilian Jiu Jitsu is an excellent form of self-defence and a great way for kids to learn self-confidence, discipline, body awareness and balance. Our classes are designed to be fun and focus on learning through play and games.",
  },
  {
    title: "Beginners' Classes",
    slug: "beginners",
    href: "/beginners-classes/",
    image: "/images/classes/beginners-classes.jpg",
    alt: "Beginners learning fundamentals at Kingston Jiu Jitsu",
    body: "Our beginner's classes are the ideal introduction to Brazilian Jiu Jitsu (BJJ) and are designed to give students a strong foundation in all aspects of BJJ, including self-defence, takedowns and the fundamentals of ground fighting.",
  },
  {
    title: "No-Gi Classes",
    slug: "no-gi",
    href: "/no-gi-classes/",
    image: "/images/classes/no-gi-classes.jpg",
    alt: "No-gi grappling class at Kingston Jiu Jitsu",
    body: "Our no-gi grappling programme is ideal for martial artists who want to learn the basics of the ground game without using a Gi. These classes have a more wrestling-based approach and suit students interested in MMA and wrestling.",
  },
  {
    title: "Women's Classes",
    slug: "womens",
    href: "/ladies-classes/",
    image: "/images/classes/womens-classes.jpg",
    alt: "Women's only Brazilian Jiu Jitsu class at Kingston Jiu Jitsu",
    body: "Our women's classes provide a safe and supportive environment for women to train. Brazilian Jiu-Jitsu is the perfect martial art for women interested in learning how to protect themselves, as it allows smaller people to overcome larger opponents using technique and leverage.",
  },
  {
    title: "Open Mats",
    slug: "open-mats",
    href: "/open-mats/",
    image: "/images/classes/open-mats.jpg",
    alt: "Members rolling together during an open mat session",
    body: "Open mats are a great chance for members to come together, roll and share knowledge in a relaxed setting. They provide the perfect environment to sharpen your skills, try new techniques and connect with your teammates.",
  },
  {
    title: "Takedowns 'n' Transitions",
    slug: "tnt",
    href: "/tnt-takedowns-n-transitions/",
    image: "/images/classes/tnt.jpg",
    alt: "Takedown and transition drilling at Kingston Jiu Jitsu",
    body: "Our TNT class features a blend of BJJ-specific takedowns and fluid transitions into ground fighting techniques. It is a fun class that is suitable for all skill levels.",
  },
  {
    title: "Muay Thai Classes",
    slug: "muay-thai",
    href: "/muay-thai-classes/",
    image: "/images/classes/muay-thai-classes.jpg",
    alt: "Muay Thai kickboxing class at Kingston Jiu Jitsu",
    body: "Our Muay Thai kickboxing sessions are suitable for individuals of all skill levels and provide the ideal atmosphere for refining striking skills.",
  },
  {
    title: "Seminars & Events",
    slug: "seminars",
    href: "/seminars-and-events/",
    image: "/images/classes/seminars-events.jpg",
    alt: "Kingston Jiu Jitsu seminar with a visiting instructor",
    body: "Our seminars and events programme brings world-class instructors, specialist workshops, competitions and social gatherings to the academy throughout the year.",
  },
];

export type Testimonial = { quote: string; author: string };

/** Genuine member reviews from the WordPress homepage. */
export const testimonials: Testimonial[] = [
  {
    quote:
      "Our family loves Kingston Jiu Jitsu! When our son expressed an interest in learning Jiu Jitsu, we followed the advice of a friend and took him to a taster session with KJJ. Now several years on, all three of our children train with KJJ and we couldn't be happier with the family-like atmosphere of the club. The coaches are incredibly approachable and no question is silly. But I think the best part is seeing my children develop confidence, skill and enthusiasm about the sport. Thank you Marc, Clare and team!",
    author: "Karen Barrett",
  },
  {
    quote:
      "My son has been attending classes at the club for many years now and he still loves it as much now as he did then. The trainers are wonderful, really helpful and encouraging and really know their stuff. It's a safe and wonderful environment for the kids to improve their skills.",
    author: "Agon Hadri",
  },
  {
    quote:
      "I've been training at KJJ for just under a year and I'm absolutely loving it. I started off only doing the women's class which is run by Clare, who is super supportive and inspiring and has developed an amazing group of KJJ women! I quickly found jiu jitsu quite addictive and now go to as many classes as I can a week. The club has a very friendly and inviting atmosphere and all of the instructors are brilliant. Marc and Clare have created a really special community! If you're thinking about joining, you should 100% do it!",
    author: "Alex Rose",
  },
  {
    quote:
      "Amazing club run by amazing people. Every teacher is extremely knowledgeable and professional and creates a safe environment where you can learn BJJ at your own pace. The club is super friendly and welcoming with lots of lessons for all different levels. Would definitely recommend for first-time martial artists or experienced ones who want to try something new.",
    author: "Adam Goodsearles",
  },
  {
    quote:
      "My children have been training with the club since before the pandemic. The team did a brilliant job keeping in touch online during that time and now it's great to be back on the mats in person. The club is super friendly and the instructors are encouraging of the kids and very responsive to parents. Highly recommend it for anyone wanting to learn jiu jitsu. Thanks Clare, Marc and team for all you do.",
    author: "Lidia Rumley",
  },
  {
    quote:
      "There are so many good things to say about this club, from the superb class instructors to the variety of classes and the friendly sparring partners — it really does have it all! Ultimately it is a place to come and forget about the daily grind. I was lucky enough to train in Brazil and it is definitely comparable to the classes there. If in doubt, come and try a couple of classes and see for yourself. Hope to see you there!",
    author: "Delia Miru",
  },
];

export type MembershipTier = {
  name: string;
  price: string;
  term: string;
  points: string[];
  badge?: string;
  featured?: boolean;
};

export type MembershipGroup = {
  heading: string;
  intro: string;
  tiers: MembershipTier[];
};

/** Membership options (from the WordPress "Join Us" page, id 1112368). */
export const membershipGroups: MembershipGroup[] = [
  {
    heading: "Adult memberships",
    intro: "For adults training at Kingston Jiu Jitsu.",
    tiers: [
      {
        name: "12 Month Adult Full Membership",
        price: "£89/month",
        term: "12 month agreement",
        badge: "Best monthly price",
        points: [
          "Includes BJJ, Muay Thai and Strength & Conditioning",
          "Suitable for regular training across multiple programmes",
          "Best value adult option",
        ],
      },
      {
        name: "6 Month Adult Full Membership",
        price: "£99/month",
        term: "6 month agreement",
        badge: "Shorter commitment",
        points: [
          "Includes BJJ, Muay Thai and Strength & Conditioning",
          "Shorter commitment with more flexibility",
        ],
      },
      {
        name: "Beginner's Only Membership",
        price: "£59/month",
        term: "6 month agreement",
        badge: "Good for beginners",
        points: [
          "Monday beginner class and Friday fundamentals class",
          "Ideal for complete beginners",
        ],
      },
      {
        name: "Women's Only Class Membership",
        price: "£49/month",
        term: "6 month agreement",
        points: [
          "Women's only class membership",
          "Supportive training environment and a great entry point",
        ],
      },
      {
        name: "Discount Membership",
        price: "£75/month",
        term: "6 month agreement",
        points: [
          "For military and emergency services staff",
          "Proof of eligibility may be requested",
        ],
      },
      {
        name: "Muay Thai Only Membership",
        price: "£69/month",
        term: "6 month agreement",
        points: ["For Muay Thai classes only", "Ideal if you are not training BJJ"],
      },
    ],
  },
  {
    heading: "Short-term memberships",
    intro: "Flexible 3-month options with no long-term commitment.",
    tiers: [
      {
        name: "3 Month Adult Full Membership",
        price: "£109/month",
        term: "3 month agreement",
        badge: "No long-term commitment",
        points: [
          "Includes BJJ, Muay Thai and Strength & Conditioning",
          "Maximum flexibility — pro rata payment applies",
        ],
      },
      {
        name: "3 Month Beginner's Only Membership",
        price: "£69/month",
        term: "3 month agreement",
        badge: "Perfect for beginners",
        points: [
          "Monday beginner class and Friday fundamentals class",
          "Pro rata payment applies",
        ],
      },
      {
        name: "3 Month Muay Thai Only Membership",
        price: "£79/month",
        term: "3 month agreement",
        badge: "Muay Thai only",
        points: ["For Muay Thai classes only", "Pro rata payment applies"],
      },
    ],
  },
  {
    heading: "Kids memberships",
    intro: "For junior students training at Kingston Jiu Jitsu Kids.",
    tiers: [
      {
        name: "Ages 5–10: 1 Term",
        price: "£37.50/month",
        term: "4 month agreement",
        points: ["Kids classes for ages 5–10", "One term membership"],
      },
      {
        name: "Ages 5–10: 3 Terms",
        price: "£32.50/month",
        term: "12 month agreement",
        points: ["Kids classes for ages 5–10", "Best value for this age group"],
      },
      {
        name: "Ages 11–15: 1 Term",
        price: "£40/month",
        term: "4 month agreement",
        points: ["Junior classes for ages 11–15", "One term membership"],
      },
      {
        name: "Ages 11–15: 3 Terms",
        price: "£35/month",
        term: "12 month agreement",
        points: ["Junior classes for ages 11–15", "Best value for this age group"],
      },
      {
        name: "All Inclusive Kids Membership",
        price: "£65/month",
        term: "6 month agreement",
        points: [
          "For children training more frequently",
          "Access to more eligible kids classes",
        ],
      },
    ],
  },
];
