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
import type { LandingLocale } from "@/lib/landing-copy";

const sceneCopy = {
  vi: {
    hero: {
      work: ["Công việc", "Đã hoàn thành"],
      recipient: ["Người nhận", "Đã đối chiếu"],
      invoice: ["Yêu cầu", "125.75 USDC"],
      chain: ["Solana", "Devnet · đã xác nhận"],
    },
    verification: {
      work: "Thiết kế sản phẩm",
      recipient: "Nguyễn Minh Anh",
      shared: "Thông tin đã cho phép chia sẻ",
      fields: ["Họ tên", "Ví nhận", "Mã nhân sự"],
    },
    approval: {
      amount: "SỐ TIỀN",
      wallet: "Ví doanh nghiệp",
      external: "Ký bên ngoài NIVEX",
      connected: "VÍ ĐÃ KẾT NỐI",
      pending: "CHỜ XÁC NHẬN",
      signed: "Đã ký",
      signature: "Chữ ký thuộc ví doanh nghiệp",
    },
    settlement: {
      sender: ["Ví doanh nghiệp", "125.75 USDC"],
      recipient: ["Ví người nhận", "Đã nhận USDC"],
      states: ["đã gửi", "đã xác nhận", "hoàn tất"],
    },
    capabilities: [
      {
        title: "Thông tin vừa đủ",
        body: "Đối chiếu hồ sơ được chia sẻ, công việc và ví nhận trước khi tạo yêu cầu.",
      },
      {
        title: "Giữ nguyên từng số lẻ",
        body: "Số USDC được giữ chính xác đến sáu chữ số thập phân trong suốt quy trình.",
      },
      {
        title: "Bạn là người ký",
        body: "NIVEX chuẩn bị nội dung để xem lại; ví doanh nghiệp giữ khóa và quyền xác nhận.",
      },
    ],
    signInWallet: "KÝ TRONG VÍ",
    core: [
      {
        title: "Đọc trạng thái mạng",
        body: "Trong hướng tích hợp, NIVEX dùng RPC để đọc trạng thái giao dịch; Devnet là môi trường thử nghiệm hiện tại.",
      },
      {
        title: "Một giao dịch, đủ ngữ cảnh",
        body: "Địa chỉ, số tiền và chỉ thị chuyển token được đặt cùng nhau để ví hiển thị trước khi ký.",
      },
      {
        title: "Chữ ký để đối chiếu",
        body: "Chữ ký giao dịch là mã tham chiếu để hai phía kiểm tra cùng một kết quả trên Solana.",
      },
      {
        title: "Không đánh đồng trạng thái",
        body: "Đã gửi, đã xác nhận và hoàn tất là những mốc khác nhau trong vòng đời giao dịch.",
      },
    ],
    transactionLayers: ["NỘI DUNG", "CHỈ THỊ", "CHỮ KÝ"],
    lifecycle: [
      {
        title: "Tạo yêu cầu",
        description: "Chọn người nhận, nhập số USDC và gắn nội dung công việc.",
        state: "ĐÃ TẠO",
      },
      {
        title: "Xem lại và ký",
        description: "Doanh nghiệp kiểm tra lần cuối rồi xác nhận trong ví của mình.",
        state: "ĐÃ DUYỆT",
      },
      {
        title: "Theo dõi kết quả",
        description: "NIVEX dùng chữ ký để đưa trạng thái giao dịch về dashboard.",
        state: "HOÀN TẤT",
      },
    ],
    step: "BƯỚC",
    synced: "Dashboard cập nhật theo chữ ký giao dịch",
  },
  en: {
    hero: {
      work: ["Work", "Completed"],
      recipient: ["Recipient", "Reviewed"],
      invoice: ["Request", "125.75 USDC"],
      chain: ["Solana", "Devnet · confirmed"],
    },
    verification: {
      work: "Product design",
      recipient: "Nguyễn Minh Anh",
      shared: "Details shared with permission",
      fields: ["Name", "Receiving wallet", "Team ID"],
    },
    approval: {
      amount: "AMOUNT",
      wallet: "Company wallet",
      external: "Signed outside NIVEX",
      connected: "WALLET CONNECTED",
      pending: "AWAITING APPROVAL",
      signed: "Signed",
      signature: "Signature belongs to the company wallet",
    },
    settlement: {
      sender: ["Company wallet", "125.75 USDC"],
      recipient: ["Recipient wallet", "USDC received"],
      states: ["sent", "confirmed", "finalized"],
    },
    capabilities: [
      {
        title: "Only the context you need",
        body: "Review shared details, the work, and receiving wallet before creating a request.",
      },
      {
        title: "Every decimal preserved",
        body: "USDC amounts remain precise to six decimal places throughout the workflow.",
      },
      {
        title: "You remain the signer",
        body: "NIVEX prepares the details for review; the company wallet keeps the keys and approval.",
      },
    ],
    signInWallet: "SIGN IN WALLET",
    core: [
      {
        title: "Read network status",
        body: "In the intended integration, NIVEX uses RPC to read transaction status; Devnet is the current test environment.",
      },
      {
        title: "One transaction, full context",
        body: "Address, amount, and token instruction stay together for the wallet to display before signing.",
      },
      {
        title: "A signature to verify",
        body: "The transaction signature gives both sides one reference for checking the result on Solana.",
      },
      {
        title: "Statuses stay distinct",
        body: "Sent, confirmed, and finalized remain separate milestones in the transaction lifecycle.",
      },
    ],
    transactionLayers: ["MESSAGE", "INSTRUCTION", "SIGNATURE"],
    lifecycle: [
      {
        title: "Create the request",
        description: "Choose a recipient, enter the USDC amount, and attach the work context.",
        state: "CREATED",
      },
      {
        title: "Review and sign",
        description: "The company checks the details one last time and approves them in its wallet.",
        state: "APPROVED",
      },
      {
        title: "Follow the outcome",
        description: "NIVEX uses the signature to bring transaction status back to the dashboard.",
        state: "FINALIZED",
      },
    ],
    step: "STEP",
    synced: "Dashboard updates from the transaction signature",
  },
} as const;

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

