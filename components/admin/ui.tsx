import type { CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export const fieldClass =
  'w-full min-w-0 rounded-xl border border-[#702765]/15 bg-white px-3 py-2.5 text-sm text-[#351330] outline-none placeholder:text-muted focus:border-copper';

export const cardShellClass =
  'rounded-2xl border border-[#702765]/10 bg-white/85 shadow-[0_12px_30px_rgba(76,38,64,0.08)]';

export const softCardClass =
  'rounded-xl border border-[#702765]/10 bg-[#fffdf9]';

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className={`${cardShellClass} p-5`}>
      <p className="mb-2 text-xs text-muted">{label}</p>
      <p className="text-2xl font-black text-[#8b6415] sm:text-3xl">{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={`${cardShellClass} mb-6 p-5 sm:p-6`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#351330]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className || ''}`} />;
}

export function TextSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className || ''}`} />;
}

export function TextTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClass} ${props.className || ''}`} />;
}

export function PrimaryButton({
  children,
  className = '',
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { style?: CSSProperties }) {
  return (
    <button
      {...props}
      style={style}
      className={`copper-btn rounded-xl px-4 py-2.5 text-sm disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl border border-border-copper bg-transparent px-3 py-2 text-sm text-muted transition hover:border-copper hover:text-copper-bright disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = 'copper',
}: {
  children: ReactNode;
  tone?: 'copper' | 'green' | 'amber' | 'red' | 'slate';
}) {
  const tones = {
    copper: 'bg-copper/15 text-copper-bright border-copper/30',
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    red: 'bg-red-500/15 text-red-300 border-red-500/30',
    slate: 'bg-white/5 text-muted border-white/10',
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}
