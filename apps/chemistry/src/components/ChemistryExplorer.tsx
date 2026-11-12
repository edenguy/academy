import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { pick, type Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { conducts, ionPair, ionsFormed, type IonPairId, type SampleState } from '@/chemistry/ionic';
import { sharedPairs, type Arrangement, type BondOrder } from '@/chemistry/covalent';
import { isPolar, netDipole } from '@/chemistry/dipole';
import { cationPositions, electronsMoving, latticeHolds } from '@/chemistry/metallic';
import { hydrogenBondBetween, waterMolecule } from '@/chemistry/water';
import { probeResult, type MaterialId, type ProbeAnswer, type ProbeId } from '@/chemistry/materials';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';

const VB_W = 640;
const VB_H = 280;

function Grid() {
  return (
    <>
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`v${i}`} x1={40 + i * 70} y1={16} x2={40 + i * 70} y2={VB_H - 16} stroke="var(--grid)" strokeWidth={1} />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`h${i}`} x1={24} y1={20 + i * 60} x2={VB_W - 24} y2={20 + i * 60} stroke="var(--grid)" strokeWidth={1} />
      ))}
    </>
  );
}

function Readout({ label, value, tone = 'ink' }: { label: string; value: string; tone?: 'ink' | 'accent' | 'good' }) {
  const color = tone === 'accent' ? 'text-accent' : tone === 'good' ? 'text-good' : 'text-ink';
  return (
    <div className="elev-0 px-3.5 py-2.5 min-w-[112px]">
      <div className="text-[13px] text-muted">{label}</div>
      <div className={`readout text-[30px] md:text-[36px] font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="elev-0 p-1 rounded-pill inline-flex gap-1 flex-wrap" role="group" aria-label={label} style={{ ['--ledge' as string]: '2px' }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={
            'rounded-pill px-3.5 h-9 text-sm font-semibold ' + (value === opt.id ? 'bg-accent text-accent-ink ledge' : 'text-ink-2')
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Slider({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
}) {
  const span = max - min || 1;
  return (
    <div className="flex items-center gap-4">
      <label htmlFor={id} className="text-sm text-ink-2 shrink-0 w-28">
        {label}
      </label>
      <input
        id={id}
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--p' as string]: `${((value - min) / span) * 100}%` }}
      />
      <span className="readout text-ink font-semibold w-16 text-end shrink-0 num">{value.toFixed(step < 1 ? 2 : 0)}</span>
    </div>
  );
}

function Plot({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="elev-0 overflow-hidden" style={{ padding: '8px 8px 4px' }}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" style={{ direction: 'ltr' }} role="img" aria-label={label}>
        <Grid />
        {children}
      </svg>
    </div>
  );
}

function answerWord(t: (key: string) => string, answer: ProbeAnswer | boolean): string {
  if (answer === true || answer === 'yes') return t('lesson.yes');
  if (answer === false || answer === 'no') return t('lesson.no');
  return t('lesson.varies');
}

export function ChemistryExplorer({ config, locale }: { config: ExplorerConfig; locale: Locale }) {
  switch (config.kind) {
    case 'ionTransfer':
      return <IonTransfer config={config} locale={locale} />;
    case 'sharedPairs':
      return <SharedPairs config={config} locale={locale} />;
    case 'dipole':
      return <Dipole config={config} locale={locale} />;
    case 'electronSea':
      return <ElectronSea config={config} locale={locale} />;
    case 'waterPair':
      return <WaterPair config={config} locale={locale} />;
    case 'materialProbe':
      return <MaterialProbe config={config} locale={locale} />;
  }
}

function IonTransfer({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'ionTransfer' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [pairId, setPairId] = useState<IonPairId>(config.pair);
  const [state, setState] = useState<SampleState>(config.state);
  const pair = ionPair(pairId);
  const [moved, setMoved] = useState(0);
  const formed = ionsFormed(moved, pair);
  const xFor = (n: number) => 140 + (n / pair.electrons) * 360;

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <div className="flex flex-wrap gap-2">
        <Readout label={t('lesson.formula')} value={formed ? pair.formula : '—'} />
        <Readout label={t('lesson.conducts')} value={answerWord(t, formed && conducts(state))} tone={formed && conducts(state) ? 'good' : 'ink'} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Segmented
          label={t('lesson.pair')}
          value={pairId}
          onChange={(id) => {
            setPairId(id);
            setMoved(0);
          }}
          options={[
            { id: 'na-cl', label: 'Na / Cl' },
            { id: 'mg-cl', label: 'Mg / Cl' },
          ]}
        />
        <Segmented
          label={t('lesson.state')}
          value={state}
          onChange={setState}
          options={[
            { id: 'solid', label: t('lesson.states.solid') },
            { id: 'melt', label: t('lesson.states.melt') },
            { id: 'solution', label: t('lesson.states.solution') },
          ]}
        />
      </div>
      <Plot label={t('lesson.ionGraph')}>
        <line x1={140} y1={140} x2={500} y2={140} stroke="var(--series-a)" strokeWidth={2} />
        <circle cx={140} cy={140} r={28} fill="none" stroke="var(--series-a)" strokeWidth={2} />
        <circle cx={500} cy={140} r={28} fill="none" stroke="var(--series-b)" strokeWidth={2} />
        <text x={140} y={146} textAnchor="middle" fill="var(--ink)" fontSize={16} fontFamily="var(--font-mono)">
          {formed ? `${pair.metal}${pair.metalCharge > 0 ? '+' : ''}${pair.metalCharge > 1 ? pair.metalCharge : ''}` : pair.metal}
        </text>
        <text x={500} y={146} textAnchor="middle" fill="var(--ink)" fontSize={16} fontFamily="var(--font-mono)">
          {formed ? `${pair.nonmetal}${pair.nonmetalCount > 1 ? pair.nonmetalCount : ''}−` : pair.nonmetal}
        </text>
        <circle cx={xFor(moved)} cy={110} r={7} fill="var(--accent-2)" stroke="var(--surface)" strokeWidth={2} />
      </Plot>
      <Slider id="ion-moved" label={t('lesson.electronsMoved')} min={0} max={pair.electrons} step={0.01} value={moved} onChange={setMoved} />
    </Card>
  );
}

function SharedPairs({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'sharedPairs' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [order, setOrder] = useState<BondOrder>(config.order);
  const [arrangement, setArrangement] = useState<Arrangement>(config.arrangement);
  const pairs = sharedPairs(order);

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <Readout label={t('lesson.pairsCount')} value={String(pairs)} />
      <Segmented
        label={t('lesson.arrangement')}
        value={arrangement}
        onChange={setArrangement}
        options={[
          { id: 'molecular', label: t('lesson.arrangements.molecular') },
          { id: 'network', label: t('lesson.arrangements.network') },
        ]}
      />
      <Plot label={t('lesson.sharedGraph')}>
        {arrangement === 'molecular'
          ? Array.from({ length: pairs }, (_, i) => (
              <line key={i} x1={180} y1={110 + (i - (pairs - 1) / 2) * 16} x2={460} y2={110 + (i - (pairs - 1) / 2) * 16} stroke="var(--series-a)" strokeWidth={3} />
            ))
          : [0, 1, 2].flatMap((row) =>
              [0, 1, 2].map((col) => (
                <g key={`${row}-${col}`}>
                  <circle cx={200 + col * 90} cy={70 + row * 55} r={8} fill="var(--series-a)" />
                  {col < 2 && <line x1={200 + col * 90} y1={70 + row * 55} x2={290 + col * 90} y2={70 + row * 55} stroke="var(--series-a)" strokeWidth={2} />}
                  {row < 2 && <line x1={200 + col * 90} y1={70 + row * 55} x2={200 + col * 90} y2={125 + row * 55} stroke="var(--series-a)" strokeWidth={2} />}
                </g>
              )),
            )}
        {arrangement === 'molecular' && (
          <>
            <circle cx={180} cy={140} r={22} fill="none" stroke="var(--ink)" strokeWidth={2} />
            <circle cx={460} cy={140} r={22} fill="none" stroke="var(--ink)" strokeWidth={2} />
          </>
        )}
      </Plot>
      <Slider
        id="bond-order"
        label={t('lesson.bondOrder')}
        min={1}
        max={3}
        step={1}
        value={order}
        onChange={(n) => setOrder(n as BondOrder)}
      />
    </Card>
  );
}

function Dipole({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'dipole' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [angle, setAngle] = useState(config.angle);
  const net = netDipole(angle);
  const polar = isPolar(angle);
  const rad = ((angle / 2) * Math.PI) / 180;
  const len = 150;
  const cx = 320;
  const cy = 160;
  const x1 = cx - len * Math.sin(rad);
  const y1 = cy - len * Math.cos(rad);
  const x2 = cx + len * Math.sin(rad);
  const y2 = cy - len * Math.cos(rad);

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <div className="flex flex-wrap gap-2">
        <Readout label={t('lesson.netDipole')} value={net.toFixed(2)} tone="accent" />
        <Readout label={t('lesson.polarity')} value={polar ? t('lesson.polar') : t('lesson.nonpolar')} tone={polar ? 'accent' : 'ink'} />
      </div>
      <Plot label={t('lesson.dipoleGraph')}>
        <line x1={cx} y1={cy} x2={x1} y2={y1} stroke="var(--series-a)" strokeWidth={3} />
        <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="var(--series-a)" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={8} fill="var(--ink)" />
        <text x={x1} y={y1 - 8} textAnchor="middle" fill="var(--accent)" fontSize={16}>δ−</text>
        <text x={x2} y={y2 - 8} textAnchor="middle" fill="var(--accent)" fontSize={16}>δ−</text>
        <text x={cx} y={cy + 28} textAnchor="middle" fill="var(--ink-2)" fontSize={16}>δ+</text>
      </Plot>
      <Slider id="dipole-angle" label={t('lesson.angle')} min={0} max={180} step={1} value={angle} onChange={setAngle} />
    </Card>
  );
}

function ElectronSea({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'electronSea' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [shear, setShear] = useState(config.shear);
  const [drift, setDrift] = useState(config.drift);
  const pts = cationPositions(shear);

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <div className="flex flex-wrap gap-2">
        <Readout label={t('lesson.holds')} value={answerWord(t, latticeHolds(shear))} tone="good" />
        <Readout label={t('lesson.electronsDrift')} value={answerWord(t, electronsMoving(drift))} tone={electronsMoving(drift) ? 'accent' : 'ink'} />
      </div>
      <Plot label={t('lesson.seaGraph')}>
        <rect x={80} y={40} width={480} height={200} rx={24} fill="var(--series-b-soft)" stroke="var(--series-b)" />
        {pts.map((p, i) => (
          <circle key={i} cx={160 + p.x * 90} cy={90 + p.y * 90} r={16} fill="var(--series-a)" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={`e${i}`} cx={120 + ((i * 70 + drift * 80) % 420)} cy={70 + (i % 3) * 50} r={4} fill="var(--accent-2)" />
        ))}
      </Plot>
      <Slider id="shear" label={t('lesson.shear')} min={0} max={1} step={0.01} value={shear} onChange={setShear} />
      <Slider id="drift" label={t('lesson.drift')} min={0} max={1} step={0.01} value={drift} onChange={setDrift} />
    </Card>
  );
}

function WaterPair({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'waterPair' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [x, setX] = useState(config.x);
  const [rotation, setRotation] = useState(config.rotation);
  const fixed = waterMolecule(0, 0, 0);
  const moving = waterMolecule(x, 0, rotation);
  const linked = hydrogenBondBetween(fixed, moving);
  const svgRef = useRef<SVGSVGElement>(null);

  function place(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = 0;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse()).x;
    const model = (local - 160) / 120;
    setX(Math.min(3.4, Math.max(1.2, model)));
  }

  function draw(m: ReturnType<typeof waterMolecule>, key: string) {
    const s = (p: { x: number; y: number }) => ({ x: 160 + p.x * 120, y: 150 - p.y * 120 });
    const o = s(m.O);
    const h1 = s(m.H1);
    const h2 = s(m.H2);
    return (
      <g key={key}>
        <line x1={o.x} y1={o.y} x2={h1.x} y2={h1.y} stroke="var(--series-a)" strokeWidth={3} />
        <line x1={o.x} y1={o.y} x2={h2.x} y2={h2.y} stroke="var(--series-a)" strokeWidth={3} />
        <circle cx={o.x} cy={o.y} r={14} fill="var(--series-a)" />
        <circle cx={h1.x} cy={h1.y} r={8} fill="var(--accent-2)" />
        <circle cx={h2.x} cy={h2.y} r={8} fill="var(--accent-2)" />
      </g>
    );
  }

  const o1 = { x: 160 + fixed.O.x * 120, y: 150 - fixed.O.y * 120 };
  const o2 = { x: 160 + moving.O.x * 120, y: 150 - moving.O.y * 120 };

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <Readout label={t('lesson.hydrogenBond')} value={answerWord(t, linked)} tone={linked ? 'accent' : 'ink'} />
      <div className="elev-0 overflow-hidden" style={{ padding: '8px 8px 4px' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full h-auto touch-none"
          style={{ direction: 'ltr' }}
          role="img"
          aria-label={t('lesson.waterGraph')}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            place(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons !== 1) return;
            place(e.clientX);
          }}
        >
          <Grid />
          {linked && <line x1={o1.x} y1={o1.y} x2={o2.x} y2={o2.y} stroke="var(--series-b)" strokeWidth={2} strokeDasharray="8 6" />}
          {draw(fixed, 'a')}
          {draw(moving, 'b')}
        </svg>
      </div>
      <Slider id="water-x" label={t('lesson.separation')} min={1.2} max={3.4} step={0.01} value={x} onChange={setX} />
      <Slider id="water-rot" label={t('lesson.rotation')} min={0} max={360} step={1} value={rotation} onChange={setRotation} />
    </Card>
  );
}

function MaterialProbe({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'materialProbe' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [material, setMaterial] = useState<MaterialId>(config.material);
  const [probe, setProbe] = useState<ProbeId>(config.probe);
  const answer = probeResult(material, probe);

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <Readout label={t('lesson.answer')} value={answerWord(t, answer)} tone={answer === 'yes' ? 'good' : 'ink'} />
      <Segmented
        label={t('lesson.material')}
        value={material}
        onChange={setMaterial}
        options={(['ionic', 'molecular', 'metallic', 'network'] as MaterialId[]).map((id) => ({
          id,
          label: t(`lesson.materials.${id}`),
        }))}
      />
      <Segmented
        label={t('lesson.probe')}
        value={probe}
        onChange={setProbe}
        options={(['conductSolid', 'conductMelt', 'dissolve', 'meltEasy'] as ProbeId[]).map((id) => ({
          id,
          label: t(`lesson.probes.${id}`),
        }))}
      />
      <Plot label={t('lesson.probeGraph')}>
        <text x={320} y={150} textAnchor="middle" fill="var(--ink)" fontSize={28} fontFamily="var(--font-display)">
          {t(`lesson.materials.${material}`)}
        </text>
      </Plot>
    </Card>
  );
}

function Caption({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-1.5 text-sm font-semibold text-accent">
      <Icon name="handle" size={16} /> {text}
    </div>
  );
}
