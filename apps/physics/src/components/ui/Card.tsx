import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

export function Card({ className, flat, ...rest }: HTMLAttributes<HTMLDivElement> & { flat?: boolean }) {
  return <div className={clsx(flat ? 'card-flat' : 'card', 'p-5 md:p-6', className)} {...rest} />;
}
