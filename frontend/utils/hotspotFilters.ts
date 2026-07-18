/**
 * Shared hotspot/complaint category filter utilities.
 * Single source of truth for all pollution type matching across the app.
 */

export type PollutionFilterType = 'all' | 'air' | 'water' | 'land' | 'noise';

/** Comprehensive keyword sets for each pollution type. */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  air: ['air', 'aqi', 'smoke', 'smog', 'dust', 'emission', 'fume', 'gas', 'odour', 'odor', 'haze'],
  water: ['water', 'sewage', 'drain', 'drainage', 'flood', 'effluent', 'river', 'lake', 'pond', 'canal', 'sewer'],
  land: [
    'land', 'waste', 'garbage', 'trash', 'dump', 'dumping', 'solid', 'litter',
    'debris', 'rubbish', 'refuse', 'scrap', 'junk', 'soil', 'ground', 'compost',
    'plastic', 'sanitation', 'msw', 'management',
  ],
  noise: ['noise', 'sound', 'acoustic', 'loud', 'horn', 'blasting'],
};

/** Returns true if a category name matches the selected pollution filter type. */
export function matchesCategoryFilter(
  categoryName: string | null | undefined,
  filter: string
): boolean {
  if (!filter || filter === 'all') return true;
  const cat = (categoryName || '').toLowerCase();
  const keywords = CATEGORY_KEYWORDS[filter.toLowerCase()] || [];
  return keywords.some((kw) => cat.includes(kw));
}

/** Filters complaint-like objects by pollution type via category_name / dominant_category / dominantType. */
export function filterComplaintsByPollutionType<
  T extends { category_name?: string; dominant_category?: string; dominantType?: string }
>(items: T[], filter: string): T[] {
  if (!filter || filter === 'all') return items;
  return items.filter((item) => {
    const cat = item.category_name || item.dominant_category || item.dominantType || '';
    return matchesCategoryFilter(cat, filter);
  });
}

/**
 * Filters hotspot clusters: keeps those where dominant category OR
 * at least one complaint within them matches the filter.
 * Attaches filteredCount reflecting only matching complaints.
 */
export function filterHotspotsForDisplay<
  T extends {
    dominantType?: string;
    dominant_category?: string;
    complaints?: Array<{ category_name?: string; dominant_category?: string }>;
    count?: number;
  }
>(hotspots: T[], filter: string): (T & { filteredCount: number })[] {
  return hotspots
    .map((h) => {
      const complaints = h.complaints || [];
      const matchingComplaints = filterComplaintsByPollutionType(complaints, filter);
      const domType = h.dominantType || h.dominant_category || '';
      const domMatches = matchesCategoryFilter(domType, filter);

      const filteredCount =
        filter === 'all' ? (h.count || complaints.length || 1) : matchingComplaints.length;

      // Include hotspot if dominant type matches OR at least one report matches
      const shouldInclude = filter === 'all' || domMatches || matchingComplaints.length > 0;

      return { ...h, filteredCount, _shouldInclude: shouldInclude };
    })
    .filter((h) => h._shouldInclude);
}

/** Filters single report points by category_name / dominant_category. */
export function filterSinglesByPollutionType<
  T extends { category_name?: string; dominant_category?: string }
>(singles: T[], filter: string): T[] {
  return filterComplaintsByPollutionType(singles, filter);
}
