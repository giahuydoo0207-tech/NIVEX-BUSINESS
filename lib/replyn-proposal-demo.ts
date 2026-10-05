import { payload, type ProposalForm, type ReplynProposal } from "./replyn-proposals";

/**
 * Demo mode only (no backend): conversation preferences and proposals kept in this browser so a
 * reload shows the same state. Nothing here reaches Nova Mobile or Replyn; the UI labels it as
 * sample data. Live mode stores all of it in the Nova backend instead.
 */
const KEY = "nova.business.demo-conversations.v1";

export interface DemoConversationState {
  muted: string[];
  hidden: string[];
  blocked: string[];
  proposals: Record<string, ReplynProposal[]>;
}

const empty = (): DemoConversationState => ({ muted: [], hidden: [], blocked: [], proposals: {} });

export function loadDemoState(): DemoConversationState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<DemoConversationState>;
    return {
      muted: Array.isArray(parsed.muted) ? parsed.muted : [],
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
      blocked: Array.isArray(parsed.blocked) ? parsed.blocked : [],
      proposals: parsed.proposals && typeof parsed.proposals === "object" ? parsed.proposals : {},
    };
  } catch {
    return empty();
  }
}

export function saveDemoState(state: DemoConversationState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: the change still applies until the page reloads.
  }
}

export function toggle(list: string[], id: string, on: boolean) {
  return on ? Array.from(new Set([...list, id])) : list.filter((item) => item !== id);
}

/** Creates or updates a local proposal; the caller has already validated the form. */
export function demoSave(existing: ReplynProposal | undefined, threadId: string, form: ProposalForm, send: boolean, supersedesId?: string | null): ReplynProposal {
  const now = new Date().toISOString();
  const body = payload(form, supersedesId ?? existing?.supersedesId);
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: existing?.id ?? `demo-${crypto.randomUUID()}`,
    threadId,
    status: send ? "PENDING" : "DRAFT",
    projectName: body.projectName,
    scope: body.scope,
    deliverables: body.deliverables,
    revisionLimit: body.revisionLimit,
    currency: body.currency,
    totalAmount: body.totalAmount,
    startDate: body.startDate,
    deadline: body.deadline,
    reviewPeriodDays: body.reviewPeriodDays,
    milestones: body.milestones,
    notes: body.notes,
    supersedesId: body.supersedesId,
    workspaceId: null,
    rejectionReason: null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    sentAt: send ? now : null,
    expiresAt: send ? expires : null,
    acceptedAt: null,
    rejectedAt: null,
    cancelledAt: null,
  };
}
