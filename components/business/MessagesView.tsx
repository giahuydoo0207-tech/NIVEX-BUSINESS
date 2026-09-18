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
  Info,
  MoreHorizontal,
  Paperclip,
  Reply,
  Search,
  Send,
  Smile,
  UserRoundCheck,
  X,
} from "lucide-react";
import { demoApplications } from "@/lib/application-demo-data";
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

export function MessagesView({ initialCandidateId }: { initialCandidateId?: string }) {
  const [conversations, setConversations] = useState<CandidateApplication[]>(() => structuredClone(demoApplications));
  const [selectedId, setSelectedId] = useState(
    initialCandidateId && demoApplications.some((item) => item.id === initialCandidateId)
      ? initialCandidateId
      : demoApplications[0]?.id ?? "",
  );
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ApplicationMessage | null>(null);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(Boolean(initialCandidateId));
  const bottomRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("vi");
    return conversations.filter((item) => !value || `${item.candidateName} ${item.jobTitle}`.toLocaleLowerCase("vi").includes(value));
  }, [conversations, query]);
  const selected = conversations.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selected?.messages.length, typingId]);

  useEffect(() => () => timersRef.current.forEach(window.clearTimeout), []);

  function patchMessage(applicationId: string, messageId: string, patch: Partial<ApplicationMessage>) {
    setConversations((current) => current.map((application) => application.id === applicationId
      ? { ...application, messages: application.messages.map((message) => message.id === messageId ? { ...message, ...patch } : message) }
      : application));
  }

  function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || !selected) return;
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
    setConversations((current) => current.map((application) => application.id === applicationId
      ? { ...application, messages: [...application.messages, outgoing] }
      : application));
    setDraft("");
    setReplyingTo(null);

    timersRef.current.push(window.setTimeout(() => patchMessage(applicationId, messageId, { deliveryStatus: "SENT" }), 450));
    timersRef.current.push(window.setTimeout(() => patchMessage(applicationId, messageId, { deliveryStatus: "DELIVERED" }), 950));
    timersRef.current.push(window.setTimeout(() => setTypingId(applicationId), 1250));
    timersRef.current.push(window.setTimeout(() => {
      patchMessage(applicationId, messageId, { deliveryStatus: "SEEN" });
      setTypingId(null);
    }, 2600));
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="messages-view">
      <section className={`messages-workspace ${showContext ? "context-open" : ""} ${mobileThreadOpen ? "mobile-thread-open" : ""}`}>
        <aside className="conversation-rail" aria-label="Danh sách hội thoại">
          <div className="conversation-rail-head">
            <div><strong>Hội thoại</strong><small>{conversations.length} ứng viên</small></div>
            <label className="application-search">
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm cuộc trò chuyện..." aria-label="Tìm cuộc trò chuyện" />
            </label>
          </div>
          <div className="conversation-list">
            {filtered.map((application, index) => {
              const lastMessage = application.messages.at(-1);
              return (
                <button type="button" className={selected?.id === application.id ? "active" : undefined} onClick={() => { setSelectedId(application.id); setMobileThreadOpen(true); }} key={application.id}>
                  <span className="application-avatar">{application.initials}<i /></span>
                  <span className="conversation-preview">
                    <span><strong>{application.candidateName}</strong><time>{lastMessage?.sentAt}</time></span>
                    <small>{application.jobTitle}</small>
                    <p>{lastMessage?.role === "BUSINESS" ? "Bạn: " : ""}{lastMessage?.body}</p>
                  </span>
                  {index < 2 && <i className="conversation-unread" aria-label="Tin nhắn chưa đọc" />}
                </button>
              );
            })}
          </div>
        </aside>

        {selected ? (
          <>
            <section className="message-thread" aria-label={`Tin nhắn với ${selected.candidateName}`}>
              <header className="message-thread-head">
                <button type="button" className="icon-button thread-back" aria-label="Quay lại danh sách" onClick={() => setMobileThreadOpen(false)}><ArrowLeft size={18} /></button>
                <span className="application-avatar">{selected.initials}<i /></span>
                <div><strong>{selected.candidateName}</strong><small>Đang hoạt động · {selected.headline}</small></div>
                <span className="message-prototype-tag"><i />PROTOTYPE</span>
                <button type="button" className="icon-button" title="Thông tin ứng viên" aria-label="Thông tin ứng viên" onClick={() => setShowContext((value) => !value)}><Info size={18} /></button>
                <button type="button" className="icon-button" title="Tùy chọn" aria-label="Tùy chọn hội thoại"><MoreHorizontal size={18} /></button>
              </header>

              <div className="message-stream" aria-live="polite">
                <div className="thread-date"><span>Hôm nay</span></div>
                {selected.messages.map((message) => {
                  const quoted = message.replyToId ? selected.messages.find((item) => item.id === message.replyToId) : null;
                  if (message.role === "SYSTEM") return <div className="system-message" key={message.id}><Check size={13} />{message.body}</div>;
                  return (
                    <div className={`message-row ${message.role === "BUSINESS" ? "outgoing" : "incoming"}`} key={message.id}>
                      {message.role === "TALENT" && <span className="application-avatar compact">{selected.initials}</span>}
                      <article className="message-bubble">
                        {quoted && <blockquote><strong>{quoted.senderName}</strong><span>{quoted.body}</span></blockquote>}
                        <p>{message.body}</p>
                        <footer><time>{message.sentAt}</time><DeliveryMark message={message} /></footer>
                      </article>
                      <button type="button" className="message-reply-button" title="Trả lời" aria-label="Trả lời tin nhắn" onClick={() => setReplyingTo(message)}><Reply size={15} /></button>
                    </div>
                  );
                })}
                {typingId === selected.id && (
                  <div className="message-row incoming typing-row">
                    <span className="application-avatar compact">{selected.initials}</span>
                    <div className="typing-indicator" aria-label={`${selected.candidateName} đang nhập`}><i /><i /><i /></div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form className="message-composer" onSubmit={sendMessage}>
                {replyingTo && (
                  <div className="composer-reply">
                    <Reply size={14} /><span><strong>Đang trả lời {replyingTo.senderName}</strong><small>{replyingTo.body}</small></span>
                    <button type="button" onClick={() => setReplyingTo(null)} aria-label="Hủy trả lời"><X size={15} /></button>
                  </div>
                )}
                <div>
                  <button type="button" className="icon-button" title="Đính kèm" aria-label="Đính kèm tệp"><Paperclip size={18} /></button>
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleComposerKeyDown} rows={1} placeholder={`Nhắn cho ${selected.candidateName}...`} aria-label="Nội dung tin nhắn" />
                  <button type="button" className="icon-button" title="Biểu cảm" aria-label="Chọn biểu cảm"><Smile size={18} /></button>
                  <button type="submit" className="message-send-button" disabled={!draft.trim()} title="Gửi" aria-label="Gửi tin nhắn"><Send size={17} /></button>
                </div>
                <small>Enter để gửi · Shift + Enter để xuống dòng</small>
              </form>
            </section>

            <aside className="message-context" aria-label="Thông tin ứng viên">
              <button type="button" className="icon-button context-close" aria-label="Đóng thông tin" onClick={() => setShowContext(false)}><X size={17} /></button>
              <span className="application-avatar context-avatar">{selected.initials}</span>
              <h2>{selected.candidateName}</h2>
              <p>{selected.headline}</p>
              <span className={`application-status ${selected.status === "APPROVED" ? "approved" : selected.status === "IN_REVIEW" ? "review" : "new"}`}>{selected.status === "APPROVED" ? "Đã duyệt" : selected.status === "IN_REVIEW" ? "Đang xem xét" : "Mới gửi"}</span>
              <dl>
                <div><dt>Vị trí</dt><dd>{selected.jobTitle}</dd></div>
                <div><dt>Phù hợp</dt><dd>{selected.matchScore}%</dd></div>
                <div><dt>Bắt đầu</dt><dd>{selected.availability}</dd></div>
              </dl>
              <div className="message-context-skills">{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              <Link href={`/business/applications?candidate=${selected.id}`} className="business-secondary-button"><UserRoundCheck size={16} />Xem hồ sơ</Link>
              <a href={`mailto:${selected.email}`} className="business-secondary-button"><ExternalLink size={16} />Gửi email</a>
              <div className="context-trust-note"><FileText size={16} /><span><strong>Hội thoại theo hồ sơ</strong><small>Nội dung sẽ được gắn với đơn ứng tuyển khi kết nối backend.</small></span></div>
            </aside>
          </>
        ) : (
          <div className="application-empty workspace"><Search size={28} /><strong>Không tìm thấy hội thoại</strong></div>
        )}
      </section>
    </div>
  );
}
