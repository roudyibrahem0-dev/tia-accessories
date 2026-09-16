type AddAdminCardProps = {
  currentUserEmail: string;
  newAdminEmail: string;
  newAdminPassword: string;
  adminMessage: string;
  isAddingAdmin: boolean;
  onNewAdminEmailChange: (value: string) => void;
  onNewAdminPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
};

export function AddAdminCard({
  currentUserEmail,
  newAdminEmail,
  newAdminPassword,
  adminMessage,
  isAddingAdmin,
  onNewAdminEmailChange,
  onNewAdminPasswordChange,
  onSubmit,
}: AddAdminCardProps) {
  return (
    <div className="w-full max-w-5xl rounded-[28px] border border-border-copper/70 bg-[#121218] p-5 shadow-[0_0_32px_rgba(155,113,74,0.12)] sm:p-7">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.24em] text-copper">ADMIN ACCESS</p>
          <h3 className="mt-2 text-2xl font-black text-copper-bright">إضافة مدير جديد</h3>
        </div>

        <div className="rounded-full border border-copper/30 bg-[#191b22] px-3 py-2 text-xs text-copper-bright">
          {currentUserEmail || 'Super Admin'}
        </div>
      </div>

      <form onSubmit={onSubmit} className="mx-auto w-full max-w-4xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-center">
          <div className="w-full md:w-[45%]">
            <label className="mb-2 block text-sm text-muted">البريد الإلكتروني</label>
            <input
              type="email"
              value={newAdminEmail}
              onChange={(event) => onNewAdminEmailChange(event.target.value)}
              className="w-full rounded-2xl border border-border-copper bg-[#0d0d12] px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-copper"
              placeholder="example@domain.com"
              required
            />
          </div>

          <div className="w-full md:w-[45%]">
            <label className="mb-2 block text-sm text-muted">كلمة المرور</label>
            <input
              type="password"
              value={newAdminPassword}
              onChange={(event) => onNewAdminPasswordChange(event.target.value)}
              className="w-full rounded-2xl border border-border-copper bg-[#0d0d12] px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-copper"
              placeholder="********"
              required
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="submit"
            disabled={isAddingAdmin}
            className="rounded-full bg-copper px-8 py-3 text-sm font-black text-[#111111] transition hover:brightness-110 disabled:opacity-60"
          >
            {isAddingAdmin ? 'جاري الإضافة...' : 'إضافة مدير'}
          </button>
        </div>
      </form>

      {adminMessage ? (
        <div className="mt-6 rounded-2xl border border-copper/30 bg-copper/10 px-4 py-3 text-sm text-copper-bright">
          {adminMessage}
        </div>
      ) : null}
    </div>
  );
}
