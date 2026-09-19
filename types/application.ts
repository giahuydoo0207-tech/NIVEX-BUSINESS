export type ApplicationStatus =
  | "submitted"
  | "viewed"
  | "shortlisted"
  | "interview"
  | "rejected"
  | "withdrawn"
  | "accepted";

export type ApplicationMessageRole = "TALENT" | "BUSINESS" | "SYSTEM";
export type MessageDeliveryStatus = "SENDING" | "SENT" | "DELIVERED" | "SEEN";

export interface ApplicationMessage {
  id: string;
  role: ApplicationMessageRole;
  senderName: string;
  body: string;
  sentAt: string;
  deliveryStatus?: MessageDeliveryStatus;
  replyToId?: string;
}

export interface PortfolioPreviewItem {
  id: string;
  title: string;
  thumbnailUrl?: string;
  url?: string;
  description?: string;
}

export interface CandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantUserId?: string;
  candidateName: string;
  initials: string;
  headline: string;
  email: string;
  location: string;
  matchScore: number;
  skills: string[];
  coverNote: string;
  coverLetter?: string;
  portfolioLabel: string;
  portfolioPreview: PortfolioPreviewItem[];
  availability: string;
  status: ApplicationStatus;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  messages: ApplicationMessage[];
}

export type Application = CandidateApplication;
