import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  FileCheck2,
  Globe2,
  Layers3,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { NivexLogo } from "@/components/ui/NivexLogo";
import {
  LandingMotion,
  LandingNavigation,
} from "@/components/marketing/LandingMotion";
import {
  CoreCapabilityGrid,
  HeroSystemScene,
  PaymentLifecycle,
  RecipientVerificationScene,
  SettlementScene,
  SolanaCoreGrid,
  WalletApprovalScene,
} from "@/components/marketing/TechScenes";

const questions = [
  [
    "NIVEX Business dành cho ai?",
    "Doanh nghiệp, agency và tổ chức có nhân sự làm việc từ xa. NIVEX tập trung vào quản lý người nhận, hóa đơn USDC và theo dõi quy trình thanh toán về Việt Nam.",
  ],
  [
    "Người nhận có cần tài khoản NIVEX không?",
    "Người nhận dùng ứng dụng NIVEX để chia sẻ thông tin cơ bản và chuẩn bị tài khoản nhận VND. Doanh nghiệp chỉ xem những thông tin người nhận đồng ý chia sẻ.",
  ],
  [
    "Tôi có thể nhập số tiền bất kỳ không?",
    "Có. Hóa đơn nhận số USDC lớn hơn 0, tối đa 6 chữ số thập phân. Bạn kiểm tra số tiền và thông tin người nhận trước khi tiếp tục.",
  ],
  [
    "Bản trải nghiệm có chuyển tiền thật không?",
    "Chưa. Bản hiện tại dùng dữ liệu minh họa và môi trường Solana Devnet. Kết nối ví và thanh toán trên web đang ở chế độ mô phỏng; không có tiền thật được chuyển.",
  ],
  [
    "NIVEX có giữ khóa ví của doanh nghiệp không?",
    "NIVEX không yêu cầu seed phrase hay private key. Hướng tích hợp ví là doanh nghiệp xác nhận trong ví của mình; chức năng ký giao dịch thật chưa có trong bản trải nghiệm này.",
  ],
];

