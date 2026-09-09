import type { CSSProperties, ReactNode } from "react";
import {
  Activity,
  BriefcaseBusiness,
  Check,
  CircleCheck,
  Database,
  FileText,
  Fingerprint,
  Gauge,
  KeyRound,
  Link2,
  LockKeyhole,
  Network,
  RadioTower,
  ReceiptText,
  Route,
  ShieldCheck,
  UserCheck,
  WalletCards,
} from "lucide-react";

const withDelay = (delay: string) =>
  ({ "--scene-delay": delay }) as CSSProperties;

function SceneNode({
  className = "",
  icon,
  label,
  meta,
  delay,
}: {
  className?: string;
  icon: ReactNode;
  label: string;
  meta: string;
  delay: string;
}) {
  return (
    <div
      className={`scene-node scene-piece ${className}`}
      style={withDelay(delay)}
    >
      <span className="scene-node-icon">{icon}</span>
      <span>
        <strong>{label}</strong>
        <small>{meta}</small>
      </span>
    </div>
  );
}

function SceneConnector({
  className = "",
  delay,
}: {
  className?: string;
  delay: string;
}) {
  return (
    <span
      className={`scene-connector scene-piece ${className}`}
      style={withDelay(delay)}
      aria-hidden="true"
    >
      <i />
    </span>
  );
}

export function HeroSystemScene() {
  return (
    <div className="hero-system-scene" aria-hidden="true">
      <div className="scene-grid" />
      <div className="hero-flow">
        <SceneNode
          className="hero-node-work"
          icon={<BriefcaseBusiness size={25} />}
          label="Công việc"
          meta="Đã hoàn thành"
          delay="0.12s"
        />
        <SceneConnector className="hero-line-one" delay="0.35s" />
        <SceneNode
          className="hero-node-recipient"
          icon={<UserCheck size={25} />}
          label="Người nhận"
          meta="Đã đối chiếu"
          delay="0.52s"
        />
        <SceneConnector className="hero-line-two" delay="0.72s" />
        <SceneNode
          className="hero-node-invoice"
          icon={<ReceiptText size={25} />}
          label="Hóa đơn"
          meta="125.75 USDC"
          delay="0.86s"
        />
        <SceneConnector className="hero-line-three" delay="1.05s" />
        <SceneNode
          className="hero-node-chain"
          icon={<Network size={25} />}
          label="Solana"
          meta="Devnet · confirmed"
          delay="1.2s"
        />
      </div>
    </div>
  );
}

export function RecipientVerificationScene() {
  return (
    <div className="tech-scene verification-scene" aria-hidden="true">
      <div className="scene-grid" />
      <div className="document-node scene-piece" style={withDelay("0.08s")}>
        <div className="document-title">
          <FileText size={22} />
          <span>
            <strong>INV-2048</strong>
            <small>Thiết kế sản phẩm</small>
          </span>
        </div>
        <div className="data-row wide" />
        <div className="data-row medium" />
        <div className="data-table">
          <i />
          <i />
          <i />
        </div>
      </div>
      <SceneConnector className="verification-line-left" delay="0.28s" />
      <div className="verification-gate scene-piece" style={withDelay("0.48s")}>
        <Fingerprint size={32} />
        <span className="gate-ring" />
        <Check size={18} />
      </div>
      <SceneConnector className="verification-line-right" delay="0.68s" />
      <div className="recipient-node scene-piece" style={withDelay("0.88s")}>
        <UserCheck size={28} />
        <span>
          <strong>Nguyễn Minh Anh</strong>
          <small>Thông tin đã cho phép chia sẻ</small>
        </span>
        <ul>
          <li>
            <Check size={13} /> Họ tên
          </li>
          <li>
            <Check size={13} /> Ví nhận
          </li>
          <li>
            <Check size={13} /> Mã nhân sự
          </li>
        </ul>
      </div>
    </div>
  );
}

