import { beforeEach, describe, expect, it } from 'vitest';
import { mergePersisted, sanitisePersisted, useProgress } from '../store';

function reset() {
  useProgress.setState({
    hydrated: true,
    storageError: false,
    settings: { locale: 'he', theme: 'dark' },
    lessonsCompleted: {},
    lastVisited: null,
    attempts: [],
    achievements: {},
  });
}

describe('useProgress store', () => {
  beforeEach(reset);

  it('completeLesson records a timestamp, sets lastVisited, and unlocks first-lesson once', () => {
    useProgress.getState().completeLesson('position-vs-time');
    const s = useProgress.getState();
    expect(s.lessonsCompleted['position-vs-time']).toBeGreaterThan(0);
    expect(s.lastVisited).toBe('position-vs-time');
    expect(s.achievements['first-lesson']).toBeGreaterThan(0);
  });

  it('completeLesson is idempotent — a repeat call never resets the original timestamp', () => {
    useProgress.getState().completeLesson('position-vs-time');
    const first = useProgress.getState().lessonsCompleted['position-vs-time'];
    useProgress.getState().completeLesson('position-vs-time');
    expect(useProgress.getState().lessonsCompleted['position-vs-time']).toBe(first);
  });

  it('completing a second lesson never changes the first-lesson achievement timestamp', () => {
    useProgress.getState().completeLesson('position-vs-time');
    const firstUnlockedAt = useProgress.getState().achievements['first-lesson'];
    useProgress.getState().completeLesson('velocity-slope');
    expect(useProgress.getState().achievements['first-lesson']).toBe(firstUnlockedAt);
    expect(Object.keys(useProgress.getState().lessonsCompleted)).toHaveLength(2);
  });

  it('visitLesson sets lastVisited without marking the lesson complete', () => {
    useProgress.getState().visitLesson('acceleration-area');
    const s = useProgress.getState();
    expect(s.lastVisited).toBe('acceleration-area');
    expect(s.lessonsCompleted['acceleration-area']).toBeUndefined();
  });

  it('recordAttempt appends attempts and unlocks ten-correct at the 10th correct answer', () => {
    for (let i = 0; i < 9; i++) {
      useProgress.getState().recordAttempt({ lessonId: 'position-vs-time', questionId: `q${i}`, correct: true, at: Date.now() });
    }
    expect(useProgress.getState().achievements['ten-correct']).toBeUndefined();
    useProgress.getState().recordAttempt({ lessonId: 'position-vs-time', questionId: 'q9', correct: true, at: Date.now() });
    expect(useProgress.getState().achievements['ten-correct']).toBeGreaterThan(0);
    expect(useProgress.getState().attempts).toHaveLength(10);
  });

  it('recordAttempt counts only correct answers toward ten-correct', () => {
    for (let i = 0; i < 15; i++) {
      useProgress.getState().recordAttempt({ lessonId: 'velocity-slope', questionId: `q${i}`, correct: i % 2 === 0, at: Date.now() });
    }
    // 8 correct (even indices 0,2,...,14) out of 15 — below the threshold
    expect(useProgress.getState().achievements['ten-correct']).toBeUndefined();
  });

  it('unlock is idempotent and never overwrites an existing timestamp', () => {
    useProgress.getState().unlock('kinematics-complete');
    const at = useProgress.getState().achievements['kinematics-complete'];
    useProgress.getState().unlock('kinematics-complete');
    expect(useProgress.getState().achievements['kinematics-complete']).toBe(at);
  });

  it('resetProgress clears lessons, attempts and achievements but keeps settings', () => {
    useProgress.getState().completeLesson('position-vs-time');
    useProgress.getState().recordAttempt({ lessonId: 'position-vs-time', questionId: 'q1', correct: true, at: Date.now() });
    useProgress.getState().setLocale('en');
    useProgress.getState().resetProgress();
    const s = useProgress.getState();
    expect(s.lessonsCompleted).toEqual({});
    expect(s.attempts).toEqual([]);
    expect(s.achievements).toEqual({});
    expect(s.lastVisited).toBeNull();
    expect(s.settings.locale).toBe('en');
  });

  it('setLocale and setTheme update settings without touching progress', () => {
    useProgress.getState().completeLesson('position-vs-time');
    useProgress.getState().setLocale('en');
    useProgress.getState().setTheme('light');
    const s = useProgress.getState();
    expect(s.settings).toEqual({ locale: 'en', theme: 'light' });
    expect(s.lessonsCompleted['position-vs-time']).toBeGreaterThan(0);
  });
});

