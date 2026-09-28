import type { ApplicationStatus, CandidateApplication } from "@/types/application";
import type { JobEngagement, JobPaymentType, JobPost, JobPostStatus } from "@/types/job";
import { normalizeApplicationStatus } from "@/lib/application-status";

/**
 * Business Web talks to the shared Nova backend (through the server-side
 * /api/devnet proxy) whenever the devnet demo is enabled. Browser storage and
 * fixtures are only used when no backend is configured.
 */
export const liveBackend = process.env.NEXT_PUBLIC_PAYMENT_MODE === "devnet";

export class WorkspaceApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "WorkspaceApiError";
    this.status = status;
  }
}

export async function workspaceRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/devnet/${path}`, {
    cache: "no-store",
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new WorkspaceApiError(body.detail || body.message || `API ${response.status}`, response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Relative backend media paths are served through the proxy. */
export function proxiedMediaUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("/api/v1/")) return `/api/devnet/${value.slice("/api/v1/".length)}`;
  if (value.startsWith("/media/")) return `/api/devnet${value}`;
  return value;
}

export type ApiJob = {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  category: string;
  summary: string;
  skills: string[];
  engagement: string;
  paymentType: string;
  duration: string;
  budgetMinMinor: number | string;
  budgetMaxMinor: number | string;
  currency: string;
  locationScope: string;
  applicationDeadline: string;
  status: string;
  applicantCount: number;
  createdAt: string;
  publishedAt?: string | null;
};

const engagements: JobEngagement[] = ["PROJECT", "CONTRACT", "PART_TIME"];
const paymentTypes: JobPaymentType[] = ["FIXED", "MILESTONE", "HOURLY"];
const jobStatuses: JobPostStatus[] = ["DRAFT", "PUBLISHED", "PAUSED", "CLOSED"];

export function mapApiJob(job: ApiJob): JobPost {
  return {
    id: job.id,
    organizationId: job.organizationId,
    title: job.title,
    category: job.category,
    summary: job.summary,
    skills: job.skills ?? [],
    workMode: "REMOTE",
    locationScope: job.locationScope,
    engagement: engagements.includes(job.engagement as JobEngagement) ? (job.engagement as JobEngagement) : "PROJECT",
    paymentType: paymentTypes.includes(job.paymentType as JobPaymentType) ? (job.paymentType as JobPaymentType) : "FIXED",
    budgetMinMinor: String(job.budgetMinMinor),
    budgetMaxMinor: String(job.budgetMaxMinor),
    duration: job.duration,
    applicationDeadline: job.applicationDeadline,
    status: jobStatuses.includes(job.status as JobPostStatus) ? (job.status as JobPostStatus) : "DRAFT",
    notifyMatchingTalent: false,
    matchedTalentCount: 0,
    applicantCount: job.applicantCount ?? 0,
    createdAt: job.createdAt,
    publishedAt: job.publishedAt ?? undefined,
  };
}

export type ApiApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  contractorId: string;
  candidateName: string;
  headline: string | null;
  email: string | null;
  location: string | null;
  skillsJson: string | null;
  coverNote: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  withdrawnAt?: string | null;
  candidateAvatarUrl?: string | null;
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(-2).join("").toUpperCase() || "NV";
}

function parseSkills(value: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function mapApiApplication(application: ApiApplication): CandidateApplication {
  const status: ApplicationStatus = normalizeApplicationStatus(application.status) ?? "submitted";
  const skills = parseSkills(application.skillsJson);
  return {
    id: application.id,
    jobId: application.jobId,
    jobTitle: application.jobTitle,
    applicantUserId: application.contractorId,
    candidateName: application.candidateName,
    initials: initials(application.candidateName),
    headline: application.headline ?? "",
    email: application.email ?? "",
    location: application.location ?? "",
    matchScore: 0,
    skills,
    detailedSkills: skills,
    coverNote: application.coverNote,
    portfolioLabel: "",
    portfolioPreview: [],
    availability: "",
    status,
    submittedAt: application.submittedAt,
    createdAt: application.submittedAt,
    updatedAt: application.updatedAt,
    messages: [],
    avatarUrl: proxiedMediaUrl(application.candidateAvatarUrl),
  };
}
