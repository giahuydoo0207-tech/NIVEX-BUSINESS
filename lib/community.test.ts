import test from "node:test";
import assert from "node:assert/strict";
import {
  determineGalleryLayout,
  togglePostReaction,
  addCommentToPost,
  addReplyToPost,
  toggleCommentLikeInPost,
  togglePostPin,
  togglePostSave,
  hidePost,
  restorePost,
  calculateTotalComments,
} from "./community-utils.ts";
import type { CommunityPost, PostComment, PostCommentReply } from "../types/community.ts";

const mockPost: CommunityPost = {
  id: "test-post-1",
  content: "Test post content",
  images: [],
  timeLabel: "1 giờ trước",
  createdAt: new Date().toISOString(),
  isMine: true,
  reactionCount: 10,
  myReaction: null,
  comments: [],
};

test("determineGalleryLayout categorizes images correctly", () => {
  assert.equal(determineGalleryLayout(0), "none");
  assert.equal(determineGalleryLayout(1), "single");
  assert.equal(determineGalleryLayout(2), "double");
  assert.equal(determineGalleryLayout(3), "triple");
  assert.equal(determineGalleryLayout(4), "quad");
  assert.equal(determineGalleryLayout(10), "quad");
});

test("togglePostReaction handles first reaction", () => {
  const result = togglePostReaction(mockPost, "like");
  assert.equal(result.myReaction, "like");
  assert.equal(result.reactionCount, 11);
});

test("togglePostReaction handles switching reaction without changing count", () => {
  const reacted = togglePostReaction(mockPost, "like");
  assert.equal(reacted.myReaction, "like");
  assert.equal(reacted.reactionCount, 11);

  const switched = togglePostReaction(reacted, "deal");
  assert.equal(switched.myReaction, "deal");
  assert.equal(switched.reactionCount, 11);

  const switchedAgain = togglePostReaction(switched, "launch");
  assert.equal(switchedAgain.myReaction, "launch");
  assert.equal(switchedAgain.reactionCount, 11);
});

test("togglePostReaction un-reacts when clicking same reaction again", () => {
  const reacted = togglePostReaction(mockPost, "trust");
  assert.equal(reacted.myReaction, "trust");
  assert.equal(reacted.reactionCount, 11);

  const unreacted = togglePostReaction(reacted, "trust");
  assert.equal(unreacted.myReaction, null);
  assert.equal(unreacted.reactionCount, 10);
});

test("addCommentToPost prepends new comment and updates count", () => {
  const comment: PostComment = {
    id: "c-1",
    authorName: "Trần Bảo Long",
    headline: "Product Manager",
    content: "Bình luận thử nghiệm",
    timeLabel: "Vừa xong",
    likeCount: 0,
    isLiked: false,
    replies: [],
  };

  const updated = addCommentToPost(mockPost, comment);
  assert.equal(updated.comments.length, 1);
  assert.equal(updated.comments[0].id, "c-1");
  assert.equal(calculateTotalComments(updated.comments), 1);
});

test("addReplyToPost appends reply to correct parent comment", () => {
  const comment1: PostComment = {
    id: "c-1",
    authorName: "Author 1",
    headline: "Headline 1",
    content: "Comment 1",
    timeLabel: "5 phút trước",
    likeCount: 0,
    isLiked: false,
    replies: [],
  };
  const comment2: PostComment = {
    id: "c-2",
    authorName: "Author 2",
    headline: "Headline 2",
    content: "Comment 2",
    timeLabel: "10 phút trước",
    likeCount: 0,
    isLiked: false,
    replies: [],
  };

  let post = addCommentToPost(mockPost, comment2);
  post = addCommentToPost(post, comment1);

  const reply: PostCommentReply = {
    id: "r-1",
    authorName: "Replier",
    headline: "Dev",
    content: "Reply to c-1",
    timeLabel: "Vừa xong",
    replyingToName: "Author 1",
    likeCount: 0,
    isLiked: false,
  };

  const withReply = addReplyToPost(post, "c-1", reply);
  const targetParent = withReply.comments.find((c) => c.id === "c-1");
  assert.ok(targetParent);
  assert.equal(targetParent.replies.length, 1);
  assert.equal(targetParent.replies[0].id, "r-1");
  assert.equal(calculateTotalComments(withReply.comments), 3); // 2 comments + 1 reply
});