export function WalletApprovalScene() {
  return (
    <div className="tech-scene approval-scene" aria-hidden="true">
      <div className="scene-grid" />
      <div className="approval-amount scene-piece" style={withDelay("0.08s")}>
        <small>SỐ TIỀN</small>
        <strong>125.75</strong>
        <span>USDC</span>
      </div>
      <SceneConnector className="approval-line-left" delay="0.28s" />
      <div
        className="wallet-approval-node scene-piece"
        style={withDelay("0.48s")}
      >
        <WalletCards size={30} />
        <span>
          <strong>Ví doanh nghiệp</strong>
          <small>Ký bên ngoài NIVEX</small>
        </span>
        <div className="wallet-account">
          <span className="wallet-account-mark">
            <Network size={20} />
          </span>
          <span className="wallet-account-copy">
            <small>VÍ ĐÃ KẾT NỐI</small>
            <strong>8rF2...Qm91</strong>
            <em>Solana Devnet</em>
          </span>
        </div>
        <span className="approval-stamp">
          <KeyRound size={14} /> CHỜ XÁC NHẬN
        </span>
      </div>
      <SceneConnector className="approval-line-right" delay="0.72s" />
      <div className="signed-node scene-piece" style={withDelay("0.92s")}>
        <CircleCheck size={34} />
        <strong>Đã ký</strong>
        <small>Chữ ký thuộc ví doanh nghiệp</small>
      </div>
    </div>
  );
}

export function SettlementScene() {
  return (
    <div className="tech-scene settlement-scene" aria-hidden="true">
      <div className="scene-grid" />
      <SceneNode
        className="settlement-sender"
        icon={<WalletCards size={25} />}
        label="Ví doanh nghiệp"
        meta="125.75 USDC"
        delay="0.08s"
      />
      <SceneConnector className="settlement-line-left" delay="0.3s" />
      <div className="solana-node-map scene-piece" style={withDelay("0.5s")}>
        <Network size={30} />
        <span className="network-orbit orbit-one" />
        <span className="network-orbit orbit-two" />
        <i className="network-dot dot-one" />
        <i className="network-dot dot-two" />
        <i className="network-dot dot-three" />
        <strong>SOLANA DEVNET</strong>
      </div>
      <SceneConnector className="settlement-line-right" delay="0.75s" />
      <SceneNode
        className="settlement-recipient"
        icon={<UserCheck size={25} />}
        label="Ví người nhận"
        meta="Đã nhận USDC"
        delay="0.96s"
      />
      <div className="finality-rail scene-piece" style={withDelay("1.12s")}>
        <span>processed</span>
        <span>confirmed</span>
        <span>finalized</span>
      </div>
    </div>
  );
}

export function CoreCapabilityGrid() {
  return (
    <div className="core-capability-grid">
      <article className="core-capability reveal">
        <div
          className="capability-visual capability-identity"
          aria-hidden="true"
        >
          <UserCheck className="capability-main-icon scene-piece" />
          <span className="identity-ring ring-a" />
          <span className="identity-ring ring-b" />
          <i className="identity-check check-a">
            <Check />
          </i>
          <i className="identity-check check-b">
            <Check />
          </i>
          <i className="identity-check check-c">
            <Check />
          </i>
        </div>
        <h3>Người nhận có ngữ cảnh</h3>
        <p>
          Đối chiếu hồ sơ được chia sẻ, mã nhân sự và ví nhận trước khi lập hóa
          đơn.
        </p>
      </article>
      <article className="core-capability reveal">
        <div className="capability-visual capability-money" aria-hidden="true">
          <span className="money-value scene-piece">125.75</span>
          <span className="money-unit scene-piece">USDC</span>
          <div className="money-bars">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <h3>Số tiền không bị biến dạng</h3>
        <p>
          USDC được biểu diễn theo minor unit, giữ chính xác tối đa sáu chữ số
          thập phân.
        </p>
      </article>
      <article className="core-capability reveal">
        <div
          className="capability-visual capability-control"
          aria-hidden="true"
        >
          <WalletCards className="control-wallet scene-piece" />
          <SceneConnector className="control-line" delay="0.22s" />
          <ShieldCheck className="control-shield scene-piece" />
          <span className="control-label scene-piece">KÝ TRONG VÍ</span>
        </div>
        <h3>Quyền ký vẫn ở doanh nghiệp</h3>
        <p>
          NIVEX chuẩn bị nội dung giao dịch; ví giữ khóa và yêu cầu người dùng
          xác nhận.
        </p>
      </article>
    </div>
  );
}

