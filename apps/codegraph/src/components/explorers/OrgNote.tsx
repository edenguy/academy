import { useTranslation } from 'react-i18next';

/** The "example organization" label (CODEGRAPH_LLD.md section 1.5), shown under every explorer that uses 500 and 20,000. */
export function OrgNote({ className }: { className?: string }) {
  const { t } = useTranslation();
  return <p className={className ?? 'text-[13px] text-muted'}>{t('org.illustrative')}</p>;
}
