/**
 * Client-side reconstruction of WorldSnapshot from shared full/diff + playerView.
 */

import type { FromWorker, WorldSnapshot } from '../shared/types';
import {
  applySharedDiff,
  mergeSnapshot,
  type PlayerView,
  type SharedSnapshot,
} from './snapshotCodec';
import {
  isPlayerViewMessage,
  isSnapshotDiffMessage,
  isSnapshotFullMessage,
  type ServerToClient,
} from './sessionProtocol';

export interface SnapshotApplierState {
  shared: SharedSnapshot | null;
  view: PlayerView | null;
  seq: number;
  /**
   * Set when a diff could not be applied (sequence gap, or a diff arrived with
   * no baseline). The transport should ask the server for a full snapshot.
   * Cleared when a full snapshot arrives.
   */
  needsResync: boolean;
}

/** Minimum gap between resync requests from one client. */
export const RESYNC_MIN_INTERVAL_MS = 2_000;

export function createApplierState(): SnapshotApplierState {
  return { shared: null, view: null, seq: 0, needsResync: false };
}

/**
 * Feed a server message. Returns a reconstructed FromWorker snapshot when
 * both shared + playerView are available for the same (or latest) seq.
 */
export function applyServerSnapshotMessage(
  state: SnapshotApplierState,
  msg: ServerToClient,
): FromWorker | null {
  if (isSnapshotFullMessage(msg)) {
    state.shared = msg.shared;
    state.seq = msg.seq;
    state.needsResync = false;
    return emitIfReady(state);
  }
  if (isSnapshotDiffMessage(msg)) {
    if (!state.shared) {
      state.needsResync = true;
      return null;
    }
    // Diverged: this diff is relative to a baseline we do not hold. Drop it
    // and flag a resync so the transport requests a full snapshot.
    if (msg.baseSeq !== state.seq && msg.baseSeq !== 0) {
      state.needsResync = true;
      return null;
    }
    state.shared = applySharedDiff(state.shared, msg.diff);
    state.seq = msg.seq;
    return emitIfReady(state);
  }
  if (isPlayerViewMessage(msg)) {
    state.view = msg.view;
    // Prefer emitting against current shared even if seq slightly ahead
    return emitIfReady(state);
  }
  return null;
}

function emitIfReady(state: SnapshotApplierState): FromWorker | null {
  if (!state.shared || !state.view) return null;
  const snapshot: WorldSnapshot = mergeSnapshot(state.shared, state.view);
  return { t: 'snapshot', snapshot };
}

/**
 * Returns true when the caller should send a `resync` request now, and records
 * the attempt. Rate limited to one request per RESYNC_MIN_INTERVAL_MS; while
 * limited the flag stays set so a later message retries.
 */
export function takeResyncRequest(
  state: SnapshotApplierState,
  lastRequestAt: number,
  now: number,
): boolean {
  if (!state.needsResync) return false;
  if (lastRequestAt > 0 && now - lastRequestAt < RESYNC_MIN_INTERVAL_MS) return false;
  return true;
}
