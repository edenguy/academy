import { useId, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Ident } from '@/components/Ident';

/** Small controls shared by the explorers: bench caption, readout tiles, segmented control, switch, slider. */

export function Caption({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-2 text-[14px] font-semibold text-accent">
      <Icon name="handle" size={18} /> <span>{text}</span>
    </div>
  );
}

export function Readout({
  label,
  value,
  sub,
  tone = 'ink',
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'ink' | 'accent' | 'good' | 'muted';
  icon?: IconName;
}) {
  const color = tone === 'accent' ? 'text-accent' : tone === 'good' ? 'text-good' : tone === 'muted' ? 'text-muted' : 'text-ink';
  return (
    <div className="elev-0 px-3.5 py-2.5 min-w-[130px] flex-1 basis-[130px]">
      <div className="text-[13px] text-ink-2">{label}</div>
      <div className={clsx('readout text-[26px] md:text-[32px] font-semibold leading-tight', color)}>
        {icon && <Icon name={icon} size={20} className="inline-block align-[-3px] me-1.5" />}
        {value}
      </div>
      {sub && <div className="text-[12.5px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: { id: T; label: ReactNode }[];
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={clsx('elev-0 p-1 rounded-pill inline-flex gap-1 flex-wrap', className)} role="group" aria-label={label} style={{ ['--ledge' as string]: '2px' }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={clsx('rounded-pill px-3.5 min-h-11 text-sm font-semibold', value === opt.id ? 'bg-accent text-accent-ink ledge' : 'text-ink-2')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ label, checked, onChange, className }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx('inline-flex items-center gap-2.5 min-h-11 text-start text-sm text-ink-2 rounded-md', className)}
    >
      <span
        className={clsx('relative shrink-0 w-11 h-6 rounded-pill border transition-colors', checked ? 'bg-accent border-accent' : 'bg-surface-3 border-line-strong')}
        aria-hidden="true"
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-pill bg-surface shadow transition-all"
          style={{ insetInlineStart: checked ? 22 : 2, borderRadius: 999 }}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}

export function SliderField({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  display,
  hint,
  id: idProp,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (n: number) => void;
  display?: ReactNode;
  hint?: string;
  id?: string;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  const span = max - min || 1;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm text-ink-2">
          <Ident text={label} />
        </label>
        <span className="readout text-ink font-semibold num shrink-0">{display ?? value}</span>
      </div>
      <input
        id={id}
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--p' as string]: `${((value - min) / span) * 100}%` }}
      />
      {hint && <div className="text-[12.5px] text-muted -mt-1">{hint}</div>}
    </div>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clsx('sci', className)}>{children}</span>;
}
