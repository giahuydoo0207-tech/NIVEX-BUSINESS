"use client";

import { useState } from "react";
import { CommunityPost, PostComment, PostCommentReply, PostReactionType } from "@/types/community";
import { calculateTotalComments } from "@/lib/community-utils";
import { POST_REACTIONS } from "@/lib/community-constants";
import { ReactionPicker } from "./ReactionPicker";
import {
  Building2,
  CornerDownRight,
  Send,
  Smile,
  ThumbsUp,
  User,
  X,
} from "lucide-react";

interface CommentModalProps {
  post: CommunityPost;
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (postId: string, content: string) => void;
  onAddReply: (
    postId: string,
    commentId: string,
    content: string,
    replyingToName?: string
  ) => void;
  onReact: (postId: string, targetId: string, reaction: PostReactionType) => void;
}

interface CommentReactionControlProps {
  postId: string;
  item: PostComment | PostCommentReply;
  onReact: (postId: string, targetId: string, reaction: PostReactionType) => void;
}

function CommentReactionControl({ postId, item, onReact }: CommentReactionControlProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const selectedReaction = item.myReaction ?? (item.isLiked ? "like" : null);
  const config = selectedReaction ? POST_REACTIONS[selectedReaction] : null;
  const Icon = config?.icon ?? ThumbsUp;

  return (
    <div className="comment-reaction-control">
      {isPickerOpen && (
        <ReactionPicker
          onSelect={(reaction) => onReact(postId, item.id, reaction)}
          onClose={() => setIsPickerOpen(false)}
        />
      )}
      <button
        type="button"
        className={`comment-like-btn ${selectedReaction ? "liked" : ""}`}
        style={config ? { color: config.color } : undefined}
        onClick={() => onReact(postId, item.id, selectedReaction ?? "like")}
      >
        <Icon size={13} />
        <span>
          {config?.label ?? "Thích"}
          {item.likeCount > 0 && ` (${item.likeCount})`}
        </span>
      </button>
      <button
        type="button"
        className="comment-reaction-picker-toggle"
        onClick={() => setIsPickerOpen((open) => !open)}
        aria-label="Chọn cảm xúc"
        aria-expanded={isPickerOpen}
      >
        <Smile size={14} />
      </button>
    </div>
  );
}

export function CommentModal({
  post,
  isOpen,
  onClose,
  onAddComment,
  onAddReply,
  onReact,
}: CommentModalProps) {
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);

  if (!isOpen) return null;

  const totalComments = calculateTotalComments(post.comments);
  const postAuthorName = post.author?.displayName || (post.isMine ? "Nova Labs" : "");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (replyingTo) {
      onAddReply(post.id, replyingTo.commentId, trimmed, replyingTo.authorName);
      setReplyingTo(null);
    } else {
      onAddComment(post.id, trimmed);
    }
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="comment-modal-backdrop" onClick={onClose}>
      <div
        className="comment-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-modal-title"
      >
        {/* Header */}
        <div className="comment-modal-header">
          <h3 id="comment-modal-title" className="comment-modal-title">
            Bình luận ({totalComments})
          </h3>
          <button
            type="button"
            className="comment-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comment list */}
        <div className="comment-list-body">
          {post.comments.length === 0 ? (
            <div className="comment-empty-state">
              <p className="comment-empty-title">Chưa có bình luận nào</p>
              <p className="comment-empty-sub">
                Hãy là người đầu tiên chia sẻ góc nhìn hoặc đặt câu hỏi.
              </p>
            </div>
          ) : (
            post.comments.map((comment) => {
              const isAuthor = comment.authorName === postAuthorName;
              return (
                <div key={comment.id} className="comment-thread-item">
                  <div className="comment-main-row">
                    <div className="comment-avatar">
                      {comment.authorName === "Nova Labs" ? (
                        <Building2 size={16} className="text-amber-400" />
                      ) : (
                        <User size={16} className="text-sky-400" />
                      )}
                    </div>
                    <div className="comment-content-box">
                      <div className="comment-bubble">
                        <div className="comment-author-line">
                          <span className="comment-author-name">
                            {comment.authorName}
                          </span>
                          {isAuthor && (
                            <span className="comment-author-badge">Tác giả</span>
                          )}
                        </div>
                        {comment.headline && (
                          <div className="comment-author-headline">
                            {comment.headline}
                          </div>
                        )}
                        <p className="comment-text">{comment.content}</p>
                      </div>

                      <div className="comment-actions-bar">
                        <span className="comment-time">{comment.timeLabel}</span>
                        <CommentReactionControl
                          postId={post.id}
                          item={comment}
                          onReact={onReact}
                        />
                        <button
                          type="button"
                          className="comment-reply-btn"
                          onClick={() =>
                            setReplyingTo({
                              commentId: comment.id,
                              authorName: comment.authorName,
                            })
                          }
                        >
                          Trả lời
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="comment-replies-container">
                      {comment.replies.map((reply) => {
                        const isReplyAuthor = reply.authorName === postAuthorName;
                        return (
                          <div key={reply.id} className="comment-reply-item">
                            <div className="comment-avatar reply-avatar">
                              {reply.authorName === "Nova Labs" ? (
                                <Building2 size={14} className="text-amber-400" />
                              ) : (
                                <User size={14} className="text-sky-400" />
                              )}
                            </div>
                            <div className="comment-content-box">
                              <div className="comment-bubble">
                                <div className="comment-author-line">
                                  <span className="comment-author-name">
                                    {reply.authorName}
                                  </span>
                                  {isReplyAuthor && (
                                    <span className="comment-author-badge">
                                      Tác giả
                                    </span>
                                  )}
                                </div>
                                {reply.headline && (
                                  <div className="comment-author-headline">
                                    {reply.headline}
                                  </div>
                                )}
                                {reply.replyingToName && (
                                  <div className="comment-replying-tag">
                                    <CornerDownRight size={12} />
                                    <span>
                                      Trả lời @{reply.replyingToName}
                                    </span>
                                  </div>
                                )}
                                <p className="comment-text">{reply.content}</p>
                              </div>

                              <div className="comment-actions-bar">
                                <span className="comment-time">
                                  {reply.timeLabel}
                                </span>
                                <CommentReactionControl
                                  postId={post.id}
                                  item={reply}
                                  onReact={onReact}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Input footer */}
        <div className="comment-modal-footer">
          {replyingTo && (
            <div className="comment-replying-banner">
              <span>Đang trả lời <strong>{replyingTo.authorName}</strong></span>
              <button
                type="button"
                className="cancel-reply-btn"
                onClick={() => setReplyingTo(null)}
                aria-label="Hủy trả lời"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="comment-input-row">
            <div className="comment-avatar self-avatar">
              <Building2 size={16} className="text-amber-400" />
            </div>
            <input
              type="text"
              className="comment-text-input"
              placeholder={
                replyingTo
                  ? `Trả lời ${replyingTo.authorName}...`
                  : "Viết bình luận..."
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className="comment-send-btn"
              disabled={!text.trim()}
              onClick={handleSend}
              aria-label="Gửi bình luận"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
