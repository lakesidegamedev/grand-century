/**
 * Pure gating rules for the first-session coach, kept out of the component so
 * the "stay calm for the first minute" behaviour is unit tested.
 */

export type CoachGateInput = {
  /** An event modal is open and waiting on a choice. */
  eventModalOpen: boolean;
  /** Panel currently open, or null. */
  openPanel: string | null;
  /** Panels the current step wants the player to be in. */
  stepPanels: readonly string[];
};

/** The coach never covers an event modal, and never covers a panel the
 *  current step is not about. */
export function coachVisible(input: CoachGateInput): boolean {
  if (input.eventModalOpen) return false;
  if (input.openPanel !== null && !input.stepPanels.includes(input.openPanel)) return false;
  return true;
}

export type CoachStartInput = {
  /** True once the player has done anything: moved the clock, changed the
   *  map mode, or opened a panel. */
  playerActed: boolean;
  /** True when the player explicitly asked for the tutorial again. */
  replayRequested: boolean;
  seenBefore: boolean;
  showMainMenu: boolean;
};

/** The coach waits for the player to act before appearing on a fresh game. */
export function coachShouldStart(input: CoachStartInput): boolean {
  if (input.showMainMenu) return false;
  if (input.replayRequested) return true;
  return !input.seenBefore && input.playerActed;
}

/** "Completed." is only shown for steps that track a real player action. */
export function stepCompletedLabel(tracksAction: boolean, complete: boolean): string {
  return tracksAction && complete ? ' Done.' : '';
}
