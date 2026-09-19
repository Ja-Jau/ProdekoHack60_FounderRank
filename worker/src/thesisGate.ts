export type Region = 'nordic_baltic' | 'western_europe_uk' | 'global';

const REGION_LOOKUP: Record<string, Region> = {
  finland: 'nordic_baltic', sweden: 'nordic_baltic', norway: 'nordic_baltic',
  denmark: 'nordic_baltic', iceland: 'nordic_baltic', estonia: 'nordic_baltic',
  latvia: 'nordic_baltic', lithuania: 'nordic_baltic',
  unitedkingdom: 'western_europe_uk', germany: 'western_europe_uk', france: 'western_europe_uk',
  netherlands: 'western_europe_uk', belgium: 'western_europe_uk', luxembourg: 'western_europe_uk',
  ireland: 'western_europe_uk', switzerland: 'western_europe_uk', austria: 'western_europe_uk',
  unitedstates: 'us_na', us: 'us_na', usa: 'us_na', america: 'us_na',
  japan: 'global'
};

export function resolveRegion(countryRaw?: string): Region {
  if (!countryRaw) return 'global';
  const clean = countryRaw.trim().toLowerCase().replace(/[^a-z]/g, '');
  return REGION_LOOKUP[clean] || 'global';
}

export function normalizeStage(stageRaw?: string): string {
  if (!stageRaw) return 'unknown';
  
  // Strip out spaces, hyphens, and underscores for broader matching
  const clean = stageRaw.toLowerCase().replace(/[\s\-_]/g, '');
  
  if (clean.includes('preseed') || clean.includes('idea') || clean.includes('concept') || clean.includes('mvp')) return 'pre_seed';
  if (clean.includes('seed') || clean.includes('early')) return 'seed';
  if (clean.includes('seriesa') || clean.includes('rounda') || clean === 'a') return 'series_a';
  if (clean.includes('seriesb') || clean.includes('seriesc') || clean.includes('growth') || clean.includes('late') || clean === 'b') return 'series_b_plus';
  
  return clean;
}