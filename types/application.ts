export type ApplicationStatus =
  | "SUBMITTED"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED";

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

export interface CandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  initials: string;
  headline: string;
  email: string;
  location: string;
  matchScore: number;
  skills: string[];
  coverNote: string;
  portfolioLabel: string;
  availability: string;
  status: ApplicationStatus;
  submittedAt: string;
  messages: ApplicationMessage[];
}
