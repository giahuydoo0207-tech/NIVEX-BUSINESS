import {
  CommunityPost,
  PostReactionType,
  PublicProfileData,
} from "@/types/community";
import {
  ThumbsUp,
  Heart,
  ShieldCheck,
  Wrench,
  Lightbulb,
  Handshake,
  Rocket,
} from "lucide-react";

export interface ReactionConfig {
  key: PostReactionType;
  label: string;
  color: string;
  icon: typeof ThumbsUp;
}

export const POST_REACTIONS: Record<PostReactionType, ReactionConfig> = {
  like: {
    key: "like",
    label: "Thích",
    color: "#38BDF8",
    icon: ThumbsUp,
  },
  love: {
    key: "love",
    label: "Yêu thích",
    color: "#F43F5E",
    icon: Heart,
  },
  trust: {
    key: "trust",
    label: "Tin cậy",
    color: "#22C55E",
    icon: ShieldCheck,
  },
  build: {
    key: "build",
    label: "Đang xây",
    color: "#F59E0B",
    icon: Wrench,
  },
  insightful: {
    key: "insightful",
    label: "Hay",
    color: "#06B6D4",
    icon: Lightbulb,
  },
  deal: {
    key: "deal",
    label: "Hợp tác",
    color: "#A855F7",
    icon: Handshake,
  },
  launch: {
    key: "launch",
    label: "Bứt phá",
    color: "#EC4899",
    icon: Rocket,
  },
};

export const REACTION_LIST: ReactionConfig[] = [
  POST_REACTIONS.like,
  POST_REACTIONS.love,
  POST_REACTIONS.trust,
  POST_REACTIONS.build,
  POST_REACTIONS.insightful,
  POST_REACTIONS.deal,
  POST_REACTIONS.launch,
];

export const CURRENT_BUSINESS_PROFILE: PublicProfileData = {
  kind: "business",
  displayName: "Nova Labs",
  handle: "nova.labs",
  headline: "Fintech · Web3 · Remote-first",
  location: "Đà Nẵng, Việt Nam",
  bio: "Đội ngũ xây dựng sản phẩm tài chính số minh bạch cho freelancer và doanh nghiệp.",
  tags: ["Fintech", "Solana", "Remote-first"],
  stats: [
    { label: "Cơ hội đang mở", value: "3" },
    { label: "Đã kết nối", value: "126" },
  ],
  status: "Đang tuyển",
  isVerified: true,
  followerCount: 312,
  followingCount: 45,
  postCount: 18,
  openings: [
    {
      title: "Flutter Developer",
      type: "Remote · Full-time",
      description: "Xây dựng tính năng Wallet và Payment cho ứng dụng Nova Mobile.",
    },
    {
      title: "Solana Rust Developer",
      type: "Remote · Contract",
      description: "Phát triển smart contract cho hệ sinh thái DeFi của Nova.",
    },
  ],
};

export const EXAMPLE_PROFILES: PublicProfileData[] = [
  CURRENT_BUSINESS_PROFILE,
  {
    kind: "freelancer",
    displayName: "Trần Bảo Long",
    handle: "baolong.pm",
    headline: "Senior Product Manager @ Fintech VN",
    location: "Hà Nội, Việt Nam",
    bio: "Product Manager với 5 năm kinh nghiệm trong lĩnh vực Fintech. Đam mê xây dựng sản phẩm rõ ràng và có tác động thực sự.",
    tags: ["Product Management", "Agile", "Fintech", "OKRs", "User Research"],
    stats: [
      { label: "Dự án đã dẫn dắt", value: "14" },
      { label: "Tỷ lệ on-time", value: "91%" },
    ],
    status: "Đang mở cơ hội",
    isVerified: true,
    followerCount: 183,
    followingCount: 67,
    postCount: 29,
    experiences: [
      {
        title: "Senior Product Manager",
        organization: "Fintech VN",
        period: "2022 - nay",
        summary: "Quản lý roadmap sản phẩm payment và lending. Dẫn dắt nhóm 8 người cross-functional.",
      },
      {
        title: "Product Manager",
        organization: "VNG Corporation",
        period: "2019 - 2022",
        summary: "Xây dựng tính năng ZaloPay B2B từ 0 đến 50K merchants.",
      },
    ],
    education: [
      {
        program: "Quản trị Kinh doanh",
        institution: "Đại học Ngoại thương Hà Nội",
        period: "2015 - 2019",
      },
    ],
  },
  {
    kind: "freelancer",
    displayName: "Lê Thảo My",
    handle: "thaomy.design",
    headline: "Senior UI/UX Designer & Design System Lead",
    location: "TP. Hồ Chí Minh, Việt Nam",
    bio: "Thiết kế sản phẩm trải nghiệm tài chính, Web3 và mobile app với hơn 6 năm kinh nghiệm.",
    tags: ["UI/UX", "Figma", "Design System", "Mobile Design", "Fintech"],
    stats: [
      { label: "Sản phẩm đã ship", value: "22" },
      { label: "Đánh giá 5 sao", value: "98%" },
    ],
    status: "Sẵn sàng nhận dự án",
    isVerified: true,
    followerCount: 420,
    followingCount: 110,
    postCount: 45,
  },
  {
    kind: "freelancer",
    displayName: "Phạm Hoàng Nam",
    handle: "nam.solana",
    headline: "Web3 Developer · Solana ecosystem",
    location: "Đà Nẵng, Việt Nam",
    bio: "Kỹ sư Rust & Solana chuyên phát triển smart contract, bridge và escrow cho thị trường freelance phi tập trung.",
    tags: ["Rust", "Solana", "Anchor", "Smart Contract", "DeFi"],
    stats: [
      { label: "Hợp đồng audit", value: "8" },
      { label: "TVL bảo vệ", value: "$12M" },
    ],
    status: "Đang nhận dự án",
    isVerified: true,
    followerCount: 275,
    followingCount: 54,
    postCount: 16,
  },
];

