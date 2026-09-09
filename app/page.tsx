import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
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
        <Image
          className="hero-art"
          src="/images/payment-network.webp"
          alt="Các khối doanh nghiệp và người nhận kết nối qua hạ tầng thanh toán NIVEX"
          fill
          priority
          sizes="(max-width: 800px) 1280px, 100vw"
        />
        <div className="hero-copy">
          <span className="hero-kicker">
            KẾT NỐI DOANH NGHIỆP VỚI NHÂN SỰ TOÀN CẦU
          </span>
          <h1>
            NIVEX
            <br />
            <span>BUSINESS</span>
          </h1>
          <p>
            Thanh toán USDC cho đội ngũ quốc tế.
            <br />
            Rõ ràng từ hóa đơn đến người nhận.
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
        <div className="hero-caption">
          <span>
            <Globe2 size={16} />
            Một kết nối. Cả đội ngũ.
          </span>
          <span>BUSINESS → USDC → NGƯỜI NHẬN</span>
        </div>
      </section>
      <div className="platform-strip">
        <span>Dành cho đội ngũ không biên giới</span>
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
      <section id="platform" className="landing-section product-section reveal">
        <div className="landing-section-heading">
          <p className="eyebrow">KHÔNG GIAN VẬN HÀNH CHUNG</p>
          <h2>
            Từng khoản thanh toán.
            <br />
            Một góc nhìn rõ ràng.
          </h2>
          <p>
            Người nhận, hóa đơn và trạng thái nằm trong cùng một quy trình. Đội
            ngũ tài chính luôn biết bước tiếp theo.
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
        </Link>
        <div className="product-facts">
          <div>
            <FileCheck2 />
            <h3>Đúng hóa đơn</h3>
            <p>
              Số tiền, nội dung công việc và hạn thanh toán được tập hợp tại một
              nơi.
            </p>
          </div>
          <div>
            <ShieldCheck />
            <h3>Đúng người nhận</h3>
            <p>
              Kiểm tra thông tin được chia sẻ và tình trạng sẵn sàng nhận VND.
            </p>
          </div>
          <div>
            <WalletCards />
            <h3>Rõ từng bước</h3>
            <p>
              Xem lại yêu cầu thanh toán trước khi chuyển sang bước kết nối ví.
            </p>
          </div>
        </div>
      </section>
      <section
        id="workflow"
        className="landing-section workflow-section reveal"
      >
        <div className="landing-section-heading">
          <h2>
            Từ công việc hoàn thành
            <br />
            đến yêu cầu thanh toán.
          </h2>
          <p>Ba bước để chuẩn bị một khoản chi trả cho đội ngũ.</p>
        </div>
        <div className="workflow-layout">
          <div className="workflow-rail">
            <article>
              <span>01</span>
              <div>
                <h3>Tạo không gian tổ chức</h3>
                <p>
                  Đăng ký doanh nghiệp và người đại diện. Tập hợp đội ngũ trong
                  cùng không gian làm việc.
                </p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Kiểm tra & tạo hóa đơn</h3>
                <p>
                  Chọn người nhận, nhập số USDC và nội dung công việc. Xem lại
                  trước khi tạo yêu cầu.
                </p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Theo dõi thanh toán</h3>
                <p>
                  Mở yêu cầu và kiểm tra chi tiết. Bản demo cho phép trải nghiệm
                  bước kết nối ví mô phỏng.
                </p>
              </div>
            </article>
          </div>
          <div
            className="payment-diagram"
            aria-label="Luồng định hướng: doanh nghiệp chuyển USDC đến người nhận. NIVEX hỗ trợ chuẩn bị và theo dõi thanh toán."
          >
            <h3>Thanh toán giữa hai bên.</h3>
            <div className="diagram-transfer">
              <div className="diagram-node">
                <span className="diagram-node-icon">
                  <Building2 size={26} aria-hidden="true" />
                </span>
                <div>
                  <strong>Doanh nghiệp</strong>
                  <small>Xem lại và xác nhận bằng ví</small>
                </div>
              </div>
              <div className="diagram-path">
                <ArrowDown size={48} strokeWidth={1.25} aria-hidden="true" />
                <span>
                  <strong>USDC</strong>
                  <small>Qua mạng Solana</small>
                </span>
              </div>
              <div className="diagram-node">
                <span className="diagram-node-icon">
                  <UsersRound size={26} aria-hidden="true" />
                </span>
                <div>
                  <strong>Người nhận</strong>
                  <small>Nhận USDC vào ví</small>
                </div>
              </div>
            </div>
            <div className="diagram-support">
              <h4>Công cụ của bạn: NIVEX Business</h4>
              <ul>
                <li>
                  <FileCheck2 size={18} aria-hidden="true" />
                  Chuẩn bị hóa đơn
                </li>
                <li>
                  <ShieldCheck size={18} aria-hidden="true" />
                  Kiểm tra thông tin người nhận
                </li>
                <li>
                  <WalletCards size={18} aria-hidden="true" />
                  Theo dõi trạng thái thanh toán
                </li>
              </ul>
            </div>
            <p>
              Luồng sản phẩm định hướng. Bản hiện tại mô phỏng thanh toán, chưa
              chuyển tiền thật.
            </p>
          </div>
        </div>
      </section>
      <section id="trust" className="landing-section trust-section reveal">
        <div className="landing-section-heading">
          <p className="eyebrow">MINH BẠCH TỪ THIẾT KẾ</p>
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
