import {
  CONTRACT_VERSION,
  type AppApplicationContract,
  type AppCommunityPostContract,
  type AppInvoiceContract,
  type AppJobPostContract,
  type AppThemePreferenceContract,
} from "../types/contracts.ts";
import type { JobPost } from "../types/job.ts";
import type { CandidateApplication } from "../types/application.ts";
import type { Invoice } from "../types/invoice.ts";
import type { CommunityPost } from "../types/community.ts";
import {
  BUSINESS_THEMES,
  DEFAULT_BUSINESS_THEME_ID,
  isBusinessThemeId,
  type BusinessThemeId,
} from "../types/theme.ts";

/**
 * ============================================================================
 * JobPost Adapters
 * ============================================================================
 */
export function toAppJobPostContract(job: JobPost): AppJobPostContract {
  return {
    version: CONTRACT_VERSION,
    id: job.id,
    organizationId: job.organizationId,
    title: job.title,
    category: job.category,
    summary: job.summary,
    skills: [...job.skills],
    hashtags: job.hashtags ? [...job.hashtags] : [],
    workMode: job.workMode,
    locationScope: job.locationScope,
    engagement: job.engagement,
    paymentType: job.paymentType,
    budgetMinMinor: job.budgetMinMinor,
    budgetMaxMinor: job.budgetMaxMinor,
    currency: "USDC",
    duration: job.duration,
    applicationDeadline: job.applicationDeadline,
    status: job.status,
    notifyMatchingTalent: job.notifyMatchingTalent,
    applicantCount: job.applicantCount,
    createdAt: job.createdAt,
    publishedAt: job.publishedAt,
  };
}

export function fromAppJobPostContract(contract: AppJobPostContract): JobPost {
  return {
    id: contract.id,
    organizationId: contract.organizationId,
    title: contract.title,
    category: contract.category,
    summary: contract.summary,
    skills: [...contract.skills],
    hashtags: contract.hashtags ? [...contract.hashtags] : [],
    workMode: "REMOTE",
    locationScope: contract.locationScope,
    engagement: contract.engagement,
    paymentType: contract.paymentType,
    budgetMinMinor: contract.budgetMinMinor,
    budgetMaxMinor: contract.budgetMaxMinor,
    duration: contract.duration,
    applicationDeadline: contract.applicationDeadline,
    status: contract.status,
    notifyMatchingTalent: contract.notifyMatchingTalent,
    matchedTalentCount: 0,
    applicantCount: contract.applicantCount,
    createdAt: contract.createdAt,
    publishedAt: contract.publishedAt,
  };
}

/**
 * ============================================================================
 * CandidateApplication Adapters
 * ============================================================================
 */
export function toAppApplicationContract(
  app: CandidateApplication
): AppApplicationContract {
  return {
    version: CONTRACT_VERSION,
    id: app.id,
    jobId: app.jobId,
    jobTitle: app.jobTitle,
    applicantUserId: app.applicantUserId,
    candidateName: app.candidateName,
    headline: app.headline,
    email: app.email,
    location: app.location,
    matchScore: app.matchScore,
    skills: [...app.skills],
    coverNote: app.coverNote,
    portfolioLabel: app.portfolioLabel,
    availability: app.availability,
    status: app.status,
    submittedAt: app.submittedAt,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  };
}

export function fromAppApplicationContract(
  contract: AppApplicationContract
): CandidateApplication {
  const initials =
    contract.candidateName
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "UV";

  return {
    id: contract.id,
    jobId: contract.jobId,
    jobTitle: contract.jobTitle,
    applicantUserId: contract.applicantUserId,
    candidateName: contract.candidateName,
    initials,
    headline: contract.headline,
    email: contract.email,
    location: contract.location,
    matchScore: contract.matchScore,
    skills: [...contract.skills],
    coverNote: contract.coverNote,
    portfolioLabel: contract.portfolioLabel || "",
    portfolioPreview: [],
    availability: contract.availability,
    status: contract.status,
    submittedAt: contract.submittedAt,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    messages: [],
  };
}

/**
 * ============================================================================
 * Invoice Adapters
 * ============================================================================
 */
export function toAppInvoiceContract(invoice: Invoice): AppInvoiceContract {
  return {
    version: CONTRACT_VERSION,
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    organizationId: invoice.organizationId,
    contractorId: invoice.contractorId,
    description: invoice.description,
    sourceAmountMinor: invoice.sourceAmountMinor,
    sourceCurrency: invoice.sourceCurrency,
    dueDate: invoice.dueDate,
    status: invoice.status,
    paymentRequestId: invoice.paymentRequestId,
    createdAt: invoice.createdAt,
  };
}

export function fromAppInvoiceContract(contract: AppInvoiceContract): Invoice {
  return {
    id: contract.id,
    invoiceNumber: contract.invoiceNumber,
    organizationId: contract.organizationId,
    contractorId: contract.contractorId,
    description: contract.description,
    sourceAmountMinor: contract.sourceAmountMinor,
    sourceCurrency: contract.sourceCurrency,
    dueDate: contract.dueDate,
    status: contract.status,
    paymentRequestId: contract.paymentRequestId,
    createdAt: contract.createdAt,
  };
}

/**
 * ============================================================================
 * CommunityPost Adapters
 * ============================================================================
 */
export function toAppCommunityPostContract(
  post: CommunityPost
): AppCommunityPostContract {
  return {
    version: CONTRACT_VERSION,
    id: post.id,
    content: post.content,
    images: [...post.images],
    createdAt: post.createdAt,
    isMine: post.isMine,
    reactionCount: post.reactionCount,
    myReaction: post.myReaction ?? null,
    topics: post.topics ? [...post.topics] : [],
    repostCount: post.repostCount,
    authorDisplayName: post.author?.displayName,
    authorHandle: post.author?.handle,
    authorKind: post.author?.kind,
  };
}

export function fromAppCommunityPostContract(
  contract: AppCommunityPostContract
): CommunityPost {
  return {
    id: contract.id,
    content: contract.content,
    images: [...contract.images],
    timeLabel: "Vừa xong",
    createdAt: contract.createdAt,
    isMine: contract.isMine,
    reactionCount: contract.reactionCount,
    myReaction: (contract.myReaction as any) ?? null,
    reactionCounts:
      contract.reactionCount > 0
        ? { like: contract.reactionCount }
        : {},
    comments: [],
    topics: [...contract.topics],
    repostCount: contract.repostCount,
    author: contract.authorDisplayName
      ? {
          kind: contract.authorKind ?? "freelancer",
          displayName: contract.authorDisplayName,
          handle: contract.authorHandle ?? "user",
          headline: "",
          location: "",
          bio: "",
          tags: [],
          stats: [],
        }
      : undefined,
  };
}

/**
 * ============================================================================
 * Theme Preference Adapters
 * ============================================================================
 */
export function toAppThemePreferenceContract(
  themeId: BusinessThemeId,
  syncedAt = new Date().toISOString()
): AppThemePreferenceContract {
  const meta = BUSINESS_THEMES[themeId] || BUSINESS_THEMES[DEFAULT_BUSINESS_THEME_ID];
  return {
    version: CONTRACT_VERSION,
    themeId: meta.id,
    mode: meta.mode,
    syncedAt,
  };
}

export function fromAppThemePreferenceContract(
  contract: AppThemePreferenceContract
): BusinessThemeId {
  if (isBusinessThemeId(contract.themeId)) {
    return contract.themeId;
  }
  return DEFAULT_BUSINESS_THEME_ID;
}
