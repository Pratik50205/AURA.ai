// ============================================================================
// AURA.ai - Centralized Site Configuration & Types
// ============================================================================

export const siteConfig = {
  name: "AURA.ai",
  tagline: "AI Tool Discovery & Recommendation Platform",
  description:
    "Stop searching endlessly. Tell AURA what you need, and our semantic engine will find the most trusted and efficient AI utilities instantly.",
  url: "https://aura-ai.com",
  email: "hello@aura-ai.com",
  social: {
    twitter: "https://twitter.com/aura_ai",
    github: "https://github.com/aura-ai",
    discord: "https://discord.gg/aura-ai",
  },
};

// ============================================================================
// Types
// ============================================================================

export type Tool = {
  id: string;
  name: string;
  pricing: string;
  category: ToolCategory;
  description: string;
  icon: string;
  url: string;
  trustScore: number;
  users: string;
  tags: string[];
  verified: boolean;
  // Extended fields for tool details
  bestPrompts?: PromptExample[];
  useCases?: UseCase[];
  keyFeatures?: string[];
  pros?: string[];
  cons?: string[];
  alternatives?: string[]; // tool IDs
  pricingDetails?: PricingDetail[];
  // Phase 2+ fields
  embeddings?: number[];
  reviews?: Review[];
  affiliateUrl?: string;
};

export type PromptExample = {
  title: string;
  prompt: string;
  description?: string;
  category: string;
};

export type UseCase = {
  title: string;
  description: string;
  targetAudience?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
};

export type PricingDetail = {
  plan: string;
  price: string;
  features: string[];
  isPopular?: boolean;
};

export type ToolCategory = string;

export type Review = {
  id: string;
  toolId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  profession: string;
  company: string;
  bio: string;
  savedTools: string[];
  preferences: UserPreferences;
  createdAt: string;
};

export type UserPreferences = {
  darkMode: boolean;
  emailNotifications: boolean;
  language: string;
  defaultCategory: ToolCategory | 'All';
};

export type NavItem = {
  icon: string;
  label: string;
  href: string;
  badge?: string;
};

export type FilterOption = {
  key: string;
  label: string;
  count?: number;
};

export type SearchResult = {
  tool: Tool;
  score: number;
  matchedFields: string[];
};

export type TrustScoreFactors = {
  communityRating: number;
  verificationStatus: number;
  recency: number;
  usageVolume: number;
  reviewSentiment: number;
};

// ============================================================================
// Navigation & UI Config (icon names as strings for serialization)
// ============================================================================

export const navItems: NavItem[] = [
  { icon: 'Home', label: 'Dashboard', href: '/dashboard' },
  { icon: 'Compass', label: 'Discover', href: '/discover' },
  { icon: 'Bookmark', label: 'Saved Tools', href: '/saved' },
  { icon: 'Settings', label: 'Settings', href: '/settings' },
];

export const categories: FilterOption[] = [
  { key: 'All', label: 'All Categories' },
  { key: 'AI Tools', label: 'AI Tools' },
  { key: 'Design', label: 'Design' },
  { key: 'Productivity', label: 'Productivity' },
  { key: 'Developer', label: 'Developer' },
  { key: 'Writing', label: 'Writing' },
  { key: 'Video', label: 'Video' },
  { key: 'Audio', label: 'Audio' },
];

export const pricingOptions: FilterOption[] = [
  { key: 'All', label: 'All Pricing' },
  { key: 'Free', label: 'Free' },
  { key: 'Freemium', label: 'Freemium' },
  { key: 'Premium', label: 'Premium' },
];
