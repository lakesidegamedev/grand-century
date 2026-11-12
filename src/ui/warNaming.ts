/** Resolve a nation id to a display name (fallback allowed). */
export type NationNameOf = (id: number) => string;

/**
 * Label one belligerent side: up to two names joined with " & ", then "+N"
 * for any remaining co-belligerents (matches Military panel war selector).
 */
export function sideLabel(
  ids: number[],
  nameOf: NationNameOf,
): string {
  if (ids.length === 0) return 'Unknown';
  const labels = ids.slice(0, 2).map((id) => nameOf(id));
  const head = labels.join(' & ');
  return ids.length > 2 ? `${head} +${ids.length - 2}` : head;
}

/** "Austria & Bavaria +1 vs Prussia" style summary for a war. */
export function warSidesLabel(
  attackers: number[],
  defenders: number[],
  nameOf: NationNameOf,
): string {
  return `${sideLabel(attackers, nameOf)} vs ${sideLabel(defenders, nameOf)}`;
}

/**
 * War-start toast copy. Nation names only, never raw tags:
 * "Austria & Bavaria declares war on Prussia +1."
 */
export function warDeclaredMessage(
  attackers: number[],
  defenders: number[],
  nameOf: NationNameOf,
): string {
  const attackerSide = sideLabel(attackers, nameOf);
  return `${attackerSide} declares war on ${sideLabel(defenders, nameOf)}.`;
}

/** Peace-settlement toast copy naming both sides. */
export function peaceSignedMessage(
  attackers: number[],
  defenders: number[],
  nameOf: NationNameOf,
): string {
  return `Peace signed: ${warSidesLabel(attackers, defenders, nameOf)}.`;
}
