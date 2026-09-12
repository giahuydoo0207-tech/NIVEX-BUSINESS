export type LandingLocale = "vi" | "en";

export const landingCopy = {
  vi: {
    meta: {
      title: "NIVEX Business | Quy trình chi trả USDC rõ ràng",
      description:
        "Tạo yêu cầu, đối chiếu người nhận và theo dõi trạng thái chi trả USDC trong bản thử nghiệm NIVEX Business trên Solana Devnet.",
    },
    navigation: {
      signal: "Dành cho đội ngũ trả công bằng USDC",
      environment: "Bản thử nghiệm trên Solana Devnet",
      homeLabel: "Trang chủ NIVEX Business",
      ariaLabel: "Điều hướng chính",
      product: "Sản phẩm",
      solana: "Solana",
      workflow: "Quy trình",
      faq: "FAQ",
      login: "Đăng nhập",
      register: "Đăng ký",
      languageLabel: "Chọn ngôn ngữ",
      openMenu: "Mở menu",
      closeMenu: "Đóng menu",
    },
    hero: {
      kicker: "NIVEX BUSINESS · SOLANA DEVNET",
      title: "Chi trả USDC",
      titleAccent: "Rõ từ đầu đến cuối",
      body: "Đặt công việc, người nhận và yêu cầu thanh toán trong cùng một luồng để đội ngũ biết điều gì đang chờ xử lý.",
      primary: "Tạo không gian",
      secondary: "Xem bản demo",
      trackLabel: "Bốn giai đoạn của quy trình",
      track: ["Công việc", "Đối chiếu", "Yêu cầu", "Xác nhận"],
    },
    audiences: {
      intro: "Cho những đội ngũ làm việc vượt múi giờ",
      items: ["Doanh nghiệp", "Agency & Studio", "Tổ chức Web3", "Đội ngũ từ xa"],
    },
    story: {
      title: "Một công việc kết thúc.\nMột khoản chi bắt đầu.",
      body: "NIVEX nối những quyết định thường nằm rời rạc, từ lúc xác nhận công việc đến khi hai phía nhìn thấy kết quả.",
      chapters: [
        {
          eyebrow: "TRƯỚC KHI TẠO YÊU CẦU",
          title: "Biết mình đang trả cho ai.",
          body: "Đặt hồ sơ được chia sẻ cạnh thông tin công việc để đối chiếu đúng người, đúng nội dung trước khi tiếp tục.",
          caption: "Người nhận quyết định thông tin nào được chia sẻ với doanh nghiệp.",
        },
        {
          eyebrow: "TRƯỚC KHI KÝ",
          title: "Xem lại khoản chi trong đúng ngữ cảnh.",
          body: "Số USDC, người nhận và nội dung công việc luôn đi cùng nhau để người duyệt không phải đoán mình đang xác nhận điều gì.",
          caption: "Khóa ví luôn nằm trong ví doanh nghiệp, không nằm trong NIVEX.",
        },
        {
          eyebrow: "SAU KHI GỬI",
          title: "Hai phía cùng nhìn thấy một trạng thái.",
          body: "Solana xử lý giao dịch; NIVEX đưa trạng thái trở lại quy trình để doanh nghiệp và người nhận cùng theo dõi.",
          caption: "Bản demo hiện dùng Solana Devnet và mô phỏng bước kết nối ví.",
        },
      ],
    },
    capabilities: {
      title: "Ít điểm mù hơn.\nTrước mỗi khoản chi.",
      body: "Ba câu hỏi cần rõ trước khi ký: đúng người, đúng số tiền và đúng người phê duyệt.",
    },
    solana: {
      eyebrow: "VAI TRÒ CỦA SOLANA",
      title: "Solana xác nhận giao dịch.\nNIVEX giải thích trạng thái.",
      body: "Ví doanh nghiệp tạo chữ ký. Solana ghi nhận giao dịch. NIVEX biến tín hiệu kỹ thuật thành bước tiếp theo dễ hiểu.",
    },
    workflow: {
      title: "Ba bước.\nMỗi bước một quyết định.",
      body: "Tạo yêu cầu, xem lại rồi theo dõi kết quả. Mỗi trạng thái trả lời một câu hỏi khác nhau.",
    },
    product: {
      title: "Biết điều gì\ncần bạn xử lý",
      body: "Khoản chờ duyệt, người liên quan và trạng thái mới nhất được đặt trong cùng một tầm nhìn.",
      previewLabel: "Mở bản demo NIVEX Business",
      imageAlt: "Tổng quan NIVEX Business với các khoản cần xử lý, người nhận và trạng thái thanh toán",
      focus: ["Cần xử lý", "Đúng người", "Đã cập nhật"],
      facts: [
        {
          title: "Không mất dấu ngữ cảnh",
          body: "Số tiền luôn đi cùng công việc, người nhận và thời điểm cần xử lý.",
        },
        {
          title: "Biết ai đang chờ ai",
          body: "Thông tin được chia sẻ giúp đội ngũ biết ai đã sẵn sàng và ai cần xem lại.",
        },
        {
          title: "Không đoán trạng thái",
          body: "Yêu cầu đã tạo, ví đã ký và giao dịch hoàn tất là ba mốc riêng.",
        },
      ],
    },
    trust: {
      title: "Tiền vẫn ở phía bạn.",
      body: "NIVEX trình bày thông tin cần thiết để phối hợp; quyền chia sẻ và quyền ký vẫn thuộc về hai phía.",
      items: [
        {
          title: "Chia sẻ có chủ đích",
          body: "Doanh nghiệp chỉ thấy thông tin cơ bản mà người nhận đồng ý chia sẻ.",
        },
        {
          title: "Khóa ví không rời khỏi ví",
          body: "NIVEX không yêu cầu seed phrase hay private key. Việc ký diễn ra trong ví doanh nghiệp.",
        },
        {
          title: "Số tiền rõ trước khi ký",
          body: "Số USDC và mã yêu cầu luôn hiện rõ để người duyệt xem lại trước khi xác nhận.",
        },
        {
          title: "Demo nói rõ là demo",
          body: "Dữ liệu mẫu, Devnet và những bước mô phỏng đều được ghi chú ngay trong trải nghiệm.",
        },
      ],
    },
    faq: {
      title: "Trước khi bạn bắt đầu.",
      body: "Năm điều cần biết về bản thử nghiệm.",
      items: [
        {
          question: "NIVEX Business dành cho ai?",
          answer: "Dành cho doanh nghiệp, agency và tổ chức muốn thử một quy trình quản lý người nhận, yêu cầu thanh toán USDC và đội ngũ từ xa.",
        },
        {
          question: "Người nhận có cần dùng NIVEX không?",
          answer: "Trong luồng sản phẩm, người nhận dùng ứng dụng NIVEX để xem công việc và chủ động chia sẻ thông tin cơ bản cần cho việc đối chiếu.",
        },
        {
          question: "Tôi có thể nhập số USDC bất kỳ không?",
          answer: "Có. Bản demo chấp nhận số lớn hơn 0 và giữ chính xác tối đa sáu chữ số thập phân.",
        },
        {
          question: "Bản demo có chuyển tiền thật không?",
          answer: "Chưa. Dữ liệu hiện là dữ liệu minh họa, còn kết nối ví và thanh toán trên Solana Devnet đang được mô phỏng.",
        },
        {
          question: "NIVEX có giữ khóa ví không?",
          answer: "Không. NIVEX không yêu cầu seed phrase hoặc private key. Hướng tích hợp là người dùng xác nhận giao dịch trong ví của mình.",
        },
      ],
    },
    cta: {
      title: "Thử quy trình.\nTrước khi chuyển tiền thật.",
      body: "Tạo không gian tổ chức và khám phá NIVEX Business bằng dữ liệu demo trên Solana Devnet.",
      action: "Tạo tài khoản tổ chức",
    },
    footer: {
      tagline: "Công việc rõ. Khoản chi rõ.",
      faq: "Câu hỏi thường gặp",
      login: "Đăng nhập",
      note: "© 2026 NIVEX · Bản thử nghiệm trên Solana Devnet",
      ariaLabel: "Liên kết cuối trang",
    },
  },
  en: {
    meta: {
      title: "NIVEX Business | Clearer USDC payment workflows",
      description:
        "Create requests, verify recipients, and follow USDC payment status in the NIVEX Business prototype on Solana Devnet.",
    },
    navigation: {
      signal: "Built for teams paying in USDC",
      environment: "Prototype on Solana Devnet",
      homeLabel: "NIVEX Business home",
      ariaLabel: "Main navigation",
      product: "Product",
      solana: "Solana",
      workflow: "Workflow",
      faq: "FAQ",
      login: "Log in",
      register: "Sign up",
      languageLabel: "Choose language",
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
    hero: {
      kicker: "NIVEX BUSINESS · SOLANA DEVNET",
      title: "Pay in USDC",
      titleAccent: "Know every step",
      body: "Keep the work, recipient, and payment request in one flow, so your team always knows what needs attention.",
      primary: "Create a workspace",
      secondary: "View the demo",
      trackLabel: "Four stages of the workflow",
      track: ["Work", "Review", "Request", "Confirmation"],
    },
    audiences: {
      intro: "For teams working across time zones",
      items: ["Companies", "Agencies & studios", "Web3 organizations", "Remote teams"],
    },
    story: {
      title: "When the work ends.\nThe payment starts.",
      body: "NIVEX connects decisions that usually live in separate places, from confirming the work to giving both sides a shared outcome.",
      chapters: [
        {
          eyebrow: "BEFORE THE REQUEST",
          title: "Know who you are paying.",
          body: "Place shared recipient details beside the work, so your team can review the right person and context before moving forward.",
          caption: "Recipients decide which details they share with the company.",
        },
        {
          eyebrow: "BEFORE SIGNING",
          title: "Review the payment in context.",
          body: "The USDC amount, recipient, and work stay together, so approvers never have to guess what they are confirming.",
          caption: "Wallet keys stay inside the company wallet, never inside NIVEX.",
        },
        {
          eyebrow: "AFTER SENDING",
          title: "Give both sides the same status.",
          body: "Solana processes the transaction while NIVEX brings its status back into the workflow for both sides to follow.",
          caption: "The current demo uses Solana Devnet and simulates wallet connection.",
        },
      ],
    },
    capabilities: {
      title: "Fewer blind spots.\nBefore every payment.",
      body: "Three questions should be clear before signing: the right person, the right amount, and the right approver.",
    },
    solana: {
      eyebrow: "SOLANA'S ROLE",
      title: "Solana confirms the transaction.\nNIVEX explains the status.",
      body: "The company wallet creates the signature. Solana records the transaction. NIVEX turns technical signals into a clear next step.",
    },
    workflow: {
      title: "Three steps.\nOne decision at a time.",
      body: "Create the request, review it, then follow the outcome. Each status answers a different question.",
    },
    product: {
      title: "Know what\nneeds your attention",
      body: "Pending approvals, the people involved, and the latest status stay visible in one view.",
      previewLabel: "Open the NIVEX Business demo",
      imageAlt: "NIVEX Business overview showing items that need attention, recipients, and payment status",
      focus: ["Needs review", "Right recipient", "Status updated"],
      facts: [
        {
          title: "Keep the context attached",
          body: "Every amount stays connected to the work, recipient, and moment that needs attention.",
        },
        {
          title: "Know who is waiting on whom",
          body: "Shared details help the team see who is ready and who still needs a review.",
        },
        {
          title: "Never guess the status",
          body: "Request created, wallet signed, and transaction complete remain three distinct milestones.",
        },
      ],
    },
    trust: {
      title: "Your funds stay with you.",
      body: "NIVEX presents the information needed to coordinate; sharing and signing remain under each party's control.",
      items: [
        {
          title: "Intentional sharing",
          body: "Companies only see the basic details a recipient has chosen to share.",
        },
        {
          title: "Keys stay in the wallet",
          body: "NIVEX never asks for a seed phrase or private key. Signing takes place in the company wallet.",
        },
        {
          title: "See the amount before signing",
          body: "The USDC amount and request ID stay visible for one final review before approval.",
        },
        {
          title: "A demo that says it is a demo",
          body: "Sample data, Devnet, and simulated steps are identified throughout the experience.",
        },
      ],
    },
    faq: {
      title: "Before you get started.",
      body: "Five things to know about the prototype.",
      items: [
        {
          question: "Who is NIVEX Business for?",
          answer: "Companies, agencies, and organizations that want to explore a workflow for remote recipients and USDC payment requests.",
        },
        {
          question: "Does the recipient need NIVEX?",
          answer: "In the product flow, recipients use the NIVEX app to view work and choose which basic details to share for review.",
        },
        {
          question: "Can I enter any USDC amount?",
          answer: "Yes. The demo accepts amounts above zero and preserves up to six decimal places.",
        },
        {
          question: "Does the demo move real funds?",
          answer: "Not yet. The current data is illustrative, while wallet connection and payment on Solana Devnet are simulated.",
        },
        {
          question: "Does NIVEX hold wallet keys?",
          answer: "No. NIVEX never asks for a seed phrase or private key. The intended integration has users approve transactions inside their own wallet.",
        },
      ],
    },
    cta: {
      title: "Try the workflow.\nBefore moving real funds.",
      body: "Create an organization workspace and explore NIVEX Business with demo data on Solana Devnet.",
      action: "Create an organization",
    },
    footer: {
      tagline: "Clear work. Clear payments.",
      faq: "Frequently asked questions",
      login: "Log in",
      note: "© 2026 NIVEX · Prototype on Solana Devnet",
      ariaLabel: "Footer links",
    },
  },
} as const;

export type LandingCopy = (typeof landingCopy)[LandingLocale];
