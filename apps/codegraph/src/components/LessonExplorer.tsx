import type { Locale } from '@/content/localize';
import { pick } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';

/** Placeholder until the explorers land: caption plus the config as text. */
export function LessonExplorer({ config, locale }: { config: ExplorerConfig; locale: Locale }) {
  return (
    <div className="elev-2 p-4">
      <p className="text-sm text-ink-2">{pick(config.caption, locale)}</p>
      <pre className="sci mt-2 whitespace-pre-wrap text-xs">{JSON.stringify(config)}</pre>
    </div>
  );
}
