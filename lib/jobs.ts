import type { JobPost, JobPostStatus } from "@/types/job";

export const jobStatusLabels: Record<JobPostStatus, string> = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đang tuyển",
  PAUSED: "Tạm dừng",
  CLOSED: "Đã đóng",
};

export function jobStatusTone(status: JobPostStatus) {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "draft";
  if (status === "CLOSED") return "neutral";
  return "warning";
}

export function isJobPost(value: unknown): value is JobPost {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.organizationId === "string" &&
    typeof item.title === "string" &&
    typeof item.category === "string" &&
    typeof item.summary === "string" &&
    Array.isArray(item.skills) &&
    item.skills.every((skill) => typeof skill === "string") &&
    item.workMode === "REMOTE" &&
    typeof item.locationScope === "string" &&
    typeof item.engagement === "string" &&
    ["PROJECT", "CONTRACT", "PART_TIME"].includes(item.engagement) &&
    typeof item.paymentType === "string" &&
    ["FIXED", "MILESTONE", "HOURLY"].includes(item.paymentType) &&
    typeof item.budgetMinMinor === "string" &&
    /^\d+$/.test(item.budgetMinMinor) &&
    typeof item.budgetMaxMinor === "string" &&
    /^\d+$/.test(item.budgetMaxMinor) &&
    typeof item.duration === "string" &&
    typeof item.applicationDeadline === "string" &&
    Number.isFinite(Date.parse(item.applicationDeadline)) &&
    typeof item.notifyMatchingTalent === "boolean" &&
    typeof item.matchedTalentCount === "number" &&
    Number.isInteger(item.matchedTalentCount) &&
    item.matchedTalentCount >= 0 &&
    typeof item.applicantCount === "number" &&
    Number.isInteger(item.applicantCount) &&
    item.applicantCount >= 0 &&
    typeof item.createdAt === "string" &&
    Number.isFinite(Date.parse(item.createdAt)) &&
    typeof item.status === "string" &&
    Object.hasOwn(jobStatusLabels, item.status)
  );
}
