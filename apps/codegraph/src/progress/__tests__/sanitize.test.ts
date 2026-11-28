import { describe, expect, it } from 'vitest';
import { mergePersisted, sanitisePersisted, type PersistedProgress } from '../sanitize';

const valid = {
  settings: { locale: 'he', theme: 'dark' },
  lessonsCompleted: { 'area-under-curve': 1700000000000 },
  lastVisited: 'riemann-sums',
  attempts: [{ lessonId: 'area-under-curve', questionId: 'q1-why-rectangles', correct: true, at: 1700000000001 }],
  achievements: { 'first-lesson': 1700000000002 },
};

describe('sanitisePersisted', () => {
  it('passes a well-formed record through unchanged in shape', () => {
    const out = sanitisePersisted(valid);
    expect(out.settings).toEqual({ locale: 'he', theme: 'dark' });
    expect(out.lessonsCompleted).toEqual(valid.lessonsCompleted);
    expect(out.lastVisited).toBe('riemann-sums');
    expect(out.attempts).toEqual(valid.attempts);
    expect(out.achievements).toEqual({ 'first-lesson': 1700000000002 });
  });

  it('falls back to safe defaults for garbage or missing input', () => {
    expect(sanitisePersisted(undefined)).toEqual({
      settings: { locale: 'he', theme: 'dark' },
      lessonsCompleted: {},
      lastVisited: null,
      attempts: [],
      achievements: {},
    });
    expect(sanitisePersisted(null)).toEqual(sanitisePersisted(undefined));
    expect(sanitisePersisted('not an object')).toEqual(sanitisePersisted(undefined));
    expect(sanitisePersisted([1, 2, 3])).toEqual(sanitisePersisted(undefined));
  });

  it('rejects an out-of-range locale/theme and drops malformed lessonsCompleted entries', () => {
    const out = sanitisePersisted({
      settings: { locale: 'fr', theme: 'neon' },
      lessonsCompleted: { good: 1, bad: 'not-a-timestamp', also: Number.NaN },
    });
    expect(out.settings).toEqual({ locale: 'he', theme: 'dark' });
    expect(out.lessonsCompleted).toEqual({ good: 1 });
  });

  it('drops malformed attempts but keeps valid ones, and caps the list at 500', () => {
    const out = sanitisePersisted({
      attempts: [
        { lessonId: 'x', questionId: 'y', correct: true, at: 1 },
        { lessonId: 'x', questionId: 'y' }, // missing correct/at
        null,
        'nope',
      ],
    });
    expect(out.attempts).toEqual([{ lessonId: 'x', questionId: 'y', correct: true, at: 1 }]);

    const many = Array.from({ length: 600 }, (_, i) => ({ lessonId: 'x', questionId: String(i), correct: true, at: i }));
    const capped = sanitisePersisted({ attempts: many });
    expect(capped.attempts).toHaveLength(500);
    expect(capped.attempts?.[0]?.questionId).toBe('100'); // kept the most recent 500
  });

  it('drops achievement ids that are not in the known set, or whose value is not a timestamp', () => {
    const out = sanitisePersisted({
      achievements: { 'first-lesson': 1, 'not-a-real-id': 2, 'ten-correct': 'soon' },
    });
    expect(out.achievements).toEqual({ 'first-lesson': 1 });
  });

  it('falls back lastVisited to null when it is not a string', () => {
    expect(sanitisePersisted({ lastVisited: 42 }).lastVisited).toBeNull();
    expect(sanitisePersisted({ lastVisited: { chapterId: 'x' } }).lastVisited).toBeNull();
  });
});

describe('mergePersisted', () => {
  const current: PersistedProgress = {
    settings: { locale: 'en', theme: 'light' },
    lessonsCompleted: {},
    lastVisited: null,
    attempts: [],
    achievements: {},
  };

  it('regression guard: keeps the live-initialized settings on a first-ever visit (nothing persisted yet)', () => {
    // This is the exact shape zustand's persist passes on a fresh IndexedDB — `persisted` is
    // `undefined`. A naive `{ ...current, ...sanitisePersisted(persisted) }` merge clobbers
    // `current.settings` (en/light, read from localStorage/matchMedia at store creation) with
    // sanitize's static fallback (he/dark) — a real flash-to-default bug this guards against.
    const merged = mergePersisted(undefined, current);
    expect(merged.settings).toEqual({ locale: 'en', theme: 'light' });
  });

  it('adopts the persisted settings once something real has actually been saved', () => {
    const merged = mergePersisted({ settings: { locale: 'he', theme: 'dark' } }, current);
    expect(merged.settings).toEqual({ locale: 'he', theme: 'dark' });
  });

  it('still adopts sanitised non-settings fields even when nothing is persisted (both are already-empty, so this is a no-op either way)', () => {
    const merged = mergePersisted(undefined, current);
    expect(merged.lessonsCompleted).toEqual({});
    expect(merged.attempts).toEqual([]);
  });

  it('restores real progress once it has been persisted', () => {
    const merged = mergePersisted(
      { settings: { locale: 'he', theme: 'dark' }, lessonsCompleted: { 'area-under-curve': 1 } },
      current,
    );
    expect(merged.lessonsCompleted).toEqual({ 'area-under-curve': 1 });
  });

  it('keeps a visit that happened before the saved snapshot was merged', () => {
    const started: PersistedProgress = {
      ...current,
      lastVisited: 'ionic-bond',
      lessonsCompleted: { 'ionic-bond': 2 },
      attempts: [{ lessonId: 'ionic-bond', questionId: 'q1', correct: true, at: 3 }],
    };
    const merged = mergePersisted(undefined, started);
    expect(merged.lastVisited).toBe('ionic-bond');
    expect(merged.lessonsCompleted).toEqual({ 'ionic-bond': 2 });
    expect(merged.attempts).toEqual(started.attempts);
    expect(merged.settings).toEqual({ locale: 'en', theme: 'light' });
  });

  it('keeps the lesson just opened when the saved snapshot names an older one', () => {
    const merged = mergePersisted(
      { lastVisited: 'ionic-bond', lessonsCompleted: { 'ionic-bond': 1 } },
      { ...current, lastVisited: 'covalent-bond' },
    );
    expect(merged.lastVisited).toBe('covalent-bond');
    expect(merged.lessonsCompleted).toEqual({ 'ionic-bond': 1 });
  });
});
