/**
 * Default editable content for every public page, keyed by page slug.
 *
 * Both the public pages (via usePageContent) and the admin CMS "Pages" tab
 * import these. The page renders defaults instantly and merges any stored
 * `page:<slug>` content over them; the CMS seeds its structured editor from the
 * same defaults so admins can edit a page even before it has been touched.
 */
export const PAGE_DEFAULTS: Record<string, any> = {
  features: {
    headings: {
      pillars: { eyebrow: "The platform", title: "Everything You Need to Stay Connected", subtitle: "A complete toolkit to network, grow your career, and give back to the community that shaped you." },
      process: { eyebrow: "Getting started", title: "Up and Running in Three Steps", subtitle: "Joining the network takes less than two minutes." },
      showcase: { eyebrow: "Why it matters", title: "Built for Lifelong Connection" },
    },
    pillars: {
      items: [
        { title: "Professional Networking", description: "Connect with alumni across industries and leverage our global network for opportunities.", icon: "Briefcase" },
        { title: "Exclusive Events", description: "Access reunions, workshops, webinars and networking events all year round.", icon: "Calendar" },
        { title: "Give Back", description: "Support current students through scholarships and mentorship programs.", icon: "Heart" },
        { title: "Member Perks", description: "Enjoy exclusive discounts from alumni-owned businesses worldwide.", icon: "Star" },
        { title: "Loyalty Rewards", description: "Earn points for engagement and compete on the leaderboard for annual gifts.", icon: "Trophy" },
        { title: "Alumni Card", description: "Coming soon: spend loyalty points at participating alumni businesses.", icon: "CreditCard" },
      ],
    },
    process: {
      steps: [
        { title: "Create your profile", description: "Sign up with your class year and campus to join your cohort." },
        { title: "Connect & explore", description: "Find classmates, browse events, jobs, perks and the marketplace." },
        { title: "Grow & give back", description: "Earn points, mentor students and unlock member rewards." },
      ],
    },
    showcase: {
      title: "More than a directory — a living community",
      body: "From your first login you can pick up old friendships, discover new opportunities and contribute to the next generation of Light Academy graduates.",
      image_url: "",
      bullets: ["Verified alumni-only network", "Career & mentorship matching", "Events across every campus", "Rewards for staying engaged"],
    },
    cta: { title: "Ready to shine together?", subtitle: "Join thousands of Light Academy alumni already on the platform.", button: "Get Started Free" },
  },

  "public-events": {
    headings: {
      upcoming: { eyebrow: "What's on", title: "Upcoming Events", subtitle: "Reconnect, network and grow with fellow alumni at our next gatherings." },
      categories: { eyebrow: "Find your fit", title: "Browse by Category", subtitle: "From career workshops to reunions — there's something for everyone." },
      highlights: { eyebrow: "Memories", title: "Highlights From Past Events", subtitle: "A glimpse of the moments our community has shared." },
    },
    categories: {
      items: [
        { title: "Networking", description: "Meet alumni across industries.", image_url: "" },
        { title: "Reunions", description: "Celebrate with your class.", image_url: "" },
        { title: "Workshops", description: "Learn new skills together.", image_url: "" },
        { title: "Social", description: "Relax and have fun.", image_url: "" },
      ],
    },
    highlights: {
      items: [{ image_url: "" }, { image_url: "" }, { image_url: "" }, { image_url: "" }, { image_url: "" }, { image_url: "" }],
    },
    cta: { title: "Want to host your own event?", subtitle: "Alumni can propose and run events for the community. Sign in to get started.", button: "Create an Event" },
  },

  testimonials: {
    headings: {
      grid: { eyebrow: "In their words", title: "Voices From the Network", subtitle: "Real stories from alumni who found connection, opportunity and purpose through the Light Alumni Network." },
      stats: { eyebrow: "By the numbers", title: "A Community That Keeps Growing", subtitle: "Thousands of graduates, spread across the globe, all part of one network." },
    },
    featured: {
      quote: "The Light Alumni Network reconnected me with classmates I had lost touch with for over a decade — and one of those reunions turned into the business partnership that changed my career.",
      author: "Amina Yusuf",
      role: "Class of 2009 · Founder, Brightpath Ventures",
      image_url: "",
    },
    grid: {
      items: [
        { quote: "I landed my first role abroad through a referral from a fellow alum I met on the platform. The network truly opens doors.", author: "Daniel Okeke", role: "Class of 2014 · Software Engineer" },
        { quote: "Mentoring current students has been the most rewarding way to give back. The platform makes it effortless to stay involved.", author: "Fatima Hassan", role: "Class of 2007 · Pediatrician" },
        { quote: "From reunions to career workshops, there is always something happening. It feels like the community never graduated.", author: "Joseph Mwangi", role: "Class of 2011 · Marketing Director" },
        { quote: "The marketplace and member perks alone have paid for themselves. But the friendships are what keep me coming back.", author: "Grace Adeyemi", role: "Class of 2016 · Architect" },
        { quote: "I proposed an event and within a week alumni from three continents had signed up. The reach of this network is incredible.", author: "Samuel Tesfaye", role: "Class of 2010 · Civil Engineer" },
        { quote: "Being part of the leaderboard turned giving back into something fun. Earning points while supporting students is brilliant.", author: "Nadia Rahman", role: "Class of 2013 · Financial Analyst" },
      ],
    },
    stats: {
      items: [
        { value: "12,500+", label: "Alumni connected" },
        { value: "45+", label: "Countries represented" },
        { value: "98%", label: "Would recommend" },
      ],
    },
    cta: { title: "Have a story to share?", subtitle: "Your journey could inspire the next generation of Light Academy graduates. Add your voice to the network.", button: "Share your story" },
  },

  "video-gallery": {
    headings: {
      gallery: { eyebrow: "The collection", title: "Moments Worth Replaying", subtitle: "Browse highlights from graduations, reunions, workshops and the everyday magic of our alumni community." },
      playlists: { eyebrow: "Browse by theme", title: "Curated Playlists", subtitle: "Jump straight to the moments that matter most to you." },
    },
    featured: {
      title: "2024 Graduation Ceremony",
      subtitle: "Watch the full highlight reel from our biggest class yet.",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      image_url: "/kenyan-university-graduation-ceremony-students-in-.jpg",
    },
    gallery: {
      items: [
        { title: "Alumni Networking Night", subtitle: "Connections that last a lifetime", video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", image_url: "/african-professionals-networking-event-nairobi-ken.jpg", size: "wide" },
        { title: "Alumni Sports Day", subtitle: "Friendly rivalry, fierce fun", video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", image_url: "/kenyan-students-playing-football-soccer-sports-day.jpg", size: "tall" },
        { title: "Career Workshop", subtitle: "Learning from the best", video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", image_url: "/african-professional-giving-presentation-career-wo.jpg", size: "" },
        { title: "Alumni Gala Dinner", subtitle: "An evening to remember", video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", image_url: "/elegant-african-gala-dinner-event-formal-attire-ke.jpg", size: "large" },
        { title: "Class Reunion", subtitle: "Old friends, new stories", video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", image_url: "/placeholder.jpg", size: "" },
        { title: "Mentorship Stories", subtitle: "Paying it forward", video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", image_url: "/placeholder.jpg", size: "wide" },
      ],
    },
    playlists: {
      items: [
        { title: "Graduations", description: "Caps, gowns and cheers.", image_url: "" },
        { title: "Reunions", description: "Reconnecting across the years.", image_url: "" },
        { title: "Workshops", description: "Skills and inspiration.", image_url: "" },
        { title: "Socials", description: "Celebrating together.", image_url: "" },
      ],
    },
    cta: { title: "Have a clip to share?", subtitle: "Alumni-submitted videos help us tell our story. Sign in to contribute your moments.", button: "Go to Dashboard" },
  },

  "public-perks": {
    headings: {
      partners: { eyebrow: "Member benefits", title: "Featured Partners", subtitle: "Exclusive discounts from alumni-owned businesses — show your membership card to redeem." },
      process: { eyebrow: "How it works", title: "Save in Three Simple Steps", subtitle: "Your alumni status is your ticket to exclusive savings." },
      showcase: { eyebrow: "Why it matters", title: "Support alumni, save money" },
    },
    featuredPerks: [
      { business: "Apex Auto Care", description: "Premium servicing and detailing for every make and model.", discount: "15% off all services", category: "Automotive", owner: "Class of '09" },
      { business: "Meridian Legal", description: "Trusted counsel for contracts, property and family matters.", discount: "Free first consultation", category: "Legal", owner: "Class of '04" },
      { business: "Lumen Studios", description: "Portrait, event and brand photography that tells your story.", discount: "20% off bookings", category: "Photography", owner: "Class of '15" },
      { business: "Summit Marketing", description: "Growth campaigns, branding and social for ambitious businesses.", discount: "10% retainer discount", category: "Marketing", owner: "Class of '11" },
      { business: "Wander Travel Co.", description: "Curated getaways and group trips for alumni and family.", discount: "Member-only fares", category: "Travel", owner: "Class of '07" },
      { business: "Vital Fitness Club", description: "Strength, mobility and wellness coaching all under one roof.", discount: "First month free", category: "Health & Fitness", owner: "Class of '13" },
      { business: "Harbor & Co. Shop", description: "Locally made goods, gifts and lifestyle essentials.", discount: "12% off in-store", category: "Shopping", owner: "Class of '18" },
      { business: "Bright Books Services", description: "Bookkeeping, tax and advisory for founders and freelancers.", discount: "15% off packages", category: "Business Services", owner: "Class of '06" },
    ],
    process: {
      steps: [
        { title: "Join the network", description: "Sign in with your class year and campus to unlock member benefits.", icon: "IdCard" },
        { title: "Show your alumni card", description: "Present your digital membership card in-store or at checkout.", icon: "Handshake" },
        { title: "Enjoy the discount", description: "Redeem your exclusive offer and support a fellow graduate.", icon: "PartyPopper" },
      ],
    },
    showcase: {
      title: "Every perk supports a fellow graduate",
      body: "When you shop with our partners you save money and reinvest in the Light Academy community — keeping alumni businesses thriving for years to come.",
      image_url: "",
      bullets: ["Verified alumni-owned businesses", "Discounts across every category", "New partners added regularly", "No membership fees, ever"],
    },
    cta: { title: "Own a business? Become a partner.", subtitle: "List your business and offer exclusive perks to thousands of fellow alumni.", button: "List your business" },
  },

  "public-leaderboard": {
    headings: {
      podium: { eyebrow: "Friendly competition", title: "Top Of The Class", subtitle: "Our most engaged alumni, ranked by the points they have earned across the community." },
      rankings: { eyebrow: "The standings", title: "Full Rankings", subtitle: "Every alumni member ranked by total points. Climb the board by staying active." },
      earn: { eyebrow: "Get involved", title: "How To Earn Points", subtitle: "Engage with the community and watch your score grow — the highest scorer wins the annual gift." },
    },
    earn: {
      items: [
        { title: "Sell in the marketplace", description: "Earn points for every completed sale to fellow alumni.", points: "50 pts", icon: "ShoppingBag" },
        { title: "Make a purchase", description: "Support alumni businesses and rack up points with each buy.", points: "10 pts", icon: "CreditCard" },
        { title: "Join clubs & events", description: "Show up, connect and contribute to community gatherings.", points: "", icon: "Users" },
      ],
      prize: {
        title: "End Year Prize",
        description: "The alumni member with the highest points at the close of the year wins an exclusive gift at the Annual Alumni Party.",
      },
    },
    cta: { title: "Ready to climb the leaderboard?", subtitle: "Sign in, get active in the community and start earning points today.", button: "Start earning points" },
  },
}

export const EDITABLE_PAGES = [
  { slug: "features", label: "Features" },
  { slug: "public-events", label: "Events" },
  { slug: "public-perks", label: "Perks" },
  { slug: "public-leaderboard", label: "Leaderboard" },
  { slug: "testimonials", label: "Testimonials" },
  { slug: "video-gallery", label: "Video Gallery" },
]

/** Default hero content per page. `home` is stored as section_name `hero`,
 *  every other page as `hero:<slug>`. Mirrors each page's hero fallbacks. */
export const HERO_DEFAULTS: Record<string, any> = {
  home: {
    badge: "Welcome to the future of alumni networking",
    title: "Where Light Alumni Shine Together",
    description: "Join the official alumni network of Light Group of Schools. Connect with fellow graduates, advance your career, and give back to the community that shaped you.",
    images: [],
    image_opacity: 12,
  },
  features: {
    badge: "Tailored for graduates",
    title: "Platform Features",
    description: "Explore the tools and benefits designed for our alumni community.",
    images: [],
    image_opacity: 12,
  },
  "public-events": {
    badge: "Join our next gathering",
    title: "Alumni Events & Meetups",
    description: "Reconnect, network, and grow with fellow alumni. Browse our upcoming professional and social events.",
    images: [],
    image_opacity: 12,
  },
  "public-perks": {
    badge: "Member benefits",
    title: "Exclusive Alumni Perks",
    description: "Unlock discounts and special offers from alumni-owned businesses around the world. A little reward for staying connected.",
    images: [],
    image_opacity: 12,
  },
  "public-leaderboard": {
    badge: "Friendly competition",
    title: "Alumni Points Leaderboard",
    description: "Earn points by staying active in the community — selling, buying, joining clubs and showing up to events. The highest scorer wins an exclusive gift at the Annual Alumni Party.",
    images: [],
    image_opacity: 12,
  },
  testimonials: {
    badge: "Community Voices",
    title: "Success Stories",
    description: "Hear from our alumni about how the Light Alumni Network has shaped their journeys, careers and friendships.",
    images: [],
    image_opacity: 12,
  },
  "video-gallery": {
    badge: "Memorable Moments",
    title: "Video Gallery",
    description: "Relive the best moments from our alumni events, reunions and celebrations.",
    images: [],
    image_opacity: 12,
  },
}

/** Legacy global landing sections (home page + the classic CMS tabs). */
export const GLOBAL_DEFAULTS: Record<string, any> = {
  stats: {
    items: [
      { label: "Active Alumni", value: "12,500+", icon: "Users" },
      { label: "Countries", value: "45+", icon: "Globe" },
      { label: "Career Connections", value: "3,200+", icon: "Briefcase" },
      { label: "Events Hosted", value: "500+", icon: "Calendar" },
    ],
  },
  features: {
    title: "Everything You Need to Stay Connected",
    subtitle: "Our platform offers comprehensive tools to help you network, grow, and give back.",
    items: PAGE_DEFAULTS.features.pillars.items,
  },
  testimonials: {
    title: "Trusted by Alumni Worldwide",
    items: PAGE_DEFAULTS.testimonials.grid.items,
  },
  video_gallery: {
    title: "Video Gallery",
    subtitle: "Relive the best moments from our alumni events and reunions.",
    items: PAGE_DEFAULTS["video-gallery"].gallery.items,
  },
}

/** Every page that should exist in the Page Builder (cms_pages). */
export const ALL_PUBLIC_PAGES = [
  { slug: "home", title: "Home" },
  { slug: "features", title: "Features" },
  { slug: "public-events", title: "Events" },
  { slug: "public-perks", title: "Perks" },
  { slug: "public-leaderboard", title: "Leaderboard" },
  { slug: "testimonials", title: "Testimonials" },
  { slug: "video-gallery", title: "Video Gallery" },
]
