import type { Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { MotionScrubber } from './MotionScrubber';
import { SlopeExplorer } from './SlopeExplorer';
import { AccelerationExplorer } from './AccelerationExplorer';

/** Dispatches to the right explorer component by `config.kind` — see content/schema.ts. */
export function KinematicsExplorer({ config, locale }: { config: ExplorerConfig; locale: Locale }) {
  switch (config.kind) {
    case 'scrubber':
      return <MotionScrubber config={config} locale={locale} />;
    case 'secant':
      return <SlopeExplorer config={config} locale={locale} />;
    case 'accelArea':
      return <AccelerationExplorer config={config} locale={locale} />;
  }
}