export function HeroSystemScene({ locale }: { locale: LandingLocale }) {
  const copy = sceneCopy[locale].hero;
  return (
    <div className="hero-system-scene" aria-hidden="true">
      <div className="scene-grid" />
      <div className="hero-flow">
        <SceneNode
          className="hero-node-work"
          icon={<BriefcaseBusiness size={25} />}
          label={copy.work[0]}
          meta={copy.work[1]}
          delay="0.12s"
        />
        <SceneConnector className="hero-line-one" delay="0.35s" />
        <SceneNode
          className="hero-node-recipient"
          icon={<UserCheck size={25} />}
          label={copy.recipient[0]}
          meta={copy.recipient[1]}
          delay="0.52s"
        />
        <SceneConnector className="hero-line-two" delay="0.72s" />
        <SceneNode
          className="hero-node-invoice"
          icon={<ReceiptText size={25} />}
          label={copy.invoice[0]}
          meta={copy.invoice[1]}
          delay="0.86s"
        />
        <SceneConnector className="hero-line-three" delay="1.05s" />
        <SceneNode
          className="hero-node-chain"
          icon={<Network size={25} />}
          label={copy.chain[0]}
          meta={copy.chain[1]}
          delay="1.2s"
        />
      </div>
    </div>
  );
}

export function RecipientVerificationScene({
  locale,
}: {
  locale: LandingLocale;
}) {
  const copy = sceneCopy[locale].verification;
  return (
    <div className="tech-scene verification-scene" aria-hidden="true">
      <div className="scene-grid" />
      <div className="document-node scene-piece" style={withDelay("0.08s")}>
        <div className="document-title">
          <FileText size={22} />
          <span>
            <strong>INV-2048</strong>
            <small>{copy.work}</small>
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
          <strong>{copy.recipient}</strong>
          <small>{copy.shared}</small>
        </span>
        <ul>
          <li>
            <Check size={13} /> {copy.fields[0]}
          </li>
          <li>
            <Check size={13} /> {copy.fields[1]}
          </li>
          <li>
            <Check size={13} /> {copy.fields[2]}
          </li>
        </ul>
      </div>
    </div>
  );
}

