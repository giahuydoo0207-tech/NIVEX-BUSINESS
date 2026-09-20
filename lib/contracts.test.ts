import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  toAppJobPostContract,
  fromAppJobPostContract,
  toAppApplicationContract,
  fromAppApplicationContract,
  toAppInvoiceContract,
  fromAppInvoiceContract,
  toAppCommunityPostContract,
  fromAppCommunityPostContract,
  toAppThemePreferenceContract,
  fromAppThemePreferenceContract,
} from "./contracts.ts";
import { CONTRACT_VERSION } from "../types/contracts.ts";
import type { JobPost } from "../types/job.ts";
import type { CandidateApplication } from "../types/application.ts";
import type { Invoice } from "../types/invoice.ts";
import type { CommunityPost } from "../types/community.ts";

describe("Focused Data Contracts & Adapters", () => {
  it("JobPost bi-directional mapping preserves core fields", () => {
    const job: JobPost = {
      id: "job-001",
      organizationId: "org-nivex",
      title: "Flutter Payment Engineer",
      category: "Mobile Development",
      summary: "Xây dựng trải nghiệm ví điện tử và thanh toán mobile.",
      skills: ["Flutter", "Dart", "Solana Pay"],
      hashtags: ["flutter", "mobile"],
      workMode: "REMOTE",
      locationScope: "Việt Nam",
      engagement: "PROJECT",
      paymentType: "MILESTONE",
      budgetMinMinor: "1500000000",
      budgetMaxMinor: "3000000000",
      duration: "2 tháng",
      applicationDeadline: "2026-10-01",
      status: "PUBLISHED",
      notifyMatchingTalent: true,
      matchedTalentCount: 15,
      applicantCount: 4,
      createdAt: "2026-09-15T08:00:00Z",
      publishedAt: "2026-09-15T09:00:00Z",
    };

    const contract = toAppJobPostContract(job);
    assert.equal(contract.version, CONTRACT_VERSION);
    assert.equal(contract.id, job.id);
    assert.equal(contract.title, job.title);
    assert.deepEqual(contract.skills, job.skills);
    assert.equal(contract.currency, "USDC");

    const restored = fromAppJobPostContract(contract);
    assert.equal(restored.id, job.id);
    assert.equal(restored.title, job.title);
    assert.equal(restored.budgetMinMinor, job.budgetMinMinor);
    assert.equal(restored.budgetMaxMinor, job.budgetMaxMinor);
    assert.equal(restored.workMode, "REMOTE");
  });

  it("CandidateApplication bi-directional mapping works seamlessly", () => {
    const app: CandidateApplication = {
      id: "app-100",
      jobId: "job-001",
      jobTitle: "Flutter Payment Engineer",
      applicantUserId: "user-456",
      candidateName: "Trần Quốc Bảo",
      initials: "TB",
      headline: "Senior Mobile Engineer",
      email: "bao.tran@example.com",
      location: "Đà Nẵng",
      matchScore: 95,
      skills: ["Flutter", "Dart", "Solana"],
      coverNote: "Rất quan tâm đến dự án của Nova Labs.",
      portfolioLabel: "github.com/tranbao",
      portfolioPreview: [],
      availability: "Sẵn sàng ngay",
      status: "submitted",
      submittedAt: "2026-09-16T10:00:00Z",
      createdAt: "2026-09-16T10:00:00Z",
      updatedAt: "2026-09-16T10:00:00Z",
      messages: [],
    };

    const contract = toAppApplicationContract(app);
    assert.equal(contract.version, CONTRACT_VERSION);
    assert.equal(contract.id, app.id);
    assert.equal(contract.candidateName, app.candidateName);
    assert.equal(contract.matchScore, 95);

    const restored = fromAppApplicationContract(contract);
    assert.equal(restored.id, app.id);
    assert.equal(restored.candidateName, app.candidateName);
    assert.equal(restored.initials, "TQ"); // derived from candidateName
    assert.equal(restored.status, "submitted");
  });

  it("Invoice bi-directional mapping preserves financial precision", () => {
    const invoice: Invoice = {
      id: "inv-2026-001",
      organizationId: "org-nivex",
      contractorId: "contractor-123",
      description: "Thanh toán milestone 1: Thiết kế flow onboarding",
      sourceAmountMinor: "2500000000", // 2500.000000 USDC
      sourceCurrency: "USDC",
      dueDate: "2026-09-30",
      invoiceNumber: "NOVA-2026-0001",
      paymentRequestId: "pay-abc12345",
      status: "AWAITING_PAYMENT",
      createdAt: "2026-09-20T00:00:00Z",
    };

    const contract = toAppInvoiceContract(invoice);
    assert.equal(contract.version, CONTRACT_VERSION);
    assert.equal(contract.sourceAmountMinor, "2500000000");
    assert.equal(contract.sourceCurrency, "USDC");
    assert.equal(contract.status, "AWAITING_PAYMENT");

    const restored = fromAppInvoiceContract(contract);
    assert.equal(restored.id, invoice.id);
    assert.equal(restored.sourceAmountMinor, invoice.sourceAmountMinor);
    assert.equal(restored.invoiceNumber, invoice.invoiceNumber);
    assert.equal(restored.paymentRequestId, invoice.paymentRequestId);
  });

  it("CommunityPost bi-directional mapping retains reactions and author info", () => {
    const post: CommunityPost = {
      id: "post-99",
      content: "Demo cập nhật Nova Business web đồng bộ mobile.",
      images: ["https://example.com/img1.png"],
      timeLabel: "10 phút trước",
      createdAt: "2026-09-20T12:00:00Z",
      isMine: true,
      reactionCount: 15,
      myReaction: "like",
      topics: ["Fintech", "Web3"],
      comments: [],
      author: {
        kind: "freelancer",
        displayName: "Lê Thảo My",
        handle: "thaomy.design",
        headline: "UI/UX Lead",
        location: "TP. HCM",
        bio: "Chuyên thiết kế fintech",
        tags: ["UIUX"],
        stats: [],
      },
    };

    const contract = toAppCommunityPostContract(post);
    assert.equal(contract.version, CONTRACT_VERSION);
    assert.equal(contract.id, post.id);
    assert.equal(contract.authorDisplayName, "Lê Thảo My");
    assert.equal(contract.authorKind, "freelancer");

    const restored = fromAppCommunityPostContract(contract);
    assert.equal(restored.id, post.id);
    assert.equal(restored.reactionCount, 15);
    assert.equal(restored.author?.displayName, "Lê Thảo My");
    assert.equal(restored.author?.handle, "thaomy.design");
  });

  it("ThemePreference contract synchronizes with fallback on invalid ID", () => {
    const contract = toAppThemePreferenceContract("vietnamFuture", "2026-09-20T12:00:00Z");
    assert.equal(contract.version, CONTRACT_VERSION);
    assert.equal(contract.themeId, "vietnamFuture");
    assert.equal(contract.mode, "light");

    const restoredId = fromAppThemePreferenceContract(contract);
    assert.equal(restoredId, "vietnamFuture");

    // Fallback to cyberNight when invalid
    const invalidContract: any = {
      version: "1.0.0",
      themeId: "nonExistentTheme",
      mode: "dark",
      syncedAt: "2026-09-20T12:00:00Z",
    };
    const fallbackId = fromAppThemePreferenceContract(invalidContract);
    assert.equal(fallbackId, "cyberNight");
  });
});
