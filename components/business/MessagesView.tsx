"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Check,
  CheckCheck,
  Clock3,
  ExternalLink,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Reply,
  Search,
  Send,
  Smile,
  Trash2,
  UserRoundCheck,
  X,
} from "lucide-react";
import { demoApplications } from "@/lib/application-demo-data";
import { statusCopy } from "@/lib/application-status";
import type { ApplicationMessage, ApplicationStatus, CandidateApplication } from "@/types/application";
import { mapApiApplication, proxiedMediaUrl, type ApiApplication } from "@/lib/workspace-api";
import {
  emptyForm,
  formFromProposal,
  payload,
  proposalMenuItem,
  readApiError,
  workspaceUrl,
  type ProposalForm,
  type ReplynProposal,
} from "@/lib/replyn-proposals";
import { demoSave, loadDemoState, saveDemoState, toggle, type DemoConversationState } from "@/lib/replyn-proposal-demo";
import { MESSAGES_UPDATED_EVENT } from "./useLiveCounts";
import { ConfirmDialog } from "./replyn/ConfirmDialog";
import { ProposalCard, ProposalDetailsDialog } from "./replyn/ProposalCard";
import { ReplynProposalDialog, type ProposalSubmit } from "./replyn/ReplynProposalDialog";
import { ThreadOptionsMenu } from "./replyn/ThreadOptionsMenu";

const liveMessages = process.env.NEXT_PUBLIC_PAYMENT_MODE === "devnet";

type ApiThread = { id: string; contractorId: string; candidateName: string; headline: string; requestStatus: "PENDING" | "ACCEPTED" | "BLOCKED"; createdAt: string; organizationName?: string; candidateAvatarUrl?: string | null; unreadForBusiness?: number; businessMuted?: boolean; replynProposals?: ReplynProposal[]; messages: Array<{ id: string; senderType: "BUSINESS" | "TALENT"; body: string; sentAt: string; deliveredAt?: string | null; seenAt?: string | null }> };

type ProposalDialogState = { initial: ProposalForm; draftId?: string; supersedesId?: string } | null;
type ConfirmState = { kind: "delete" | "block" | "unblock"; id: string } | null;

/**
 * Threads are per organization–candidate pair and carry no job, so the
 * candidate's own application (if any) supplies job, status and contact data.
 * Without an application there is no status to show.
 */
function mapThread(thread: ApiThread, application?: CandidateApplication): ConversationItem {
  const hasApplication = Boolean(application);
  return {
    id: thread.id,
    jobId: application?.jobId ?? "",
    jobTitle: application?.jobTitle ?? "Trò chuyện trực tiếp",
    applicantUserId: thread.contractorId,
    candidateName: thread.candidateName,
    initials: thread.candidateName.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(-2).join("").toUpperCase(),
    headline: thread.headline ?? application?.headline ?? "",
    avatarUrl: proxiedMediaUrl(thread.candidateAvatarUrl) ?? application?.avatarUrl,
    email: application?.email ?? "",
    location: application?.location ?? "",
    matchScore: 0,
    skills: application?.skills ?? [],
    coverNote: application?.coverNote ?? "",
    portfolioLabel: "",
    portfolioPreview: [],
    availability: "",
    status: application?.status ?? "submitted",
    applicationId: application?.id,
    applicationStatus: application?.status ?? null,
    unreadCount: thread.unreadForBusiness ?? 0,
    submittedAt: thread.createdAt, createdAt: thread.createdAt, updatedAt: thread.createdAt,
    hasActiveApplication: hasApplication && application?.status !== "withdrawn" && application?.status !== "rejected",
    requestState: thread.requestStatus.toLowerCase() as ConversationItem["requestState"],
    muted: Boolean(thread.businessMuted),
    replynProposals: thread.replynProposals ?? [],
    messages: thread.messages.map((message) => ({ id: message.id, role: message.senderType, senderName: message.senderType === "BUSINESS" ? thread.organizationName ?? "Doanh nghiệp" : thread.candidateName, body: message.body, sentAt: new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.sentAt)), sentAtIso: message.sentAt, deliveryStatus: message.seenAt ? "SEEN" : message.deliveredAt ? "DELIVERED" : "SENT" })),
  };
}

type StreamItem = { kind: "message"; message: ApplicationMessage } | { kind: "proposal"; proposal: ReplynProposal };

/** Messages in order with each sent proposal placed by its send time; drafts are not shown in the chat. */
function streamItems(messages: ApplicationMessage[], proposals: ReplynProposal[]): StreamItem[] {
  const cards = proposals.filter((p) => p.status !== "DRAFT" && p.sentAt).sort((a, b) => a.sentAt!.localeCompare(b.sentAt!));
  const items: StreamItem[] = [];
  let next = 0;
  for (const message of messages) {
    // Demo messages carry no timestamp, so cards follow them.
    while (message.sentAtIso && next < cards.length && cards[next].sentAt! < message.sentAtIso) {
      items.push({ kind: "proposal", proposal: cards[next++] });
    }
    items.push({ kind: "message", message });
  }
  while (next < cards.length) items.push({ kind: "proposal", proposal: cards[next++] });
  return items;
}

/** Sample conversations with this browser's saved demo preferences and proposals applied. */
function applyDemoState(items: ConversationItem[], demo: DemoConversationState): ConversationItem[] {
  return items
    .filter((item) => !demo.hidden.includes(item.id))
    .map((item) => ({
      ...item,
      muted: demo.muted.includes(item.id),
      replynProposals: demo.proposals[item.id] ?? [],
      requestState: demo.blocked.includes(item.id) ? "blocked" : item.requestState,
    }));
}

