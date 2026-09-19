export type Region = 'nordic_baltic' | 'western_europe_uk' | 'global';

const REGION_LOOKUP: Record<string, Region> = {
  // Nordic & Baltics
  finland: 'nordic_baltic',
  sweden: 'nordic_baltic',
  norway: 'nordic_baltic',
  denmark: 'nordic_baltic',
  iceland: 'nordic_baltic',
  estonia: 'nordic_baltic',
  latvia: 'nordic_baltic',
  lithuania: 'nordic_baltic',

  // Europe
  unitedkingdom: 'western_europe_uk',
  germany: 'western_europe_uk',
  france: 'western_europe_uk',
  netherlands: 'western_europe_uk',
  belgium: 'western_europe_uk',
  luxembourg: 'western_europe_uk',
  ireland: 'western_europe_uk',
  switzerland: 'western_europe_uk',
  austria: 'western_europe_uk',
};

export function resolveRegion(countryRaw?: string): Region {
  if (!countryRaw) return 'global';
  const clean = countryRaw.trim().toLowerCase().replace(/[^a-z]/g, '');
  return REGION_LOOKUP[clean] || 'global';
}

export function normalizeStage(stageRaw?: string): string {
  if (!stageRaw) return 'unknown';
  const clean = stageRaw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('preseed') || clean.includes('idea')) return 'pre_seed';
  if (clean.includes('seed')) return 'seed';
  if (clean.includes('seriesa') || clean.includes('rounda')) return 'series_a';
  if (clean.includes('seriesb') || clean.includes('growth')) return 'series_b_plus';
  return clean;
}