import {
  Home,
  LayoutDashboard,
  User,
  Users,
  MessageSquare,
  ShoppingBag,
  Briefcase,
  Calendar,
  Gift,
  CreditCard,
  Newspaper,
  Heart,
  Shield,
  Settings,
  Trophy,
  UserPlus,
  Edit,
  Globe,
  Star,
  Search,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  description?: string
  adminOnly?: boolean
}

export const siteConfig = {
  name: "Light Alumni Connect",
  description: "Connect with fellow alumni from Light Group of Schools",
  url: "https://lightalumni.com",
  links: {
    facebook: "https://facebook.com/lightalumni",
    twitter: "https://twitter.com/lightalumni",
    linkedin: "https://linkedin.com/company/lightalumni",
    instagram: "https://instagram.com/lightalumni",
  },
}

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Your personal alumni hub",
  },
  {
    title: "Search",
    href: "/search",
    icon: Search,
    description: "Find people, jobs, listings and posts",
  },
]

export const socialNavItems: NavItem[] = [
  {
    title: "Community Feed",
    href: "/feed",
    icon: MessageSquare,
    description: "Connect with fellow alumni",
  },
  {
    title: "Directory",
    href: "/members",
    icon: Globe,
    description: "Directory of all alumni",
  },
  {
    title: "My Network",
    href: "/friends",
    icon: UserPlus,
    description: "Manage your connections",
  },
  {
    title: "Clubs",
    href: "/clubs",
    icon: Users,
    description: "Join interest-based groups",
  },
  {
    title: "Events",
    href: "/events",
    icon: Calendar,
    description: "Upcoming alumni events",
  },
]

export const commerceNavItems: NavItem[] = [
  {
    title: "Career Hub",
    href: "/careers",
    icon: Briefcase,
    description: "Jobs and CV submissions",
  },
  {
    title: "Marketplace",
    href: "/marketplace",
    icon: ShoppingBag,
    description: "Buy and sell with alumni",
  },
  {
    title: "Perks",
    href: "/perks",
    icon: Gift,
    description: "Exclusive member discounts",
  },
]

export const accountNavItems: NavItem[] = [
  {
    title: "My Profile",
    href: "/profile",
    icon: User,
    description: "Manage your profile",
  },
  {
    title: "Leaderboard",
    href: "/leaderboard",
    icon: Trophy,
    description: "Points & rankings",
  },
  {
    title: "Payments",
    href: "/payments",
    icon: CreditCard,
    description: "Membership payments",
  },
  {
    title: "Give Back",
    href: "/giving",
    icon: Heart,
    description: "Support school initiatives",
  },
]

export const adminNavItems: NavItem[] = [
  {
    title: "Admin Dashboard",
    href: "/admin",
    icon: Shield,
    description: "Manage users and view analytics",
    adminOnly: true,
  },
  {
    title: "CMS Management",
    href: "/admin/cms",
    icon: Edit,
    description: "Manage website content",
    adminOnly: true,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Platform settings",
    adminOnly: true,
  },
]

export const managementNavItems: NavItem[] = [
  {
    title: "CMS Portal",
    href: "/cms-portal",
    icon: Edit,
    description: "Manage landing page",
    adminOnly: true,
  },
  {
    title: "Clubs Manager",
    href: "/admin/clubs",
    icon: Users,
    description: "Manage clubs",
    adminOnly: true,
  },
  {
    title: "Jobs Manager",
    href: "/admin/jobs",
    icon: Briefcase,
    description: "Manage job listings",
    adminOnly: true,
  },
  {
    title: "Marketplace Manager",
    href: "/admin/marketplace",
    icon: ShoppingBag,
    description: "Manage products",
    adminOnly: true,
  },
  {
    title: "Donations Manager",
    href: "/admin/donations",
    icon: Heart,
    description: "Manage campaigns",
    adminOnly: true,
  },
]
