"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";

export function BusinessLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError("Nhập email công việc hợp lệ.");
    }
    if (!password) return setError("Nhập mật khẩu để tiếp tục.");

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    router.push("/business/dashboard");
  }

  return (
    <form className="business-login-form" onSubmit={submit}>
      <div className="login-form-heading">
        <p className="eyebrow">ĐĂNG NHẬP TỔ CHỨC</p>
        <h1>Chào mừng trở lại</h1>
        <p>Truy cập hóa đơn, contractor và quy trình phê duyệt thanh toán.</p>
      </div>
      <label className="field full">
        <span>Email công việc</span>
        <div className="auth-input"><Mail size={18} /><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} autoComplete="email" placeholder="finance@company.com" /></div>
      </label>
      <label className="field full">
        <span>Mật khẩu</span>
        <div className="auth-input"><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
      </label>
      <div className="login-options"><label><input type="checkbox" />Duy trì đăng nhập</label><button type="button" disabled title="Chưa khả dụng trong prototype">Quên mật khẩu?</button></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="business-primary-button wide login-submit" type="submit" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={18} /> : null}{submitting ? "Đang đăng nhập..." : "Đăng nhập"}{!submitting ? <ArrowRight size={18} /> : null}</button>
      <p className="register-link">Chưa có tài khoản doanh nghiệp? <Link href="/business/register">Đăng ký tổ chức</Link></p>
      <div className="demo-access"><strong>Truy cập bản Devnet</strong><span>Dùng email hợp lệ và mật khẩu bất kỳ để xem Business Portal prototype.</span></div>
    </form>
  );
}
