import type { ContractorSummary } from "@/types/business";

export const demoOrganization = {
  id: "org-nivex-demo",
  legalName: "NIVEX Labs",
  tradingName: "NIVEX",
  verificationStatus: "UNDER_REVIEW" as const,
};

export const demoContractors: ContractorSummary[] = [
  {
    id: "contractor-quoc-bao",
    displayName: "Trần Quốc Bảo",
    role: "Frontend Developer",
    countryCode: "VN",
    verificationStatus: "IDENTITY_VERIFIED",
    payoutReadiness: "READY",
  },
  {
    id: "contractor-ha-linh",
    displayName: "Phạm Hà Linh",
    role: "Brand Designer",
    countryCode: "VN",
    verificationStatus: "IDENTITY_VERIFIED",
    payoutReadiness: "READY",
  },
  {
    id: "contractor-duc-huy",
    displayName: "Lê Đức Huy",
    role: "Product Manager",
    countryCode: "VN",
    verificationStatus: "BASIC_VERIFIED",
    payoutReadiness: "READY",
  },
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
