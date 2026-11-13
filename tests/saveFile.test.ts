import { gzipSync, strToU8 } from 'fflate';
import { describe, expect, it } from 'vitest';
import {
  decodeSaveFile,
  encodeSaveFile,
  importedSlotName,
  readSaveHeader,
  saveFileName,
} from '../src/saves/saveFile';

const payload = gzipSync(strToU8(JSON.stringify({
  version: 1,
  world: { day: 42, playerNation: 3, scenarioId: 'x', startDate: { year: 1830, month: 1, day: 1 } },
})));

describe('save file envelope', () => {
  it('round-trips the payload bytes', () => {
    expect(decodeSaveFile(encodeSaveFile(payload))).toEqual(payload);
  });

  it('rejects foreign files', () => {
    expect(() => decodeSaveFile(strToU8('hello world, not a save'))).toThrow(/not a Grand Century save/);
    expect(() => decodeSaveFile(payload)).toThrow(/not a Grand Century save/);
    expect(() => decodeSaveFile(new Uint8Array())).toThrow(/not a Grand Century save/);
  });

  it('rejects a header with a non-gzip body', () => {
    expect(() => decodeSaveFile(encodeSaveFile(strToU8('plain text body')))).toThrow(/damaged/);
  });

  it('reads slot metadata from a payload', () => {
    expect(readSaveHeader(payload)).toMatchObject({ day: 42, playerNation: 3, scenarioId: 'x' });
  });

  it('rejects payloads that are not saves', () => {
    expect(() => readSaveHeader(gzipSync(strToU8('{"a":1}')))).toThrow(/damaged/);
    expect(() => readSaveHeader(strToU8('garbage'))).toThrow(/damaged/);
  });

  it('builds safe file and slot names', () => {
    expect(saveFileName('slot 1/../x')).toBe('slot-1-..-x.gcsave');
    expect(saveFileName('///')).toBe('save.gcsave');
    expect(importedSlotName('C:\\Users\\me\\My Game.gcsave')).toBe('imported-My Game');
    expect(importedSlotName('.gcsave')).toBe('imported-save');
  });
});
