import { gunzipSync } from 'fflate';
import type { GameDate, ScenarioId } from '../shared/types';

/**
 * A .gcsave file is a short magic header followed by the exact compressed
 * bytes the save slots hold. Nothing else is stored, so the loader's own
 * checks (version, world fingerprint) still decide whether a save is usable.
 */
export const SAVE_FILE_MAGIC = new TextEncoder().encode('GCSAVE1\n');
export const SAVE_FILE_EXTENSION = 'gcsave';
/** Larger files are not Grand Century saves; refuse before decompressing. */
export const SAVE_FILE_MAX_BYTES = 256 * 1024 * 1024;

export interface SaveFileHeader {
  day: number;
  playerNation: number;
  scenarioId?: ScenarioId;
  startDate?: GameDate;
}

export function encodeSaveFile(payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(SAVE_FILE_MAGIC.length + payload.length);
  out.set(SAVE_FILE_MAGIC, 0);
  out.set(payload, SAVE_FILE_MAGIC.length);
  return out;
}

export function decodeSaveFile(file: Uint8Array): Uint8Array {
  if (file.length > SAVE_FILE_MAX_BYTES) throw new Error('This file is too large to be a Grand Century save.');
  if (file.length <= SAVE_FILE_MAGIC.length || !SAVE_FILE_MAGIC.every((byte, index) => file[index] === byte)) {
    throw new Error('This is not a Grand Century save file.');
  }
  const payload = file.slice(SAVE_FILE_MAGIC.length);
  // gzip magic bytes
  if (payload[0] !== 0x1f || payload[1] !== 0x8b) throw new Error('This save file is damaged.');
  return payload;
}

/** Reads the slot metadata out of a payload without building a world. */
export function readSaveHeader(payload: Uint8Array): SaveFileHeader {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(gunzipSync(payload)));
  } catch {
    throw new Error('This save file is damaged.');
  }
  const world = (parsed as { world?: Record<string, unknown> } | null)?.world;
  if (!world || typeof world !== 'object' || typeof world.day !== 'number' || typeof world.playerNation !== 'number') {
    throw new Error('This save file is damaged.');
  }
  return {
    day: world.day,
    playerNation: world.playerNation,
    scenarioId: world.scenarioId as ScenarioId | undefined,
    startDate: world.startDate as GameDate | undefined,
  };
}

export function saveFileName(slot: string): string {
  const safe = slot.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'save';
  return `${safe}.${SAVE_FILE_EXTENSION}`;
}

/** Slot name for an imported file: its base name, trimmed to a sane length. */
export function importedSlotName(fileName: string): string {
  const base = fileName.replace(/^.*[\\/]/, '').replace(new RegExp(`\\.${SAVE_FILE_EXTENSION}$`, 'i'), '');
  const safe = base.replace(/[^A-Za-z0-9._ -]+/g, '-').trim().slice(0, 40);
  return `imported-${safe || 'save'}`;
}