export function WalletApprovalScene({ locale }: { locale: LandingLocale }) {
  const copy = sceneCopy[locale].approval;
  return (
    <div className="tech-scene approval-scene" aria-hidden="true">
      <div className="scene-grid" />
      <div className="approval-amount scene-piece" style={withDelay("0.08s")}>
        <small>{copy.amount}</small>
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
          <strong>{copy.wallet}</strong>
          <small>{copy.external}</small>
        </span>
        <div className="wallet-account">
          <span className="wallet-account-mark">
            <Network size={20} />
          </span>
          <span className="wallet-account-copy">
            <small>{copy.connected}</small>
            <strong>8rF2...Qm91</strong>
            <em>Solana Devnet</em>
          </span>
        </div>
        <span className="approval-stamp">
          <KeyRound size={14} /> {copy.pending}
        </span>
      </div>
      <SceneConnector className="approval-line-right" delay="0.72s" />
      <div className="signed-node scene-piece" style={withDelay("0.92s")}>
        <CircleCheck size={34} />
        <strong>{copy.signed}</strong>
        <small>{copy.signature}</small>
      </div>
    </div>
  );
}

export function SettlementScene({ locale }: { locale: LandingLocale }) {
  const copy = sceneCopy[locale].settlement;
  return (
    <div className="tech-scene settlement-scene" aria-hidden="true">
      <div className="scene-grid" />
      <SceneNode
        className="settlement-sender"
        icon={<WalletCards size={25} />}
        label={copy.sender[0]}
        meta={copy.sender[1]}
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
        label={copy.recipient[0]}
        meta={copy.recipient[1]}
        delay="0.96s"
      />
      <div className="finality-rail scene-piece" style={withDelay("1.12s")}>
        {copy.states.map((state) => (
          <span key={state}>{state}</span>
        ))}
      </div>
    </div>
  );
}

export function CoreCapabilityGrid({ locale }: { locale: LandingLocale }) {
  const copy = sceneCopy[locale];
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
        <h3>{copy.capabilities[0].title}</h3>
        <p>{copy.capabilities[0].body}</p>
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
        <h3>{copy.capabilities[1].title}</h3>
        <p>{copy.capabilities[1].body}</p>
      </article>
      <article className="core-capability reveal">
        <div
          className="capability-visual capability-control"
          aria-hidden="true"
        >
          <WalletCards className="control-wallet scene-piece" />
          <SceneConnector className="control-line" delay="0.22s" />
          <ShieldCheck className="control-shield scene-piece" />
          <span className="control-label scene-piece">{copy.signInWallet}</span>
        </div>
        <h3>{copy.capabilities[2].title}</h3>
        <p>{copy.capabilities[2].body}</p>
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

export function SolanaCoreGrid({ locale }: { locale: LandingLocale }) {
  const copy = sceneCopy[locale];
  return (
    <div className="solana-core-grid">
      <CoreCell
        className="core-rpc"
        icon={<RadioTower />}
        title={copy.core[0].title}
        body={copy.core[0].body}
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
        title={copy.core[1].title}
        body={copy.core[1].body}
      >
        <span className="transaction-layer layer-one">{copy.transactionLayers[0]}</span>
        <span className="transaction-layer layer-two">{copy.transactionLayers[1]}</span>
        <span className="transaction-layer layer-three">{copy.transactionLayers[2]}</span>
      </CoreCell>
      <CoreCell
        className="core-signature"
        icon={<KeyRound />}
        title={copy.core[2].title}
        body={copy.core[2].body}
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
        title={copy.core[3].title}
        body={copy.core[3].body}
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

const lifecycleIcons = [<ReceiptText key="request" />, <LockKeyhole key="sign" />, <Route key="track" />];

export function PaymentLifecycle({ locale }: { locale: LandingLocale }) {
  const copy = sceneCopy[locale];
  return (
    <div className="payment-lifecycle">
      <div className="lifecycle-spine" aria-hidden="true" />
      {copy.lifecycle.map((step, index) => (
        <article
          className="lifecycle-step reveal"
          key={step.title}
          style={withDelay(`${index * 0.14}s`)}
        >
          <div className="lifecycle-index">
            <small>{copy.step} {String(index + 1).padStart(2, "0")}</small>
            <h3>{step.title}</h3>
          </div>
          <div className="lifecycle-node" aria-hidden="true">
            {lifecycleIcons[index]}
            <span>{step.state}</span>
          </div>
          <p>{step.description}</p>
        </article>
      ))}
      <div className="lifecycle-status reveal" aria-hidden="true">
        <Database />
        <span>{copy.synced}</span>
        <Gauge />
      </div>
    </div>
  );
}