describe('sanitisePersisted', () => {
  it('falls back to safe defaults for a completely malformed record', () => {
    const s = sanitisePersisted({ settings: 'nonsense', lessonsCompleted: 'nope', attempts: 'nope', achievements: 42, lastVisited: 7 });
    expect(s.settings?.locale === 'he' || s.settings?.locale === 'en').toBe(true);
    expect(s.settings?.theme === 'light' || s.settings?.theme === 'dark').toBe(true);
    expect(s.lessonsCompleted).toEqual({});
    expect(s.attempts).toEqual([]);
    expect(s.achievements).toEqual({});
    expect(s.lastVisited).toBeNull();
  });

  it('drops malformed attempts but keeps well-formed ones', () => {
    const s = sanitisePersisted({
      attempts: [
        { lessonId: 'a', questionId: 'q1', correct: true, at: 1 },
        { lessonId: 'a', correct: true, at: 2 }, // missing questionId
        'garbage',
      ],
    });
    expect(s.attempts).toEqual([{ lessonId: 'a', questionId: 'q1', correct: true, at: 1 }]);
  });

  it('passes through a well-formed record unchanged', () => {
    const input = {
      settings: { locale: 'en', theme: 'light' },
      lessonsCompleted: { 'position-vs-time': 1000 },
      lastVisited: 'position-vs-time',
      attempts: [{ lessonId: 'position-vs-time', questionId: 'q1', correct: true, at: 1000 }],
      achievements: { 'first-lesson': 1000 },
    };
    expect(sanitisePersisted(input)).toEqual(input);
  });
});

describe('mergePersisted', () => {
  const current = {
    ...useProgress.getState(),
    settings: { locale: 'en' as const, theme: 'light' as const },
    lessonsCompleted: {},
    lastVisited: null,
    attempts: [],
    achievements: {},
  };

  it('keeps a visit that happened before the saved snapshot was merged', () => {
    const started = {
      ...current,
      lastVisited: 'position-vs-time',
      lessonsCompleted: { 'position-vs-time': 2 },
      attempts: [{ lessonId: 'position-vs-time', questionId: 'q1', correct: true, at: 3 }],
      achievements: { 'first-lesson': 4 as number },
    };
    const merged = mergePersisted(undefined, started, {});
    expect(merged.lastVisited).toBe('position-vs-time');
    expect(merged.lessonsCompleted).toEqual({ 'position-vs-time': 2 });
    expect(merged.attempts).toEqual(started.attempts);
    expect(merged.achievements).toEqual({ 'first-lesson': 4 });
  });

  it('keeps the lesson just opened when the saved snapshot names an older one', () => {
    const merged = mergePersisted(
      { lastVisited: 'position-vs-time', lessonsCompleted: { 'position-vs-time': 1 } },
      { ...current, lastVisited: 'velocity-slope' },
      {},
    );
    expect(merged.lastVisited).toBe('velocity-slope');
    expect(merged.lessonsCompleted).toEqual({ 'position-vs-time': 1 });
  });

  it('lets a saved record replace the legacy seed, including a reset to empty', () => {
    const legacy = { 'position-vs-time': 1 };
    const merged = mergePersisted({ lessonsCompleted: {}, lastVisited: null }, { ...current, lessonsCompleted: legacy }, legacy);
    expect(merged.lessonsCompleted).toEqual({});
    expect(merged.lastVisited).toBeNull();
  });

  it('keeps a completion made this session on top of the saved record', () => {
    const legacy = { 'position-vs-time': 1 };
    const merged = mergePersisted(
      { lessonsCompleted: { 'position-vs-time': 9 }, lastVisited: 'position-vs-time' },
      { ...current, lessonsCompleted: { ...legacy, 'velocity-slope': 5 }, lastVisited: 'velocity-slope' },
      legacy,
    );
    expect(merged.lessonsCompleted).toEqual({ 'position-vs-time': 9, 'velocity-slope': 5 });
    expect(merged.lastVisited).toBe('velocity-slope');
  });
});
