import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

type Variant = 'well' | 'card' | 'bench';

const variantClass: Record<Variant, string> = {
  well: 'elev-0',
  card: 'elev-1',
  bench: 'elev-2',
};
const paddingClass: Record<Variant, string> = {
  well: 'p-4 md:p-5',
  card: 'p-5 md:p-6',
  bench: 'p-5 md:p-6',
};

export function Card({
  className,
  variant = 'card',
  noStripe,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { variant?: Variant; noStripe?: boolean }) {
  return (
    <div
      className={clsx(variantClass[variant], paddingClass[variant], variant === 'bench' && noStripe && 'no-stripe', className)}
      {...rest}
    />
  );
}
