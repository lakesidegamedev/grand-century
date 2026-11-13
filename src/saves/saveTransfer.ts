import { readSaveSlot, writeSaveSlot } from '../worker/saveSlots';
import {
  decodeSaveFile,
  encodeSaveFile,
  importedSlotName,
  readSaveHeader,
  saveFileName,
  SAVE_FILE_EXTENSION,
} from './saveFile';
import { exportSaveFileDesktop, importSaveFileDesktop, isDesktopApp } from '../desktop/bridge';

function downloadBlob(bytes: Uint8Array, name: string): void {
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: 'application/octet-stream' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Exports a slot to a .gcsave file: a save dialog on desktop, a download on the web. */
export async function exportSlotToFile(slot: string): Promise<string> {
  const payload = await readSaveSlot(slot);
  if (!payload) throw new Error(`Slot ${slot} has no save data.`);
  const file = encodeSaveFile(payload);
  const name = saveFileName(slot);
  if (isDesktopApp()) {
    const saved = await exportSaveFileDesktop(file, name);
    return saved ? 'Saved to the file you chose.' : 'Export cancelled.';
  }
  downloadBlob(file, name);
  return `Downloaded ${name}.`;
}

/** Desktop only: pick a .gcsave file and store it as a slot. Returns the slot name, or null if cancelled. */
export async function importSlotFromFile(): Promise<{ slot: string } | null> {
  const picked = await importSaveFileDesktop();
  if (!picked) return null;
  const payload = decodeSaveFile(picked.bytes);
  const header = readSaveHeader(payload);
  const slot = importedSlotName(picked.name);
  await writeSaveSlot(slot, payload, header.day, header.playerNation, header.scenarioId, header.startDate);
  return { slot };
}

export const SAVE_FILE_HINT = `.${SAVE_FILE_EXTENSION}`;
