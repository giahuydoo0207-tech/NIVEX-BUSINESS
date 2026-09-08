export type OrganizationType =
  | "COMPANY"
  | "STARTUP"
  | "AGENCY"
  | "WEB3_ORGANIZATION"
  | "HOUSEHOLD_BUSINESS"
  | "OTHER";

export type OrganizationVerificationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ADDITIONAL_INFORMATION_REQUIRED"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED"
  | "EXPIRED";

export interface OrganizationRegistration {
  ownerFullName: string;
  workEmail: string;
  phoneNumber: string;
  legalName: string;
  tradingName: string;
  type: OrganizationType;
  countryCode: string;
  registrationNumber: string;
  website?: string;
  representativeTitle: string;
}

export interface ContractorSummary {
  id: string;
  displayName: string;
  role: string;
  countryCode: string;
  verificationStatus: "BASIC_VERIFIED" | "IDENTITY_VERIFIED";
  payoutReadiness: "READY" | "ACTION_REQUIRED";
}
