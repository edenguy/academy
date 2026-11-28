import type { Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { SearchCostExplorer } from './explorers/SearchCostExplorer';
import { GraphViewExplorer } from './explorers/GraphViewExplorer';
import { AskGraphsExplorer } from './explorers/AskGraphsExplorer';
import { LandscapeExplorer } from './explorers/LandscapeExplorer';
import { ScaleExplorer } from './explorers/ScaleExplorer';
import { StalenessExplorer } from './explorers/StalenessExplorer';
import { TopologyExplorer } from './explorers/TopologyExplorer';
import { CadenceExplorer } from './explorers/CadenceExplorer';
import { AccessExplorer } from './explorers/AccessExplorer';

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
    case 'scale':
      return <ScaleExplorer config={config} locale={locale} />;
    case 'staleness':
      return <StalenessExplorer config={config} locale={locale} />;
    case 'topology':
      return <TopologyExplorer config={config} locale={locale} />;
    case 'cadence':
      return <CadenceExplorer config={config} locale={locale} />;
    case 'access':
      return <AccessExplorer config={config} locale={locale} />;
  }
}
