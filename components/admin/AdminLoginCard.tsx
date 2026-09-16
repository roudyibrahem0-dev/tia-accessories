type AdminLoginCardProps = {
  email: string;
  password: string;
  loginError: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
};

export function AdminLoginCard({
  email,
  password,
  loginError,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AdminLoginCardProps) {
  return (
    <div className="circuit-bg flex min-h-screen items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md rounded-[28px] border border-border-copper bg-[#101015]/90 p-6 shadow-[0_0_30px_rgba(168,112,56,0.2)]">
        <div className="mb-6 text-center">
          <p className="mb-2 text-xs font-bold tracking-[0.25em] text-copper">ADMIN ACCESS</p>
          <h1 className="text-3xl font-black text-copper-bright">تسجيل الدخول</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-muted">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              className="w-full rounded-xl border border-border-copper bg-[#0d0d12] px-4 py-3 text-white outline-none ring-0 placeholder:text-muted focus:border-copper"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="w-full rounded-xl border border-border-copper bg-[#0d0d12] px-4 py-3 text-white outline-none ring-0 placeholder:text-muted focus:border-copper"
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>

          {loginError ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {loginError}
            </div>
          ) : null}

          <button type="submit" className="copper-btn w-full rounded-full px-4 py-3 text-sm font-bold">
            دخول الإدارة
          </button>
        </form>
      </div>
    </div>
  );
}