function CoreCell({
  className,
  icon,
  title,
  body,
  children,
}: {
  className: string;
  icon: ReactNode;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <article className={`solana-core-cell reveal ${className}`}>
      <div className="core-cell-visual" aria-hidden="true">
        <span className="core-cell-icon">{icon}</span>
        {children}
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

export function SolanaCoreGrid() {
  return (
    <div className="solana-core-grid">
      <CoreCell
        className="core-rpc"
        icon={<RadioTower />}
        title="RPC & trạng thái mạng"
        body="NIVEX đọc dữ liệu mạng và truy vấn trạng thái giao dịch qua RPC; Devnet là môi trường thử nghiệm hiện tại."
      >
        <span className="rpc-wave wave-one" />
        <span className="rpc-wave wave-two" />
        <span className="rpc-endpoint endpoint-one">A</span>
        <span className="rpc-endpoint endpoint-two">B</span>
        <span className="rpc-endpoint endpoint-three">C</span>
      </CoreCell>
      <CoreCell
        className="core-transaction"
        icon={<Link2 />}
        title="Giao dịch nguyên tử"
        body="Địa chỉ, số tiền và chỉ thị chuyển token được đóng thành một giao dịch để ví xem lại trước khi ký."
      >
        <span className="transaction-layer layer-one">MESSAGE</span>
        <span className="transaction-layer layer-two">INSTRUCTION</span>
        <span className="transaction-layer layer-three">SIGNATURE</span>
      </CoreCell>
      <CoreCell
        className="core-signature"
        icon={<KeyRound />}
        title="Chữ ký là bằng chứng"
        body="Sau khi ví ký, chữ ký giao dịch trở thành mã tham chiếu để truy vấn trên RPC và Solana Explorer."
      >
        <div className="signature-stream">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </CoreCell>
      <CoreCell
        className="core-finality"
        icon={<Activity />}
        title="Xác nhận theo từng mức"
        body="NIVEX phân biệt processed, confirmed và finalized để không đánh đồng việc đã gửi với đã hoàn tất."
      >
        <div className="finality-steps">
          <span>01</span>
          <span>02</span>
          <span>03</span>
        </div>
      </CoreCell>
    </div>
  );
}

const lifecycleSteps = [
  {
    number: "01",
    title: "Tạo yêu cầu",
    description:
      "Chọn người nhận, nhập số USDC bất kỳ và gắn nội dung công việc.",
    icon: <ReceiptText />,
    state: "DRAFT",
  },
  {
    number: "02",
    title: "Kiểm tra & ký",
    description:
      "Doanh nghiệp xem lại giao dịch rồi xác nhận trong ví của mình.",
    icon: <LockKeyhole />,
    state: "AUTHORIZED",
  },
  {
    number: "03",
    title: "Theo dõi xác nhận",
    description:
      "NIVEX dùng chữ ký để cập nhật trạng thái từ Solana về dashboard.",
    icon: <Route />,
    state: "FINALIZED",
  },
];

export function PaymentLifecycle() {
  return (
    <div className="payment-lifecycle">
      <div className="lifecycle-spine" aria-hidden="true" />
      {lifecycleSteps.map((step, index) => (
        <article
          className="lifecycle-step reveal"
          key={step.number}
          style={withDelay(`${index * 0.14}s`)}
        >
          <div className="lifecycle-index">
            <small>BƯỚC {step.number}</small>
            <h3>{step.title}</h3>
          </div>
          <div className="lifecycle-node" aria-hidden="true">
            {step.icon}
            <span>{step.state}</span>
          </div>
          <p>{step.description}</p>
        </article>
      ))}
      <div className="lifecycle-status reveal" aria-hidden="true">
        <Database />
        <span>Dashboard đồng bộ theo chữ ký giao dịch</span>
        <Gauge />
      </div>
    </div>
  );
}
