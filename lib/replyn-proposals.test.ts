import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyForm, payload, proposalMenuItem, validate, workspaceUrl, type ProposalForm, type ReplynProposal } from "./replyn-proposals";

const day = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function complete(): ProposalForm {
  return {
    ...emptyForm(),
    projectName: "Landing page",
    scope: "Thiết kế và code",
    deliverables: ["Figma", "Mã nguồn"],
    totalAmount: "2500",
    startDate: day(1),
    deadline: day(30),
    milestones: [
      { title: "Thiết kế", amount: "1000", deadline: day(10) },
      { title: "Code", amount: "1500", deadline: day(30) },
    ],
  };
}

function proposal(status: ReplynProposal["status"], extra: Partial<ReplynProposal> = {}): ReplynProposal {
  return {
    id: `p-${status}`, threadId: "t", status, projectName: "X", scope: "", deliverables: [], revisionLimit: 2, currency: "USDC",
    totalAmount: 1, startDate: null, deadline: null, reviewPeriodDays: 3, milestones: [], notes: "", supersedesId: null,
    workspaceId: null, rejectionReason: null, createdAt: "", updatedAt: "", sentAt: null, expiresAt: null, acceptedAt: null,
    rejectedAt: null, cancelledAt: null, ...extra,
  };
}

test("a complete proposal passes and a draft only needs a name", () => {
  assert.deepEqual(validate(complete(), true), {});
  assert.deepEqual(validate({ ...emptyForm(), projectName: "Nháp" }, false), {});
  const missing = validate(emptyForm(), true);
  for (const key of ["projectName", "scope", "deliverables", "totalAmount", "deadline", "milestones.0.title", "milestones.0.amount"]) {
    assert.ok(missing[key], `${key} should be reported`);
  }
});

test("milestones must add up to the budget, in cents", () => {
  const form = complete();
  form.milestones[1].amount = "1499.99";
  assert.match(validate(form, true).milestones ?? "", /phải bằng tổng ngân sách/);
  form.totalAmount = "2499.99";
  assert.equal(validate(form, true).milestones, undefined);
  form.totalAmount = "10.001";
  assert.ok(validate(form, true).totalAmount);
});

test("milestone deadlines stay in order and inside the project window", () => {
  const form = complete();
  form.milestones = [
    { title: "B", amount: "1500", deadline: day(20) },
    { title: "A", amount: "1000", deadline: day(10) },
  ];
  assert.ok(validate(form, true)["milestones.1.deadline"]);
  form.milestones = [{ title: "A", amount: "2500", deadline: day(40) }];
  assert.ok(validate(form, true)["milestones.0.deadline"]);
  form.milestones = [{ title: "A", amount: "2500", deadline: day(-1) }];
  form.startDate = "";
  assert.ok(validate(form, true)["milestones.0.deadline"]);
});

test("payload sends blanks as null and drops empty deliverables", () => {
  const body = payload({ ...emptyForm(), projectName: " X ", deliverables: ["", " a "] }, "prev");
  assert.equal(body.projectName, "X");
  assert.deepEqual(body.deliverables, ["a"]);
  assert.equal(body.totalAmount, null);
  assert.equal(body.deadline, null);
  assert.equal(body.supersedesId, "prev");
});

test("the menu item follows the conversation's proposal state", () => {
  assert.deepEqual(proposalMenuItem([]), { action: "create", label: "Đề xuất Replyn" });
  assert.equal(proposalMenuItem([proposal("DRAFT")]).label, "Tiếp tục đề xuất Replyn");
  assert.equal(proposalMenuItem([proposal("PENDING")]).label, "Xem đề xuất Replyn");
  assert.equal(proposalMenuItem([proposal("REJECTED")]).label, "Tạo đề xuất Replyn mới");
  assert.equal(proposalMenuItem([proposal("EXPIRED")]).label, "Tạo lại đề xuất Replyn");
  assert.equal(proposalMenuItem([proposal("CANCELLED")]).label, "Tạo lại đề xuất Replyn");
  const accepted = proposal("ACCEPTED", { workspaceId: "w-1" });
  assert.deepEqual(proposalMenuItem([proposal("REJECTED"), accepted]), { action: "open", label: "Mở workspace Replyn", proposal: accepted });
});

test("workspace links carry only the opaque workspace id", () => {
  assert.equal(workspaceUrl("3f1c0d4e-0000-4000-8000-000000000001"), "https://replyn-web.vercel.app/workspace/3f1c0d4e-0000-4000-8000-000000000001");
});
