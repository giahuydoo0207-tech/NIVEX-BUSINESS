export type PostReactionType =
  | "like"
  | "love"
  | "trust"
  | "build"
  | "insightful"
  | "deal"
  | "launch";

export type PublicProfileKind = "freelancer" | "business";

export interface PublicProfileOpening {
  title: string;
  type: string;
  description?: string;
  budget?: string;
}

export interface PublicProfileExperience {
  title: string;
  organization: string;
  period: string;
  summary: string;
}

export interface PublicProfileEducation {
  program: string;
  institution: string;
  period: string;
}

export interface PublicProfileData {
  kind: PublicProfileKind;
  displayName: string;
  handle: string;
  headline: string;
  location: string;
  bio: string;
  tags: string[];
  stats: Array<{ label: string; value: string }>;
  status?: string;
  isVerified?: boolean;
  avatarUrl?: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  openings?: PublicProfileOpening[];
  experiences?: PublicProfileExperience[];
  education?: PublicProfileEducation[];
}

export interface PostCommentReply {
  id: string;
  authorName: string;
  headline: string;
  content: string;
  timeLabel: string;
  createdAt?: string;
  replyingToName?: string;
  avatarUrl?: string;
  isMine?: boolean;
  likeCount: number;
  isLiked?: boolean;
}

export interface PostComment {
  id: string;
  authorName: string;
  headline: string;
  content: string;
  timeLabel: string;
  createdAt?: string;
  avatarUrl?: string;
  isMine?: boolean;
  likeCount: number;
  isLiked?: boolean;
  replies: PostCommentReply[];
}

export type PostPrivacy = "public" | "followers" | "only_me";

export interface CommunityPost {
  id: string;
  content: string;
  images: string[];
  timeLabel: string;
  createdAt: string; // ISO string
  isMine: boolean;
  isPinned?: boolean;
  isSaved?: boolean;
  isHidden?: boolean;
  privacy?: PostPrivacy;
  reactionCount: number;
  myReaction?: PostReactionType | null;
  reactionCounts?: Partial<Record<PostReactionType, number>>;
  comments: PostComment[];
  topics?: string[];
  author?: PublicProfileData;
  isFollowingAuthor?: boolean;
  repostCount?: number;
}
