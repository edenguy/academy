import type { Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { IntegralExplorer } from './IntegralExplorer';
import { SecantExplorer } from './SecantExplorer';
import { PowerRuleExplorer } from './PowerRuleExplorer';
import { ExtremumExplorer } from './ExtremumExplorer';

/** Dispatches to the right explorer component by `config.kind` — see content/schema.ts. */
export function LessonExplorer({ config, locale }: { config: ExplorerConfig; locale: Locale }) {
  switch (config.kind) {
    case 'integral':
      return <IntegralExplorer config={config} locale={locale} />;
    case 'secant':
      return <SecantExplorer config={config} locale={locale} />;
    case 'powerRule':
      return <PowerRuleExplorer config={config} locale={locale} />;
    case 'extremum':
      return <ExtremumExplorer config={config} locale={locale} />;
  }
}
