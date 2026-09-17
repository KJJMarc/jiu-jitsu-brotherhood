export const BLOG_INDEX_TITLES: Record<string, { title: string; eyebrow: string; description: string }> =
  {
    blog: {
      title: "Articles",
      eyebrow: "Articles",
      description: "Writing from Jiu Jitsu Brotherhood.",
    },
    techniques: {
      title: "Techniques",
      eyebrow: "Techniques",
      description: "Technique notes from Jiu Jitsu Brotherhood.",
    },
    news: {
      title: "News",
      eyebrow: "News",
      description: "News from Jiu Jitsu Brotherhood.",
    },
    videos: {
      title: "Videos",
      eyebrow: "Videos",
      description: "Videos from Jiu Jitsu Brotherhood.",
    },
    articles: {
      title: "Blog",
      eyebrow: "Blog",
      description: "Blog index from Jiu Jitsu Brotherhood.",
    },
    podcast: {
      title: "Podcasts",
      eyebrow: "Podcasts",
      description: "Podcasts from Jiu Jitsu Brotherhood.",
    },
  };

export const EMPTY_BLOG_HANDLES = ["news", "videos", "articles", "podcast"] as const;
