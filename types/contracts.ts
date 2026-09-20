import type { BusinessThemeId } from "./theme.ts";
import type { JobEngagement, JobPaymentType, JobPostStatus } from "./job.ts";
import type { ApplicationStatus } from "./application.ts";
import type { InvoiceStatus } from "./invoice.ts";

export const CONTRACT_VERSION = "1.0.0";

/**
 * User Contract (Mobile & Business Parity)
 */
export interface AppUserContract {
  version: string;
  id: string;
  displayName: string;
  email: string;
  role: "ADMIN" | "MEMBER" | "TALENT";
  avatarUrl?: string;
  walletAddress?: string;
}

/**
 * Organization / Workspace Contract
 */
export interface AppOrganizationContract {
  version: string;
  id: string;
  name: string;
  handle: string;
  verified: boolean;
  network: "Solana Devnet" | "Solana Mainnet";
}

/**
 * Job Post Contract (Mobile Opportunity Feed & Business Posting)
 */
export interface AppJobPostContract {
  version: string;
  id: string;
  organizationId: string;
  title: string;
  category: string;
  summary: string;
  skills: string[];
  hashtags: string[];
  workMode: "REMOTE";
  locationScope: string;
  engagement: JobEngagement;
  paymentType: JobPaymentType;
  budgetMinMinor: string;
  budgetMaxMinor: string;
  currency: "USDC";
  duration: string;
  applicationDeadline: string;
  status: JobPostStatus;
  notifyMatchingTalent: boolean;
  applicantCount: number;
  createdAt: string;
  publishedAt?: string;
}

/**
 * Candidate Application Contract (Talent Application & Employer Review)
 */
export interface AppApplicationContract {
  version: string;
  id: string;
  jobId: string;
  jobTitle: string;
  applicantUserId?: string;
  candidateName: string;
  headline: string;
  email: string;
  location: string;
  matchScore: number;
  skills: string[];
  coverNote: string;
  portfolioLabel?: string;
  availability: string;
  status: ApplicationStatus;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice & Payment Request Contract (Business Invoicing & Mobile Checkout)
 */
export interface AppInvoiceContract {
  version: string;
  id: string;
  invoiceNumber: string;
  organizationId: string;
  contractorId: string;
  description: string;
  sourceAmountMinor: string;
  sourceCurrency: "USDC";
  dueDate: string;
  status: InvoiceStatus;
  paymentRequestId: string;
  createdAt: string;
}

/**
 * Community Post Contract (Social Feed & Business Engagement)
 */
export interface AppCommunityPostContract {
  version: string;
  id: string;
  content: string;
  images: string[];
  createdAt: string;
  isMine: boolean;
  reactionCount: number;
  myReaction: string | null;
  topics: string[];
  repostCount?: number;
  authorDisplayName?: string;
  authorHandle?: string;
  authorKind?: "freelancer" | "business";
}

/**
 * Theme Preference Contract (Sync across Mobile & Web Business)
 */
export interface AppThemePreferenceContract {
  version: string;
  themeId: BusinessThemeId;
  mode: "light" | "dark";
  syncedAt: string;
}
