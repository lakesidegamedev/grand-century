import type { GovernmentType } from './types';

/** Player-facing names for every government type. */
const GOVERNMENT_LABEL: Record<GovernmentType, string> = {
  absolute_monarchy: 'Absolute monarchy',
  constitutional_monarchy: 'Constitutional monarchy',
  hms_government: 'Parliamentary government',
  democracy: 'Democracy',
  presidential_dictatorship: 'Presidential dictatorship',
  proletarian_dictatorship: 'Proletarian dictatorship',
  fascist_dictatorship: 'Fascist dictatorship',
  uncivilized: 'Unrecognised state',
};

export function governmentLabel(government: string): string {
  const known = (GOVERNMENT_LABEL as Record<string, string>)[government];
  if (known) return known;
  const spaced = government.replaceAll('_', ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
