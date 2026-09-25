"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock3,
  ExternalLink,
  FileText,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Reply,
  Search,
  Send,
  Smile,
  UserRoundCheck,
  X,
} from "lucide-react";
import { demoApplications } from "@/lib/application-demo-data";
import { statusCopy } from "@/lib/application-status";
import type { ApplicationMessage, CandidateApplication } from "@/types/application";

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
  requestState: "none" | "pending" | "accepted" | "declined";
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

export function MessagesView({ initialCandidateId }: { initialCandidateId?: string }) {
  const [conversations, setConversations] = useState<ConversationItem[]>(() => {
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

  const [activeTab, setActiveTab] = useState<"all" | "requests">("all");
  const [selectedId, setSelectedId] = useState(
    initialCandidateId && demoApplications.some((item) => item.id === initialCandidateId)
      ? initialCandidateId
      : demoApplications[0]?.id ?? "",
  );
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ApplicationMessage | null>(null);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(true);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(Boolean(initialCandidateId));
  const bottomRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  const pendingRequests = useMemo(
    () => conversations.filter((c) => c.requestState === "pending"),
    [conversations],
  );

  const allConversations = useMemo(
    () => conversations.filter((c) => c.requestState === "none" || c.requestState === "accepted"),
    [conversations],
  );

  const currentList = activeTab === "all" ? allConversations : pendingRequests;

  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("vi");
    return currentList.filter(
      (item) => !value || `${item.candidateName} ${item.jobTitle}`.toLocaleLowerCase("vi").includes(value),
    );
  }, [currentList, query]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selected?.messages.length, typingId]);

  useEffect(() => () => timersRef.current.forEach(window.clearTimeout), []);

  function handleAcceptRequest(applicationId: string) {
    setConversations((current) =>
      current.map((item) => (item.id === applicationId ? { ...item, requestState: "accepted" } : item)),
    );
    setActiveTab("all");
    setSelectedId(applicationId);
    setMobileThreadOpen(true);
  }

  function handleDeclineRequest(applicationId: string) {
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

  function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || !selected || selected.requestState === "pending") return;
    const applicationId = selected.id;
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
                <small>{allConversations.length} ứng viên</small>
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
                    <span className="application-avatar">
                      {application.initials}
                      <i />
                    </span>
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
                    {!isPending && index < 2 && (
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
                <span className="application-avatar">
                  {selected.initials}
                  <i />
                </span>
                <div>
                  <strong>{selected.candidateName}</strong>
                  <small>
                    {isSelectedPending
                      ? "Yêu cầu tin nhắn mới"
                      : `Đang hoạt động · ${selected.headline}`}
                  </small>
                </div>
                <span className="demo-label">Dữ liệu minh họa</span>
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
                <button
                  type="button"
                  className="icon-button"
                  title="Tùy chọn"
                  aria-label="Tùy chọn hội thoại"
                >
                  <MoreHorizontal size={18} />
                </button>
              </header>

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
                {selected.messages.map((message) => {
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
                        <span className="application-avatar compact">{selected.initials}</span>
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
                    <span className="application-avatar compact">{selected.initials}</span>
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
                    disabled={isSelectedPending}
                  >
                    <Paperclip size={18} />
                  </button>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    rows={1}
                    placeholder={
                      isSelectedPending
                        ? "Bạn cần chấp nhận yêu cầu tin nhắn để trả lời..."
                        : `Nhắn cho ${selected.candidateName}...`
                    }
                    aria-label="Nội dung tin nhắn"
                    disabled={isSelectedPending}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    title="Biểu cảm"
                    aria-label="Chọn biểu cảm"
                    disabled={isSelectedPending}
                  >
                    <Smile size={18} />
                  </button>
                  <button
                    type="submit"
                    className="message-send-button"
                    disabled={!draft.trim() || isSelectedPending}
                    title="Gửi"
                    aria-label="Gửi tin nhắn"
                  >
                    <Send size={17} />
                  </button>
                </div>
                <small>
                  {isSelectedPending
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
              <span className="application-avatar context-avatar">{selected.initials}</span>
              <h2>{selected.candidateName}</h2>
              <p>{selected.headline}</p>
              <span className={`application-status ${statusCopy[selected.status].tone}`}>
                {statusCopy[selected.status].label}
              </span>
              <dl>
                <div>
                  <dt>Vị trí</dt>
                  <dd>{selected.jobTitle}</dd>
                </div>
                <div>
                  <dt>Phù hợp</dt>
                  <dd>{selected.matchScore}%</dd>
                </div>
                <div>
                  <dt>Bắt đầu</dt>
                  <dd>{selected.availability}</dd>
                </div>
              </dl>
              <div className="message-context-skills">
                {selected.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <Link
                href={`/business/applications?candidate=${selected.id}`}
                className="business-secondary-button"
              >
                <UserRoundCheck size={16} />
                Xem hồ sơ
              </Link>
              <a href={`mailto:${selected.email}`} className="business-secondary-button">
                <ExternalLink size={16} />
                Gửi email
              </a>
              <div className="context-trust-note">
                <FileText size={16} />
                <span>
                  <strong>Hội thoại theo hồ sơ</strong>
                  <small>Nội dung sẽ được gắn với đơn ứng tuyển khi kết nối backend.</small>
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
    </div>
  );
}
