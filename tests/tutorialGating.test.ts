import { describe, expect, it } from 'vitest';
import { coachShouldStart, coachVisible, stepCompletedLabel } from '../src/ui/tutorialGating';
import { governmentLabel } from '../src/shared/governmentLabel';

describe('coachVisible', () => {
  it('hides over an event modal', () => {
    expect(coachVisible({ eventModalOpen: true, openPanel: null, stepPanels: [] })).toBe(false);
  });
  it('hides over a panel the step is not about', () => {
    expect(coachVisible({ eventModalOpen: false, openPanel: 'budget', stepPanels: [] })).toBe(false);
    expect(coachVisible({ eventModalOpen: false, openPanel: 'budget', stepPanels: ['budget'] })).toBe(true);
  });
  it('shows on a clear map', () => {
    expect(coachVisible({ eventModalOpen: false, openPanel: null, stepPanels: ['budget'] })).toBe(true);
  });
});

describe('coachShouldStart', () => {
  const base = { playerActed: false, replayRequested: false, seenBefore: false, showMainMenu: false };
  it('waits for the player to act', () => {
    expect(coachShouldStart(base)).toBe(false);
    expect(coachShouldStart({ ...base, playerActed: true })).toBe(true);
  });
  it('never starts on the main menu or when already seen', () => {
    expect(coachShouldStart({ ...base, playerActed: true, showMainMenu: true })).toBe(false);
    expect(coachShouldStart({ ...base, playerActed: true, seenBefore: true })).toBe(false);
  });
  it('replay starts immediately', () => {
    expect(coachShouldStart({ ...base, replayRequested: true, seenBefore: true })).toBe(true);
  });
});

describe('stepCompletedLabel', () => {
  it('only labels steps that track an action', () => {
    expect(stepCompletedLabel(false, true)).toBe('');
    expect(stepCompletedLabel(true, false)).toBe('');
    expect(stepCompletedLabel(true, true)).toBe(' Done.');
  });
});

describe('governmentLabel', () => {
  it('reads every government as English', () => {
    expect(governmentLabel('hms_government')).toBe('Parliamentary government');
    expect(governmentLabel('absolute_monarchy')).toBe('Absolute monarchy');
    expect(governmentLabel('uncivilized')).toBe('Unrecognised state');
    expect(governmentLabel('some_new_kind')).toBe('Some new kind');
  });
});
