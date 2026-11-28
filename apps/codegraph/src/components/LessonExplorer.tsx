import type { Locale } from '@/content/localize';
import { pick } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { SearchCostExplorer } from './explorers/SearchCostExplorer';
import { GraphViewExplorer } from './explorers/GraphViewExplorer';
import { AskGraphsExplorer } from './explorers/AskGraphsExplorer';
import { LandscapeExplorer } from './explorers/LandscapeExplorer';

/** Dispatches to the explorer for `config.kind`. */
export function LessonExplorer({ config, locale }: { config: ExplorerConfig; locale: Locale }) {
  switch (config.kind) {
    case 'searchCost':
      return <SearchCostExplorer config={config} locale={locale} />;
    case 'graphView':
      return <GraphViewExplorer config={config} locale={locale} />;
    case 'askGraphs':
      return <AskGraphsExplorer config={config} locale={locale} />;
    case 'landscape':
      return <LandscapeExplorer config={config} locale={locale} />;
    default:
      return (
        <div className="elev-2 p-4">
          <p className="text-sm text-ink-2">{pick(config.caption, locale)}</p>
        </div>
      );
  }
}
