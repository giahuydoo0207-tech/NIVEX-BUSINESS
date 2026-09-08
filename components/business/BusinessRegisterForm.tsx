"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Check, LoaderCircle, ShieldCheck } from "lucide-react";
import type { OrganizationRegistration, OrganizationType } from "@/types/business";

type RegistrationForm = OrganizationRegistration & {
  password: string;
  acceptedTerms: boolean;
  confirmedAuthority: boolean;
};

const initialForm: RegistrationForm = {
  ownerFullName: "",
  workEmail: "",
  phoneNumber: "",
  password: "",
  legalName: "",
  tradingName: "",
  type: "COMPANY",
  countryCode: "VN",
  registrationNumber: "",
  website: "",
  representativeTitle: "",
  acceptedTerms: false,
  confirmedAuthority: false,
};

const organizationTypes: Array<{ value: OrganizationType; label: string }> = [
  { value: "COMPANY", label: "Công ty" },
  { value: "STARTUP", label: "Startup" },
  { value: "AGENCY", label: "Agency" },
  { value: "WEB3_ORGANIZATION", label: "Tổ chức Web3 / DAO" },
  { value: "HOUSEHOLD_BUSINESS", label: "Hộ kinh doanh" },
  { value: "OTHER", label: "Tổ chức khác" },
];

export function BusinessRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof RegistrationForm>(key: K, value: RegistrationForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function validateCurrentStep() {
    if (step === 1) {
      if (!form.ownerFullName.trim() || !form.workEmail.trim() || !form.phoneNumber.trim()) {
        return "Điền đầy đủ thông tin người quản trị.";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail)) {
        return "Email công việc chưa hợp lệ.";
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(form.password)) {
        return "Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.";
      }
    }

    if (step === 2 && (!form.legalName.trim() || !form.registrationNumber.trim())) {
      return "Tên pháp lý và mã đăng ký doanh nghiệp là bắt buộc.";
    }

    if (step === 3) {
      if (!form.representativeTitle.trim()) return "Nhập chức vụ của người đại diện.";
      if (!form.confirmedAuthority) return "Xác nhận bạn có quyền đại diện cho tổ chức.";
      if (!form.acceptedTerms) return "Bạn cần đồng ý với điều khoản sử dụng.";
    }

    return "";
  }

  function continueStep() {
    const message = validateCurrentStep();
    if (message) return setError(message);
    setStep((current) => Math.min(current + 1, 3));
  }

  async function submitRegistration() {
    const message = validateCurrentStep();
    if (message) return setError(message);

    setSubmitting(true);
    const { password: _password, acceptedTerms: _terms, confirmedAuthority: _authority, ...registration } = form;
    localStorage.setItem("nivex.demo.organization", JSON.stringify(registration));
    await new Promise((resolve) => setTimeout(resolve, 700));
    router.push("/business/dashboard");
  }

  return (
    <div className="business-register-grid">
      <section className="register-context">
        <div className="register-context-icon"><Building2 size={28} /></div>
        <p className="eyebrow">NIVEX BUSINESS</p>
        <h1>Tạo không gian thanh toán cho tổ chức</h1>
        <p>Quản lý contractor, hóa đơn USDC và biên nhận trong một quy trình có thể đối soát.</p>
        <div className="register-trust"><ShieldCheck size={19} /><span>Không yêu cầu seed phrase hoặc private key.</span></div>
        <div className="register-demo-note">Hồ sơ được tạo trong chế độ thử nghiệm Devnet. Xác minh KYB thật sẽ được nối qua đối tác ở giai đoạn production.</div>
      </section>

      <section className="register-form-panel">
        <div className="step-indicator" aria-label={`Bước ${step} trên 3`}>
          {[1, 2, 3].map((item) => (
            <span className={item <= step ? "active" : ""} key={item}>{item < step ? <Check size={15} /> : item}</span>
          ))}
        </div>
        <div className="register-heading">
          <span>Bước {step}/3</span>
          <h2>{step === 1 ? "Tài khoản quản trị" : step === 2 ? "Thông tin tổ chức" : "Người đại diện"}</h2>
        </div>

        {step === 1 && (
          <div className="form-grid">
            <label className="field full"><span>Họ và tên</span><input value={form.ownerFullName} onChange={(event) => update("ownerFullName", event.target.value)} autoComplete="name" /></label>
            <label className="field full"><span>Email công việc</span><input type="email" value={form.workEmail} onChange={(event) => update("workEmail", event.target.value)} autoComplete="email" /></label>
            <label className="field"><span>Số điện thoại</span><input type="tel" value={form.phoneNumber} onChange={(event) => update("phoneNumber", event.target.value)} autoComplete="tel" /></label>
            <label className="field"><span>Mật khẩu</span><input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" /></label>
          </div>
        )}

        {step === 2 && (
          <div className="form-grid">
            <label className="field full"><span>Tên pháp lý</span><input value={form.legalName} onChange={(event) => update("legalName", event.target.value)} /></label>
            <label className="field"><span>Tên thương mại</span><input value={form.tradingName} onChange={(event) => update("tradingName", event.target.value)} /></label>
            <label className="field"><span>Loại hình</span><select value={form.type} onChange={(event) => update("type", event.target.value as OrganizationType)}>{organizationTypes.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}</select></label>
            <label className="field"><span>Quốc gia đăng ký</span><select value={form.countryCode} onChange={(event) => update("countryCode", event.target.value)}><option value="VN">Việt Nam</option><option value="SG">Singapore</option><option value="AU">Australia</option><option value="US">United States</option></select></label>
            <label className="field"><span>Mã doanh nghiệp / mã số thuế</span><input value={form.registrationNumber} onChange={(event) => update("registrationNumber", event.target.value)} /></label>
            <label className="field full"><span>Website (không bắt buộc)</span><input type="url" placeholder="https://" value={form.website} onChange={(event) => update("website", event.target.value)} /></label>
          </div>
        )}

        {step === 3 && (
          <div className="form-grid">
            <label className="field full"><span>Người đại diện</span><input value={form.ownerFullName} readOnly /></label>
            <label className="field full"><span>Chức vụ</span><input value={form.representativeTitle} onChange={(event) => update("representativeTitle", event.target.value)} placeholder="Ví dụ: Giám đốc, Finance Manager" /></label>
            <label className="check-field full"><input type="checkbox" checked={form.confirmedAuthority} onChange={(event) => update("confirmedAuthority", event.target.checked)} /><span>Tôi xác nhận có quyền tạo và quản lý không gian thanh toán của tổ chức này.</span></label>
            <label className="check-field full"><input type="checkbox" checked={form.acceptedTerms} onChange={(event) => update("acceptedTerms", event.target.checked)} /><span>Tôi đồng ý với Điều khoản sử dụng và Chính sách dữ liệu của NIVEX.</span></label>
          </div>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="register-actions">
          {step > 1 ? <button className="text-button" type="button" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={17} />Quay lại</button> : <span />}
          {step < 3 ? (
            <button className="business-primary-button" type="button" onClick={continueStep}>Tiếp tục<ArrowRight size={17} /></button>
          ) : (
            <button className="business-primary-button" type="button" disabled={submitting} onClick={submitRegistration}>{submitting ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}{submitting ? "Đang tạo..." : "Tạo tổ chức"}</button>
          )}
        </div>
      </section>
    </div>
  );
}