/** The candidate's most relevant application: an active one first, then the newest. */
function applicationFor(contractorId: string, applications: CandidateApplication[]) {
  const mine = applications.filter((item) => item.applicantUserId === contractorId);
  return mine.find((item) => item.status !== "withdrawn" && item.status !== "rejected") ?? mine[0];
}

function Avatar({ item, className }: { item: ConversationItem; className: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={className}>
      {item.avatarUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.avatarUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        item.initials
      )}
      {className === "application-avatar" && <i />}
    </span>
  );
}

function nowLabel() {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function DeliveryMark({ message }: { message: ApplicationMessage }) {
  if (message.role !== "BUSINESS") return null;
  const label = {
    SENDING: "Đang gửi",
    SENT: "Đã gửi",
    DELIVERED: "Đã nhận",
    SEEN: "Đã xem",
  }[message.deliveryStatus ?? "SEEN"];

  return (
    <span className={`message-delivery ${message.deliveryStatus?.toLowerCase() ?? "seen"}`} title={label}>
      {message.deliveryStatus === "SENDING" ? <Clock3 size={12} /> : message.deliveryStatus === "SENT" ? <Check size={13} /> : <CheckCheck size={13} />}
      {label}
    </span>
  );
}

export interface ConversationItem extends CandidateApplication {
  hasActiveApplication: boolean;
  requestState: "none" | "pending" | "accepted" | "declined" | "blocked";
  /** Notifications for this conversation are muted for the business. */
  muted?: boolean;
  replynProposals?: ReplynProposal[];
  /** Live mode: the linked application, or none for a direct conversation. */
  applicationId?: string;
  applicationStatus?: ApplicationStatus | null;
  unreadCount?: number;
}

const DEMO_STRANGER_REQUEST: ConversationItem = {
  id: "conversation-stranger-hoang-yen-nhi",
  jobId: "general-inquiry",
  jobTitle: "Liên hệ bên ngoài",
  applicantUserId: "user-hoang-yen-nhi",
  candidateName: "Hoàng Yến Nhi",
  initials: "YN",
  username: "@yennhi.web3",
  statusBadge: "Yêu cầu",
  headline: "Web3 Community & DevRel Lead",
  email: "yennhi.web3@example.com",
  location: "TP. Hồ Chí Minh",
  timezone: "UTC+7",
  languages: "Tiếng Việt · English",
  workType: "Toàn thời gian · Remote",
  capacity: "40 giờ/tuần",
  profileCompletion: 85,
  completionTip: "Hồ sơ đối tác cộng đồng",
  trustRank: "Bậc Bạc",
  trustRankSubtitle: "Cấp bậc uy tín Nova",
  bio: "Chuyên gia phát triển quan hệ cộng đồng và đối tác dự án Web3.",
  matchScore: 0,
  skills: ["Community", "DevRel", "Partnership", "Web3 Events"],
  detailedSkills: ["Community", "DevRel", "Partnership", "Web3 Events"],
  coverNote: "Mong muốn kết nối hợp tác cộng đồng.",
  portfolioLabel: "github.com/yennhi-web3",
  portfolioPreview: [],
  detailedPortfolio: [],
  status: "withdrawn",
  availability: "Sẵn sàng trao đổi",
  submittedAt: "2026-09-25T09:00:00Z",
  createdAt: "2026-09-25T09:00:00Z",
  updatedAt: "2026-09-25T09:00:00Z",
  hasActiveApplication: false,
  requestState: "pending",
  messages: [
    {
      id: "msg-stranger-1",
      role: "TALENT",
      senderName: "Hoàng Yến Nhi",
      body: "Xin chào Nova Labs, mình là Yến Nhi. Mình rất ấn tượng với hạ tầng thanh toán của bên bạn và muốn thảo luận về khả năng hợp tác tổ chức Hackathon Web3.",
      sentAt: "09:00",
      deliveryStatus: "SEEN",
    },
  ],
};

export function MessagesView({ initialCandidateId, initialThreadId }: { initialCandidateId?: string; initialThreadId?: string }) {
  const [conversations, setConversations] = useState<ConversationItem[]>(() => {
    // Live workspaces only show threads stored in the shared backend.
    if (liveMessages) return [];
    const base: ConversationItem[] = demoApplications.map((app) => {
      const isActive = app.status !== "withdrawn" && app.status !== "rejected";
      return {
        ...app,
        hasActiveApplication: isActive,
        requestState: isActive ? "none" : "pending",
      };
    });
    return [DEMO_STRANGER_REQUEST, ...base];
  });

  const [activeTab, setActiveTab] = useState<"all" | "requests" | "blocked">("all");
  const [proposalDialog, setProposalDialog] = useState<ProposalDialogState>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [demoState, setDemoState] = useState<DemoConversationState | null>(null);

  // Demo mode: apply this browser's saved preferences after hydration (localStorage is client-only).
  useEffect(() => {
    if (liveMessages) return;
    const saved = loadDemoState();
    setDemoState(saved);
    setConversations((current) => applyDemoState(current, saved));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const [selectedId, setSelectedId] = useState(
    // ?thread= (from Replyn) names a shared-backend thread, so it only applies to live workspaces.
    liveMessages ? initialThreadId ?? initialCandidateId ?? "" :
    initialCandidateId && demoApplications.some((item) => item.id === initialCandidateId)
      ? initialCandidateId
      : demoApplications[0]?.id ?? "",
  );
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ApplicationMessage | null>(null);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(true);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(Boolean(initialCandidateId || (liveMessages && initialThreadId)));
  const bottomRef = useRef<HTMLDivElement>(null);
  // Consumed by the first live load: a linked request or blocked thread is shown in its own tab.
  const linkedThreadRef = useRef(liveMessages ? initialThreadId : undefined);
  const timersRef = useRef<number[]>([]);

  async function refreshLiveThreads() {
    if (!liveMessages) return;
    const get = async <T,>(path: string) => {
      const response = await fetch(`/api/devnet/${path}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`API ${response.status}`);
      return response.json() as Promise<T>;
    };
    const [pending, accepted, blocked, applications] = await Promise.all([
      get<ApiThread[]>("messages?status=PENDING"),
      get<ApiThread[]>("messages?status=ACCEPTED"),
      get<ApiThread[]>("messages?status=BLOCKED"),
      get<ApiApplication[]>("applications?limit=100").then((rows) => rows.map(mapApiApplication)),
    ]);
    const next = [...pending, ...accepted, ...blocked].map((thread) =>
      mapThread(thread, applicationFor(thread.contractorId, applications)),
    );
    setConversations(next);
    const linkedId = linkedThreadRef.current;
    const linked = linkedId ? next.find((item) => item.id === linkedId) : undefined;
    linkedThreadRef.current = undefined;
    // A well-formed but unknown id is not opened on phones; the list is shown instead.
    if (linkedId && !linked) setMobileThreadOpen(Boolean(initialCandidateId));
    if (linked && linked.requestState === "pending") setActiveTab("requests");
    if (linked && linked.requestState === "blocked") setActiveTab("blocked");
    // ?candidate= may carry an application id when opened from Ứng viên; ?thread= a thread id from Replyn.
    // An unknown id falls back to the first conversation.
    setSelectedId((current) =>
      next.find((item) => item.id === current || item.applicationId === current)?.id ?? next[0]?.id ?? "",
    );
  }

  useEffect(() => {
    refreshLiveThreads().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!liveMessages) return;
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshLiveThreads().catch(() => undefined);
    };
    const interval = window.setInterval(refreshWhenVisible, 8000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const pendingRequests = useMemo(
    () => conversations.filter((c) => c.requestState === "pending"),
    [conversations],
  );

  const allConversations = useMemo(
    () => conversations.filter((c) => c.requestState === "none" || c.requestState === "accepted"),
    [conversations],
  );

  const blockedConversations = useMemo(
    () => conversations.filter((c) => c.requestState === "blocked"),
    [conversations],
  );

  const currentList = activeTab === "all" ? allConversations : activeTab === "requests" ? pendingRequests : blockedConversations;

  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("vi");
    return currentList.filter(
      (item) => !value || `${item.candidateName} ${item.jobTitle}`.toLocaleLowerCase("vi").includes(value),
    );
  }, [currentList, query]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  const selectedHasUnread = Boolean(
    selected && selected.requestState === "accepted" &&
      selected.messages.some((message) => message.role === "TALENT" && message.deliveryStatus !== "SEEN"),
  );

  useEffect(() => {
    // Only an opened conversation marks the candidate's messages as seen.
    if (!liveMessages || !selectedHasUnread || !selected) return;
    void fetch(`/api/devnet/messages/${selected.id}/read`, { method: "POST" })
      .then((response) => {
        if (!response.ok) return;
        window.dispatchEvent(new Event(MESSAGES_UPDATED_EVENT));
        return refreshLiveThreads();
      })
      .catch(() => undefined);
  }, [selected?.id, selectedHasUnread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selected?.messages.length, typingId]);

  useEffect(() => () => timersRef.current.forEach(window.clearTimeout), []);

  const selectedThreadId = selected?.id;
  const selectedAccepted = selected?.requestState === "accepted";
  useEffect(() => {
    // No realtime channel: poll the candidate's short-lived typing state
    // only while an accepted thread is open and the tab is visible.
    if (!liveMessages || !selectedThreadId || !selectedAccepted) return;
    let cancelled = false;
    let wasTyping = false;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch(`/api/devnet/messages/${selectedThreadId}/typing`, { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const { typing } = (await response.json()) as { typing: boolean };
        setTypingId((current) => (typing ? selectedThreadId : current === selectedThreadId ? null : current));
        // The indicator usually ends because a message was sent.
        if (wasTyping && !typing) void refreshLiveThreads().catch(() => undefined);
        wasTyping = typing;
      } catch {
        /* The next poll retries. */
      }
    };
    void poll();
    const interval = window.setInterval(poll, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      setTypingId(null);
    };
  }, [selectedThreadId, selectedAccepted]);

  const lastTypingSentRef = useRef(0);
  function reportTyping() {
    if (!liveMessages || !selected || selected.requestState !== "accepted") return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 3000) return;
    lastTypingSentRef.current = now;
    void fetch(`/api/devnet/messages/${selected.id}/typing`, { method: "POST" }).catch(() => undefined);
  }

  async function handleAcceptRequest(applicationId: string) {
    if (liveMessages) {
      const response = await fetch(`/api/devnet/messages/${applicationId}/accept`, { method: "POST" });
      if (!response.ok) return;
      await refreshLiveThreads();
    }
    setConversations((current) =>
      current.map((item) => (item.id === applicationId ? { ...item, requestState: "accepted" } : item)),
    );
    setActiveTab("all");
    setSelectedId(applicationId);
    setMobileThreadOpen(true);
  }

  async function handleDeclineRequest(applicationId: string) {
    if (liveMessages) {
      const response = await fetch(`/api/devnet/messages/${applicationId}/decline`, { method: "POST" });
      if (!response.ok) return;
      await refreshLiveThreads();
    }
    setConversations((current) =>
      current.map((item) => (item.id === applicationId ? { ...item, requestState: "declined" } : item)),
    );
    if (selectedId === applicationId) {
      const remaining = pendingRequests.filter((item) => item.id !== applicationId);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      } else {
        setActiveTab("all");
        setSelectedId(allConversations[0]?.id ?? "");
      }
    }
  }

  /** Demo mode: save the change in this browser and re-apply it to the sample conversations. */
  function updateDemo(change: (state: DemoConversationState) => DemoConversationState) {
    const next = change(demoState ?? loadDemoState());
    saveDemoState(next);
    setDemoState(next);
    setConversations((current) =>
      current
        .filter((item) => !next.hidden.includes(item.id))
        .map((item) => ({
          ...item,
          muted: next.muted.includes(item.id),
          replynProposals: next.proposals[item.id] ?? [],
          requestState: next.blocked.includes(item.id)
            ? "blocked"
            : item.requestState === "blocked"
              ? item.hasActiveApplication ? "none" : "pending"
              : item.requestState,
        })),
    );
  }

  /** Live mode: POSTs a conversation action; returns an error message or null. */
  async function liveAction(path: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/devnet/${path}`, { method: "POST" });
      if (!response.ok) return (await readApiError(response)).message ?? `Không thể thực hiện thao tác (lỗi ${response.status}).`;
      await refreshLiveThreads();
      window.dispatchEvent(new Event(MESSAGES_UPDATED_EVENT));
      return null;
    } catch {
      return "Không kết nối được máy chủ Nova. Hãy thử lại.";
    }
  }

  function handleProposalMenu() {
    if (!selected) return;
    const item = proposalMenuItem(selected.replynProposals ?? []);
    const proposal = item.proposal;
    switch (item.action) {
      case "create":
        setProposalDialog({ initial: emptyForm() });
        break;
      case "continue":
        setProposalDialog({ initial: formFromProposal(proposal!), draftId: proposal!.id });
        break;
      case "view":
        setDetailsId(proposal!.id);
        break;
      case "open":
        if (proposal?.workspaceId) window.open(workspaceUrl(proposal.workspaceId), "_blank", "noopener,noreferrer");
        break;
      case "recreate":
        setProposalDialog({ initial: formFromProposal(proposal!), supersedesId: proposal!.id });
        break;
    }
  }

  const submitProposal: ProposalSubmit = async (form, send) => {
    if (!selected || !proposalDialog) return { ok: false, message: "Không tìm thấy cuộc trò chuyện." };
    const threadId = selected.id;
    const done = () => {
      setProposalDialog(null);
      setNotice(send ? "Đã gửi đề xuất Replyn. Đang chờ freelancer xác nhận." : "Đã lưu bản nháp đề xuất Replyn.");
      return { ok: true as const };
    };
    if (!liveMessages) {
      updateDemo((state) => {
        const list = state.proposals[threadId] ?? [];
        const existing = list.find((p) => p.id === proposalDialog.draftId);
        const saved = demoSave(existing, threadId, form, send, proposalDialog.supersedesId);
        return { ...state, proposals: { ...state.proposals, [threadId]: existing ? list.map((p) => (p.id === saved.id ? saved : p)) : [...list, saved] } };
      });
      return done();
    }
    const base = `/api/devnet/messages/${threadId}/replyn-proposals`;
    const headers = { "Content-Type": "application/json" };
    try {
      let response: Response;
      if (proposalDialog.draftId) {
        response = await fetch(`${base}/${proposalDialog.draftId}`, { method: "PUT", headers, body: JSON.stringify(payload(form)) });
        if (response.ok && send) response = await fetch(`${base}/${proposalDialog.draftId}/send`, { method: "POST" });
      } else {
        response = await fetch(`${base}?send=${send}`, { method: "POST", headers, body: JSON.stringify(payload(form, proposalDialog.supersedesId)) });
      }
      if (!response.ok) {
        const error = await readApiError(response);
        await refreshLiveThreads().catch(() => undefined);
        return { ok: false, message: error.message ?? `Không thể lưu đề xuất (lỗi ${response.status}).`, errors: error.errors };
      }
      await refreshLiveThreads();
      return done();
    } catch {
      return { ok: false, message: "Không kết nối được máy chủ Nova. Hãy thử lại." };
    }
  };

  async function discardDraft() {
    if (!selected || !proposalDialog?.draftId) return;
    const threadId = selected.id;
    const draftId = proposalDialog.draftId;
    if (liveMessages) {
      const error = await liveAction(`messages/${threadId}/replyn-proposals/${draftId}/cancel`);
      if (error) return setNotice(error);
    } else {
      updateDemo((state) => ({ ...state, proposals: { ...state.proposals, [threadId]: (state.proposals[threadId] ?? []).filter((p) => p.id !== draftId) } }));
    }
    setProposalDialog(null);
    setNotice("Đã bỏ bản nháp đề xuất.");
  }

  async function cancelProposal(proposalId: string): Promise<string | null> {
    if (!selected) return "Không tìm thấy cuộc trò chuyện.";
    const threadId = selected.id;
    if (liveMessages) {
      const error = await liveAction(`messages/${threadId}/replyn-proposals/${proposalId}/cancel`);
      if (error) return error;
    } else {
      const now = new Date().toISOString();
      updateDemo((state) => ({
        ...state,
        proposals: {
          ...state.proposals,
          [threadId]: (state.proposals[threadId] ?? []).map((p) => (p.id === proposalId && p.status === "PENDING" ? { ...p, status: "CANCELLED", cancelledAt: now, updatedAt: now } : p)),
        },
      }));
    }
    setDetailsId(null);
    setNotice("Đã hủy đề xuất Replyn.");
    return null;
  }

  async function toggleMute() {
    if (!selected) return;
    const mute = !selected.muted;
    if (liveMessages) {
      const error = await liveAction(`messages/${selected.id}/${mute ? "mute" : "unmute"}`);
      if (error) return setNotice(error);
    } else {
      const id = selected.id;
      updateDemo((state) => ({ ...state, muted: toggle(state.muted, id, mute) }));
    }
    setNotice(mute ? "Đã tắt thông báo cho cuộc trò chuyện này." : "Đã bật lại thông báo.");
  }

  async function runConfirm() {
    if (!confirm) return;
    const { kind, id } = confirm;
    setConfirmBusy(true);
    setConfirmError(null);
    let error: string | null = null;
    if (liveMessages) {
      error = await liveAction(`messages/${id}/${kind === "delete" ? "hide" : kind}`);
    } else {
      updateDemo((state) =>
        kind === "delete"
          ? { ...state, hidden: toggle(state.hidden, id, true) }
          : { ...state, blocked: toggle(state.blocked, id, kind === "block") },
      );
    }
    setConfirmBusy(false);
    if (error) return setConfirmError(error);
    setConfirm(null);
    if (kind === "delete") {
      setMobileThreadOpen(false);
      setSelectedId("");
      setNotice("Đã xóa cuộc trò chuyện khỏi tài khoản của bạn.");
    } else if (kind === "block") {
      setActiveTab("blocked");
      setNotice("Đã chặn ứng viên. Bạn có thể bỏ chặn trong mục Đã chặn.");
    } else {
      setActiveTab("all");
      setNotice("Đã bỏ chặn ứng viên.");
    }
  }

  function patchMessage(applicationId: string, messageId: string, patch: Partial<ApplicationMessage>) {
    setConversations((current) =>
      current.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              messages: application.messages.map((message) =>
                message.id === messageId ? { ...message, ...patch } : message,
              ),
            }
          : application,
      ),
    );
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || !selected || selected.requestState === "pending" || selected.requestState === "blocked") return;
    const applicationId = selected.id;
    if (liveMessages) {
      const response = await fetch(`/api/devnet/messages/${applicationId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
      if (!response.ok) return;
      setDraft("");
      setReplyingTo(null);
      await refreshLiveThreads();
      return;
    }
    const messageId = `business-message-${Date.now()}`;
    const outgoing: ApplicationMessage = {
      id: messageId,
      role: "BUSINESS",
      senderName: "Nova Labs",
      body,
      sentAt: nowLabel(),
      deliveryStatus: "SENDING",
      replyToId: replyingTo?.id,
    };
    setConversations((current) =>
      current.map((application) =>
        application.id === applicationId
          ? { ...application, messages: [...application.messages, outgoing] }
          : application,
      ),
    );
    setDraft("");
    setReplyingTo(null);

    timersRef.current.push(
      window.setTimeout(() => patchMessage(applicationId, messageId, { deliveryStatus: "SENT" }), 450),
    );
    timersRef.current.push(
      window.setTimeout(() => patchMessage(applicationId, messageId, { deliveryStatus: "DELIVERED" }), 950),
    );
    timersRef.current.push(window.setTimeout(() => setTypingId(applicationId), 1250));
    timersRef.current.push(
      window.setTimeout(() => {
        patchMessage(applicationId, messageId, { deliveryStatus: "SEEN" });
        setTypingId(null);
      }, 2600),
    );
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  const isSelectedPending = selected?.requestState === "pending";
  const isSelectedBlocked = selected?.requestState === "blocked";
  const composerLocked = isSelectedPending || isSelectedBlocked;
  const selectedProposals = selected?.replynProposals ?? [];
  // Proposals belong to an active conversation, not to a message request or a blocked candidate.
  const proposalItem = selected && !composerLocked ? proposalMenuItem(selectedProposals) : null;
  const detailsProposal = selectedProposals.find((p) => p.id === detailsId);
  const hasAcceptedProposal = selectedProposals.some((p) => p.status === "ACCEPTED");

  return (
    <div className="messages-view">
      <section
        className={`messages-workspace ${showContext ? "context-open" : "context-hidden"} ${mobileThreadOpen ? "mobile-thread-open" : ""}`}
      >
        <aside className="conversation-rail" aria-label="Danh sách hội thoại">
          <div className="conversation-rail-head">
            <div className="conversation-rail-title-row">
              <div>
                <strong>Hội thoại</strong>
                <small>{allConversations.length} hội thoại</small>
              </div>
              <div className="messages-tab-bar" role="tablist" aria-label="Bộ lọc hội thoại">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "all"}
                  className={`messages-tab-btn ${activeTab === "all" ? "active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "requests"}
                  className={`messages-tab-btn ${activeTab === "requests" ? "active" : ""}`}
                  onClick={() => setActiveTab("requests")}
                >
                  Yêu cầu
                  {pendingRequests.length > 0 && (
                    <span className="messages-tab-badge">{pendingRequests.length}</span>
                  )}
                </button>
                {(blockedConversations.length > 0 || activeTab === "blocked") && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "blocked"}
                    className={`messages-tab-btn ${activeTab === "blocked" ? "active" : ""}`}
                    onClick={() => setActiveTab("blocked")}
                  >
                    Đã chặn
                  </button>
                )}
              </div>
            </div>
            <label className="application-search">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm cuộc trò chuyện..."
                aria-label="Tìm cuộc trò chuyện"
              />
            </label>
          </div>
          <div className="conversation-list">
            {filtered.length === 0 ? (
              <div className="conversation-list-empty">
                <small>
                  {activeTab === "requests"
                    ? "Không có yêu cầu tin nhắn nào."
                    : activeTab === "blocked"
                      ? "Bạn chưa chặn ứng viên nào."
                      : "Không tìm thấy hội thoại."}
                </small>
              </div>
            ) : (
              filtered.map((application, index) => {
                const lastMessage = application.messages.at(-1);
                const isPending = application.requestState === "pending";
                return (
                  <button
                    type="button"
                    className={`conversation-item-btn ${selected?.id === application.id ? "active" : ""} ${isPending ? "is-pending-request" : ""}`}
                    onClick={() => {
                      setSelectedId(application.id);
                      setMobileThreadOpen(true);
                    }}
                    key={application.id}
                  >
                    <Avatar item={application} className="application-avatar" />
                    <span className="conversation-preview">
                      <span>
                        <strong>{application.candidateName}</strong>
                        <time>{lastMessage?.sentAt}</time>
                      </span>
                      <small>{application.jobTitle}</small>
                      {isPending ? (
                        <p className="conversation-preview-hidden">
                          [Tin nhắn ẩn cho đến khi bạn chấp nhận]
                        </p>
                      ) : (
                        <p>
                          {lastMessage?.role === "BUSINESS" ? "Bạn: " : ""}
                          {lastMessage?.body}
                        </p>
                      )}
                      {isPending && (
                        <div
                          className="conversation-item-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="btn-request-action accept"
                            onClick={() => handleAcceptRequest(application.id)}
                          >
                            Chấp nhận
                          </button>
                          <button
                            type="button"
                            className="btn-request-action decline"
                            onClick={() => handleDeclineRequest(application.id)}
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                    </span>
                    {!isPending && (liveMessages ? (application.unreadCount ?? 0) > 0 : index < 2) && (
                      <i className="conversation-unread" aria-label="Tin nhắn chưa đọc" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {selected ? (
          <>
            <section
              className="message-thread"
              aria-label={`Tin nhắn với ${selected.candidateName}`}
            >
              <header className="message-thread-head">
                <button
                  type="button"
                  className="icon-button thread-back"
                  aria-label="Quay lại danh sách"
                  onClick={() => setMobileThreadOpen(false)}
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar item={selected} className="application-avatar" />
                <div>
                  <strong>{selected.candidateName}</strong>
                  <small>
                    {isSelectedPending
                      ? "Yêu cầu tin nhắn mới"
                      : liveMessages
                        ? selected.headline || selected.jobTitle
                        : `Đang hoạt động · ${selected.headline}`}
                  </small>
                </div>
                {!liveMessages && <span className="demo-label">Dữ liệu minh họa</span>}
                <button
                  type="button"
                  className="icon-button context-toggle-button"
                  title={showContext ? "Ẩn thông tin ứng viên" : "Hiện thông tin ứng viên"}
                  aria-label={showContext ? "Ẩn thông tin ứng viên" : "Hiện thông tin ứng viên"}
                  aria-pressed={showContext}
                  onClick={() => setShowContext((value) => !value)}
                >
                  {showContext ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                </button>
                <ThreadOptionsMenu
                  key={selected.id}
                  proposal={proposalItem}
                  muted={Boolean(selected.muted)}
                  blocked={isSelectedBlocked}
                  onProposal={handleProposalMenu}
                  onToggleMute={toggleMute}
                  onDelete={() => { setConfirmError(null); setConfirm({ kind: "delete", id: selected.id }); }}
                  onBlock={() => { setConfirmError(null); setConfirm({ kind: isSelectedBlocked ? "unblock" : "block", id: selected.id }); }}
                />
              </header>

              {isSelectedBlocked && (
                <div className="message-request-banner">
                  <div className="message-request-banner-text">
                    <strong>Bạn đã chặn {selected.candidateName}</strong>
                    <p>Ứng viên không thể gửi tin nhắn hay yêu cầu mới. Lịch sử trò chuyện và các dự án Replyn đã chấp nhận vẫn được giữ.</p>
                  </div>
                  <div className="message-request-banner-actions">
                    <button type="button" className="business-secondary-button compact" onClick={() => { setConfirmError(null); setConfirm({ kind: "unblock", id: selected.id }); }}>
                      Bỏ chặn
                    </button>
                  </div>
                </div>
              )}

              {/* Message Request Banner if pending */}
              {isSelectedPending && (
                <div className="message-request-banner">
                  <div className="message-request-banner-text">
                    <strong>Yêu cầu tin nhắn từ {selected.candidateName}</strong>
                    <p>
                      Tin nhắn ẩn cho đến khi bạn chấp nhận. Người gửi sẽ không biết bạn đã đọc tin
                      nhắn này cho đến khi bạn chấp nhận.
                    </p>
                  </div>
                  <div className="message-request-banner-actions">
                    <button
                      type="button"
                      className="business-primary-button compact"
                      onClick={() => handleAcceptRequest(selected.id)}
                    >
                      Chấp nhận
                    </button>
                    <button
                      type="button"
                      className="business-secondary-button compact"
                      onClick={() => handleDeclineRequest(selected.id)}
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              )}

              <div className="message-stream" aria-live="polite">
                <div className="thread-date">
                  <span>Hôm nay</span>
                </div>
                {streamItems(selected.messages, selectedProposals).map((item) => {
                  if (item.kind === "proposal") {
                    return (
                      <div className="message-row proposal-row" key={`proposal-${item.proposal.id}`}>
                        <ProposalCard proposal={item.proposal} onOpen={() => setDetailsId(item.proposal.id)} />
                      </div>
                    );
                  }
                  const message = item.message;
                  const quoted = message.replyToId
                    ? selected.messages.find((item) => item.id === message.replyToId)
                    : null;
                  if (message.role === "SYSTEM")
                    return (
                      <div className="system-message" key={message.id}>
                        <Check size={13} />
                        {message.body}
                      </div>
                    );

                  return (
                    <div
                      className={`message-row ${message.role === "BUSINESS" ? "outgoing" : "incoming"}`}
                      key={message.id}
                    >
                      {message.role === "TALENT" && (
                        <Avatar item={selected} className="application-avatar compact" />
                      )}
                      <article
                        className={`message-bubble ${isSelectedPending && message.role === "TALENT" ? "message-bubble-hidden-state" : ""}`}
                      >
                        {quoted && (
                          <blockquote>
                            <strong>{quoted.senderName}</strong>
                            <span>{quoted.body}</span>
                          </blockquote>
                        )}
                        {isSelectedPending && message.role === "TALENT" ? (
                          <p className="message-text-hidden">
                            <em>[Tin nhắn ẩn cho đến khi bạn chấp nhận]</em>
                          </p>
                        ) : (
                          <p>{message.body}</p>
                        )}
                        <footer>
                          <time>{message.sentAt}</time>
                          <DeliveryMark message={message} />
                        </footer>
                      </article>
                      {!isSelectedPending && (
                        <button
                          type="button"
                          className="message-reply-button"
                          title="Trả lời"
                          aria-label="Trả lời tin nhắn"
                          onClick={() => setReplyingTo(message)}
                        >
                          <Reply size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
                {typingId === selected.id && (
                  <div className="message-row incoming typing-row">
                    <Avatar item={selected} className="application-avatar compact" />
                    <div
                      className="typing-indicator"
                      aria-label={`${selected.candidateName} đang nhập`}
                    >
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form className="message-composer" onSubmit={sendMessage}>
                {replyingTo && (
                  <div className="composer-reply">
                    <Reply size={14} />
                    <span>
                      <strong>Đang trả lời {replyingTo.senderName}</strong>
                      <small>{replyingTo.body}</small>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      aria-label="Hủy trả lời"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    className="icon-button"
                    title="Đính kèm"
                    aria-label="Đính kèm tệp"
                    disabled={composerLocked}
                  >
                    <Paperclip size={18} />
                  </button>
                  <textarea
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      if (event.target.value.trim()) reportTyping();
                    }}
                    onKeyDown={handleComposerKeyDown}
                    rows={1}
                    placeholder={
                      isSelectedBlocked
                        ? "Bạn đã chặn ứng viên này"
                        : isSelectedPending
                          ? "Bạn cần chấp nhận yêu cầu tin nhắn để trả lời..."
                          : `Nhắn cho ${selected.candidateName}...`
                    }
                    aria-label="Nội dung tin nhắn"
                    disabled={composerLocked}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    title="Biểu cảm"
                    aria-label="Chọn biểu cảm"
                    disabled={composerLocked}
                  >
                    <Smile size={18} />
                  </button>
                  <button
                    type="submit"
                    className="message-send-button"
                    disabled={!draft.trim() || composerLocked}
                    title="Gửi"
                    aria-label="Gửi tin nhắn"
                  >
                    <Send size={17} />
                  </button>
                </div>
                <small>
                  {isSelectedBlocked
                    ? "Bỏ chặn để tiếp tục trò chuyện"
                    : isSelectedPending
                      ? "Chấp nhận yêu cầu để bắt đầu trò chuyện"
                      : "Enter để gửi · Shift + Enter để xuống dòng"}
                </small>
              </form>
            </section>

            <aside className="message-context" aria-label="Thông tin ứng viên">
              <button
                type="button"
                className="icon-button context-close"
                aria-label="Đóng thông tin"
                onClick={() => setShowContext(false)}
              >
                <X size={17} />
              </button>
              <Avatar item={selected} className="application-avatar context-avatar" />
              <h2>{selected.candidateName}</h2>
              <p>{selected.headline}</p>
              {(() => {
                // Live threads only show a status that comes from a real application.
                const status = liveMessages ? selected.applicationStatus : selected.status;
                return status ? (
                  <span className={`application-status ${statusCopy[status].tone}`}>
                    {statusCopy[status].label}
                  </span>
                ) : null;
              })()}
              <dl>
                <div>
                  <dt>Vị trí</dt>
                  <dd>{selected.jobTitle}</dd>
                </div>
                {selected.location && (
                  <div>
                    <dt>Khu vực</dt>
                    <dd>{selected.location}</dd>
                  </div>
                )}
                {!liveMessages && (
                  <>
                    <div>
                      <dt>Phù hợp</dt>
                      <dd>{selected.matchScore}%</dd>
                    </div>
                    <div>
                      <dt>Bắt đầu</dt>
                      <dd>{selected.availability}</dd>
                    </div>
                  </>
                )}
              </dl>
              <div className="message-context-skills">
                {selected.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              {(!liveMessages || selected.applicationId) && (
                <Link
                  href={`/business/applications?candidate=${selected.applicationId ?? selected.id}`}
                  className="business-secondary-button"
                >
                  <UserRoundCheck size={16} />
                  Xem hồ sơ
                </Link>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="business-secondary-button">
                  <ExternalLink size={16} />
                  Gửi email
                </a>
              )}
              <div className="context-trust-note">
                <FileText size={16} />
                <span>
                  <strong>{selected.applicationId ? "Hội thoại theo hồ sơ" : "Trò chuyện trực tiếp"}</strong>
                  <small>
                    {liveMessages
                      ? selected.applicationId
                        ? `Liên kết với hồ sơ ứng tuyển “${selected.jobTitle}”.`
                        : "Ứng viên chưa ứng tuyển công việc nào của bạn."
                      : "Nội dung sẽ được gắn với đơn ứng tuyển khi kết nối backend."}
                  </small>
                </span>
              </div>
            </aside>
          </>
        ) : (
          <div className="application-empty workspace">
            <Search size={28} />
            <strong>Không tìm thấy hội thoại</strong>
          </div>
        )}
      </section>

      {selected && proposalDialog && (
        <ReplynProposalDialog
          key={proposalDialog.draftId ?? proposalDialog.supersedesId ?? "new"}
          candidateName={selected.candidateName}
          initial={proposalDialog.initial}
          hasDraft={Boolean(proposalDialog.draftId)}
          replacesRejected={Boolean(proposalDialog.supersedesId)}
          onSubmit={submitProposal}
          onDiscardDraft={discardDraft}
          onClose={() => setProposalDialog(null)}
        />
      )}

      {selected && detailsProposal && (
        <ProposalDetailsDialog
          proposal={detailsProposal}
          previous={selectedProposals.find((p) => p.id === detailsProposal.supersedesId)}
          candidateName={selected.candidateName}
          demo={!liveMessages}
          onCancel={() => cancelProposal(detailsProposal.id)}
          onClose={() => setDetailsId(null)}
        />
      )}

      {selected && confirm?.kind === "delete" && (
        <ConfirmDialog
          title="Xóa cuộc trò chuyện?"
          icon={<Trash2 size={22} />}
          tone="danger"
          confirmLabel="Xóa cuộc trò chuyện"
          busy={confirmBusy}
          error={confirmError}
          onConfirm={runConfirm}
          onClose={() => setConfirm(null)}
        >
          <p>Cuộc trò chuyện chỉ bị xóa khỏi tài khoản của bạn. {selected.candidateName} vẫn giữ toàn bộ lịch sử; nếu ứng viên nhắn tiếp, cuộc trò chuyện sẽ hiện lại.</p>
          {hasAcceptedProposal && <p className="replyn-warning"><AlertTriangle size={15} />Đề xuất đã chấp nhận và workspace Replyn không bị xóa.</p>}
        </ConfirmDialog>
      )}

      {selected && confirm?.kind === "block" && (
        <ConfirmDialog
          title={`Chặn ${selected.candidateName}?`}
          icon={<Ban size={22} />}
          tone="danger"
          confirmLabel="Chặn ứng viên"
          busy={confirmBusy}
          error={confirmError}
          onConfirm={runConfirm}
          onClose={() => setConfirm(null)}
        >
          <p>Ứng viên sẽ không thể gửi tin nhắn hoặc yêu cầu mới tới doanh nghiệp. Lịch sử trò chuyện được giữ nguyên và bạn có thể bỏ chặn bất cứ lúc nào trong mục Đã chặn.</p>
          {selectedProposals.some((p) => p.status === "PENDING") && <p>Đề xuất Replyn đang chờ phản hồi sẽ bị hủy.</p>}
          {hasAcceptedProposal && (
            <p className="replyn-warning"><AlertTriangle size={15} />Hai bên đang có dự án Replyn. Workspace, thỏa thuận và bằng chứng dự án vẫn được giữ nguyên sau khi chặn.</p>
          )}
        </ConfirmDialog>
      )}

      {selected && confirm?.kind === "unblock" && (
        <ConfirmDialog
          title={`Bỏ chặn ${selected.candidateName}?`}
          icon={<UserRoundCheck size={22} />}
          tone="primary"
          confirmLabel="Bỏ chặn"
          busy={confirmBusy}
          error={confirmError}
          onConfirm={runConfirm}
          onClose={() => setConfirm(null)}
        >
          <p>Ứng viên có thể nhắn tin lại cho doanh nghiệp. Cuộc trò chuyện trở về trạng thái trước khi chặn.</p>
        </ConfirmDialog>
      )}

      {notice && (
        <div className="messages-notice" role="status">{notice}</div>
      )}
    </div>
  );
}
