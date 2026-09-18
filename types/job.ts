import type { MinorAmount } from "@/types/money";

export type JobPostStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED";
export type JobEngagement = "PROJECT" | "CONTRACT" | "PART_TIME";
export type JobPaymentType = "FIXED" | "MILESTONE" | "HOURLY";

export interface JobPost {
  id: string;
  organizationId: string;
  title: string;
  category: string;
  summary: string;
  coverImageUrl?: string;
  coverImageName?: string;
  skills: string[];
  hashtags?: string[];
  workMode: "REMOTE";
  locationScope: string;
  engagement: JobEngagement;
  paymentType: JobPaymentType;
  budgetMinMinor: MinorAmount;
  budgetMaxMinor: MinorAmount;
  duration: string;
  applicationDeadline: string;
  status: JobPostStatus;
  notifyMatchingTalent: boolean;
  matchedTalentCount: number;
  applicantCount: number;
  createdAt: string;
  publishedAt?: string;
}