test("toggleCommentLikeInPost toggles like for top comment and nested reply", () => {
  const reply: PostCommentReply = {
    id: "r-1",
    authorName: "Replier",
    headline: "Dev",
    content: "Reply to c-1",
    timeLabel: "Vừa xong",
    likeCount: 2,
    isLiked: false,
  };
  const comment: PostComment = {
    id: "c-1",
    authorName: "Author 1",
    headline: "Headline 1",
    content: "Comment 1",
    timeLabel: "5 phút trước",
    likeCount: 4,
    isLiked: false,
    replies: [reply],
  };

  const post = addCommentToPost(mockPost, comment);

  // Like parent comment
  const likedCommentPost = toggleCommentLikeInPost(post, "c-1");
  assert.equal(likedCommentPost.comments[0].isLiked, true);
  assert.equal(likedCommentPost.comments[0].likeCount, 5);

  // Unlike parent comment
  const unlikedCommentPost = toggleCommentLikeInPost(likedCommentPost, "c-1");
  assert.equal(unlikedCommentPost.comments[0].isLiked, false);
  assert.equal(unlikedCommentPost.comments[0].likeCount, 4);

  // Like nested reply
  const likedReplyPost = toggleCommentLikeInPost(post, "r-1");
  assert.equal(likedReplyPost.comments[0].replies[0].isLiked, true);
  assert.equal(likedReplyPost.comments[0].replies[0].likeCount, 3);
});

test("togglePostPin, togglePostSave, hidePost and restorePost work properly", () => {
  const pinned = togglePostPin(mockPost);
  assert.equal(pinned.isPinned, true);
  const unpinned = togglePostPin(pinned);
  assert.equal(unpinned.isPinned, false);

  const saved = togglePostSave(mockPost);
  assert.equal(saved.isSaved, true);
  const unsaved = togglePostSave(saved);
  assert.equal(unsaved.isSaved, false);

  const hidden = hidePost(mockPost);
  assert.equal(hidden.isHidden, true);
  const restored = restorePost(hidden);
  assert.equal(restored.isHidden, false);
  // Ensure original timestamp and ID remain strictly unchanged
  assert.equal(restored.createdAt, mockPost.createdAt);
  assert.equal(restored.id, mockPost.id);
});

test("restored post returns to exact chronological order based on createdAt", () => {
  const postOld: CommunityPost = {
    ...mockPost,
    id: "post-old",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isHidden: false,
  };
  const postMiddle: CommunityPost = {
    ...mockPost,
    id: "post-middle",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    isHidden: true, // currently hidden
  };
  const postNew: CommunityPost = {
    ...mockPost,
    id: "post-new",
    createdAt: new Date(Date.now()).toISOString(),
    isHidden: false,
  };

  const allPosts = [postNew, postMiddle, postOld];

  // While hidden, only postNew and postOld appear in feed
  const activeFeedBefore = allPosts
    .filter((p) => !p.isHidden)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  assert.deepEqual(activeFeedBefore.map((p) => p.id), ["post-new", "post-old"]);

  // Unhide/restore middle post
  const unhiddenMiddle = restorePost(postMiddle);
  const updatedPosts = [postNew, unhiddenMiddle, postOld];

  const activeFeedAfter = updatedPosts
    .filter((p) => !p.isHidden)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Must be in middle position (new -> middle -> old), NOT jumped to top!
  assert.deepEqual(activeFeedAfter.map((p) => p.id), ["post-new", "post-middle", "post-old"]);
});

