import type { Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { ChemistryExplorer } from './ChemistryExplorer';

/** Dispatches to the chemistry explorer by `config.kind`. */
export function LessonExplorer({ config, locale }: { config: ExplorerConfig; locale: Locale }) {
  return <ChemistryExplorer config={config} locale={locale} />;
}
