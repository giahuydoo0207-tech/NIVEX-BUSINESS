import type { ContractorSummary } from "@/types/business";

export const demoOrganization = {
  id: "org-nivex-demo",
  legalName: "NIVEX Labs",
  tradingName: "NIVEX",
  verificationStatus: "UNDER_REVIEW" as const,
};

export const demoContractors: ContractorSummary[] = [
  {
    id: "contractor-minh-anh",
    displayName: "Nguyễn Minh Anh",
    role: "Flutter Developer",
    countryCode: "VN",
    verificationStatus: "IDENTITY_VERIFIED",
    payoutReadiness: "READY",
  },
  {
    id: "contractor-thao-nguyen",
    displayName: "Nguyễn Thanh Thảo",
    role: "Product Designer",
    countryCode: "VN",
    verificationStatus: "BASIC_VERIFIED",
    payoutReadiness: "ACTION_REQUIRED",
  },
];