export const INITIAL_DEMO_POSTS: CommunityPost[] = [
  {
    id: "post-mine-001",
    content:
      "Mình vừa hoàn thiện một flow thanh toán mới cho ứng dụng mobile. Rất vui được kết nối với các dự án fintech phù hợp.",
    images: [],
    timeLabel: "Hôm nay, 09:24",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isMine: true,
    reactionCount: 12,
    myReaction: null,
    reactionCounts: {
      like: 8,
      love: 4,
    },
    comments: [
      {
        id: "c-mine-1",
        authorName: "Trần Bảo Long",
        headline: "Senior Product Manager @ Fintech VN",
        content:
          "Flow thanh toán rất mượt, đặc biệt là phần xác thực hai lớp. Rất ấn tượng!",
        timeLabel: "1 giờ trước",
        likeCount: 4,
        isLiked: false,
        replies: [],
      },
      {
        id: "c-mine-2",
        authorName: "Lê Thảo My",
        headline: "UI/UX Designer",
        content:
          "Màu sắc và spacing trong flow nhìn rất gọn gàng và dễ theo dõi.",
        timeLabel: "45 phút trước",
        likeCount: 2,
        isLiked: false,
        replies: [],
      },
    ],
    topics: ["Fintech", "Mobile"],
  },
  {
    id: "post-nova-002",
    content:
      "Nova Labs đang tìm thêm freelancer cho các dự án fintech và sản phẩm Web3. Xem hồ sơ để tìm hiểu cơ hội hợp tác.",
    images: [],
    timeLabel: "Hôm qua, 18:40",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isMine: false,
    reactionCount: 83,
    myReaction: null,
    reactionCounts: {
      trust: 45,
      insightful: 25,
      like: 13,
    },
    author: CURRENT_BUSINESS_PROFILE,
    isFollowingAuthor: false,
    comments: [
      {
        id: "c-nivex-1",
        authorName: "Phạm Hoàng Nam",
        headline: "Web3 Developer · Solana ecosystem",
        content: "Dự án đang tìm vị trí smart contract hay mobile vậy admin?",
        timeLabel: "2 giờ trước",
        likeCount: 5,
        isLiked: false,
        replies: [
          {
            id: "r-nivex-1",
            authorName: "Nova Labs",
            headline: "Fintech · Web3 · Remote-first",
            content:
              "Chào bạn, bên mình đang ưu tiên cả Flutter Dev và Solana Rust Dev nhé!",
            timeLabel: "1 giờ trước",
            replyingToName: "Phạm Hoàng Nam",
            likeCount: 8,
            isLiked: false,
            isMine: true,
          },
        ],
      },
    ],
    topics: ["CơHội", "Web3", "TuyểnDụng"],
  },
  {
    id: "post-baolong-003",
    content:
      "Sau 6 tháng dẫn dắt team product, mình nhận ra rằng clarity beats cleverness. Spec rõ ràng giúp cả team tiết kiệm hàng tuần làm lại.",
    images: [],
    timeLabel: "3 ngày trước",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isMine: false,
    reactionCount: 41,
    myReaction: null,
    reactionCounts: {
      insightful: 26,
      like: 15,
    },
    author: EXAMPLE_PROFILES[1],
    isFollowingAuthor: true,
    comments: [
      {
        id: "c-baolong-1",
        authorName: "Lê Thảo My",
        headline: "UI/UX Designer",
        content:
          "Đồng ý! Spec mơ hồ là nguyên nhân 90% lần mình phải thiết kế lại.",
        timeLabel: "2 ngày trước",
        likeCount: 7,
        isLiked: false,
        replies: [],
      },
    ],
    topics: ["ProductManagement", "Agile"],
  },
  {
    id: "post-gallery-004",
    content:
      "Demo hệ thống Design System mới cho Nova Platform: Bảng màu dark mode tinh chỉnh, typography đồng bộ và bộ components tương thích cả Web và Flutter.",
    images: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
    ],
    timeLabel: "4 ngày trước",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    isMine: false,
    reactionCount: 56,
    myReaction: null,
    reactionCounts: {
      love: 32,
      build: 24,
    },
    author: EXAMPLE_PROFILES[2],
    isFollowingAuthor: false,
    comments: [],
    topics: ["UIUX", "DesignSystem"],
  },
];
