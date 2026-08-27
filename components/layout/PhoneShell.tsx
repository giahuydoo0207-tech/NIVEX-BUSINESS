export function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="page-stage">
      <section className="phone" aria-label="NIVEX mobile app preview">
        <div className="notch" aria-hidden="true" />
        <div className="status" aria-hidden="true">
          <span>9:41</span>
          <span>●●● 5G ◔</span>
        </div>
        <div className="screen">{children}</div>
      </section>
    </main>
  );
}