export default function LandingPage() {
  return (
    <main className="landing">
      <LandingNavigation />
      <section className="landing-hero">
        <HeroSystemScene />
        <div className="hero-copy">
          <span className="hero-kicker">NIVEX BUSINESS · SOLANA DEVNET</span>
          <h1>
            Chi trả USDC
            <br />
            <span>Rõ từng bước</span>
          </h1>
          <p>
            Tạo hóa đơn, kiểm tra người nhận và theo dõi thanh toán trong một
            không gian dành cho doanh nghiệp.
          </p>
          <div className="hero-actions">
            <Link href="/business/register" className="business-primary-button">
              Bắt đầu với NIVEX
              <ArrowUpRight size={18} />
            </Link>
            <Link href="/business/dashboard" className="hero-demo">
              Khám phá bản demo
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="hero-story-track" aria-label="Bốn chương của quy trình">
          <span className="active">Công việc</span>
          <span>Kiểm tra</span>
          <span>Hóa đơn</span>
          <span>Thanh toán</span>
        </div>
      </section>
      <div className="platform-strip">
        <span>Một quy trình cho đội ngũ không biên giới</span>
        <strong>
          <Building2 size={19} />
          Doanh nghiệp
        </strong>
        <strong>
          <Layers3 size={19} />
          Agency & Studio
        </strong>
        <strong>
          <Globe2 size={19} />
          Tổ chức Web3
        </strong>
        <strong>
          <UsersRound size={19} />
          Đội ngũ từ xa
        </strong>
      </div>
      <section id="platform" className="landing-section story-section">
        <div className="landing-section-heading reveal">
          <h2>
            Công việc hoàn thành.
            <br />
            Đúng người được trả.
          </h2>
          <p>
            Mỗi chương làm rõ một quyết định, từ thông tin công việc đến lúc
            người nhận thấy khoản thanh toán.
          </p>
        </div>
        <div className="story-sequence">
          <article id="recipient-check" className="story-chapter reveal">
            <header>
              <span>KIỂM TRA NGƯỜI NHẬN</span>
              <h3>Đúng người trước khi đúng số tiền.</h3>
              <p>
                Hóa đơn và thông tin người nhận được đặt cạnh nhau để doanh
                nghiệp đối chiếu trước khi tiếp tục.
              </p>
            </header>
            <figure className="story-visual">
              <RecipientVerificationScene />
              <figcaption>
                NIVEX chỉ trình bày dữ liệu cần kiểm tra, không đứng giữa dòng
                tiền.
              </figcaption>
            </figure>
          </article>
          <article id="wallet-approval" className="story-chapter reveal">
            <header>
              <span>XÁC NHẬN HÓA ĐƠN</span>
              <h3>Mỗi khoản chi được xem lại trước khi ký.</h3>
              <p>
                Nhập số USDC bất kỳ, kiểm tra nội dung và để ví doanh nghiệp là
                nơi xác nhận cuối cùng.
              </p>
            </header>
            <figure className="story-visual">
              <WalletApprovalScene />
              <figcaption>
                Không nhập seed phrase hay private key vào NIVEX Business.
              </figcaption>
            </figure>
          </article>
          <article id="solana-settlement" className="story-chapter reveal">
            <header>
              <span>THANH TOÁN TRỰC TIẾP</span>
              <h3>Tiền đi thẳng. Trạng thái quay về.</h3>
              <p>
                USDC đi từ ví doanh nghiệp đến ví người nhận qua Solana; NIVEX
                ghi nhận trạng thái để hai bên cùng theo dõi.
              </p>
            </header>
            <figure className="story-visual">
              <SettlementScene />
              <figcaption>
                Bản hiện tại dùng Solana Devnet và mô phỏng bước kết nối ví.
              </figcaption>
            </figure>
          </article>
        </div>
      </section>
      <section id="core" className="landing-section capability-section">
        <div className="landing-section-heading reveal">
          <h2>
            Lõi vận hành được thiết kế
            <br />
            quanh một quyết định đúng.
          </h2>
          <p>
            Trước khi chạm đến blockchain, NIVEX làm rõ người nhận, số tiền và
            quyền phê duyệt của doanh nghiệp.
          </p>
        </div>
        <CoreCapabilityGrid />
      </section>
      <section id="solana" className="landing-section solana-core-section">
        <div className="landing-section-heading reveal">
          <p className="eyebrow">SOLANA DEVNET</p>
          <h2>
            Solana là lớp xác nhận.
            <br />
            Không phải người quản lý tiền.
          </h2>
          <p>
            Ví doanh nghiệp tạo chữ ký. Solana thực thi giao dịch. NIVEX đọc
            trạng thái để biến dữ liệu on-chain thành quy trình dễ theo dõi.
          </p>
        </div>
        <SolanaCoreGrid />
      </section>
      <section id="workflow" className="landing-section lifecycle-section">
        <div className="landing-section-heading reveal">
          <h2>
            Từ yêu cầu đến xác nhận
            <br />
            trong ba bước.
          </h2>
          <p>
            Mỗi bước tạo ra một trạng thái riêng, vì “đã tạo”, “đã ký” và “đã
            hoàn tất” không phải cùng một việc.
          </p>
        </div>
        <PaymentLifecycle />
      </section>
      <section id="product" className="landing-section product-section reveal">
        <div className="landing-section-heading">
          <h2>
            Toàn bộ câu chuyện.
            <br />
            Quay về một nơi.
          </h2>
          <p>
            Dashboard tập hợp hóa đơn, người nhận và trạng thái để đội ngũ tài
            chính biết chính xác bước tiếp theo.
          </p>
        </div>
        <Link
          className="product-preview"
          href="/business/dashboard"
          aria-label="Mở bản demo dashboard NIVEX Business"
        >
          <Image
            src="/images/dashboard-preview.webp"
            alt="Dashboard NIVEX Business với biểu đồ hoạt động, bộ lọc và danh sách hóa đơn"
            width={1440}
            height={1418}
            sizes="(max-width: 768px) 100vw, 1100px"
          />
          <span
            className="product-focus product-focus-invoices"
            aria-hidden="true"
          >
            <small>01</small>
            Hóa đơn
          </span>
          <span
            className="product-focus product-focus-recipients"
            aria-hidden="true"
          >
            <small>02</small>
            Người nhận
          </span>
          <span
            className="product-focus product-focus-status"
            aria-hidden="true"
          >
            <small>03</small>
            Trạng thái
          </span>
        </Link>
        <div className="product-facts">
          <div>
            <FileCheck2 />
            <h3>Hóa đơn có ngữ cảnh</h3>
            <p>Số tiền, công việc và hạn thanh toán luôn đi cùng nhau.</p>
          </div>
          <div>
            <ShieldCheck />
            <h3>Người nhận đã đối chiếu</h3>
            <p>
              Chỉ những thông tin được chia sẻ mới xuất hiện với doanh nghiệp.
            </p>
          </div>
          <div>
            <WalletCards />
            <h3>Trạng thái tách bạch</h3>
            <p>Tạo yêu cầu, xác nhận và hoàn tất là ba mốc riêng biệt.</p>
          </div>
        </div>
      </section>
      <section id="trust" className="landing-section trust-section reveal">
        <div className="landing-section-heading">
          <h2>
            Quyền kiểm soát
            <br />ở phía bạn.
          </h2>
          <p>Mỗi bên thấy đúng thông tin mình cần để phối hợp thanh toán.</p>
        </div>
        <div className="trust-grid">
          <article>
            <ShieldCheck size={28} />
            <h3>Thông tin có chọn lọc</h3>
            <p>
              Doanh nghiệp xem thông tin cơ bản được chia sẻ. Giấy tờ và tài
              khoản ngân hàng không xuất hiện trên trang thanh toán.
            </p>
          </article>
          <article>
            <WalletCards size={28} />
            <h3>Không chia sẻ khóa ví</h3>
            <p>
              Không nhập seed phrase hoặc private key vào NIVEX. Ví doanh nghiệp
              sẽ là nơi ký khi tích hợp thanh toán thật.
            </p>
          </article>
          <article>
            <FileCheck2 size={28} />
            <h3>Số tiền có thể kiểm tra</h3>
            <p>
              Số USDC và mã hóa đơn luôn hiện rõ. Đã tạo yêu cầu và đã chuyển
              tiền là hai trạng thái riêng.
            </p>
          </article>
          <article>
            <Layers3 size={28} />
            <h3>Thử nghiệm rõ ràng</h3>
            <p>
              Dữ liệu mẫu và các bước mô phỏng được ghi nhận trên giao diện để
              bạn khám phá quy trình.
            </p>
          </article>
        </div>
      </section>
      <section id="faq" className="landing-section faq-section reveal">
        <div className="landing-section-heading">
          <h2>
            Bạn muốn
            <br />
            biết thêm?
          </h2>
          <p>Những câu hỏi trước khi bắt đầu.</p>
        </div>
        <div className="faq-list">
          {questions.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <span className="faq-plus">+</span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="landing-cta reveal">
        <Check size={28} />
        <h2>
          Sẵn sàng cho
          <br />
          đội ngũ của bạn.
        </h2>
        <p>Bắt đầu bằng một không gian doanh nghiệp.</p>
        <Link href="/business/register" className="business-primary-button">
          Tạo tài khoản tổ chức
          <ArrowUpRight size={18} />
        </Link>
      </section>
      <footer className="landing-footer">
        <Link href="/" className="brand-lockup">
          <NivexLogo size={32} variant="plain" />
          <span>Business</span>
        </Link>
        <span>Thanh toán kết nối công việc.</span>
        <nav aria-label="Liên kết cuối trang">
          <a href="#faq">Câu hỏi thường gặp</a>
          <Link href="/business/login">Đăng nhập</Link>
        </nav>
        <small>© 2026 NIVEX · Bản trải nghiệm Solana Devnet</small>
      </footer>
      <LandingMotion />
    </main>
  );
}
