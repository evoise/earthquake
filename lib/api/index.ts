import { getAFADArchive } from './afad-archive';
import { getKandilliArchive } from './kandilli-archive';
import { Earthquake } from '@/types/earthquake';

const TURKEY_BOUNDS = {
  minLat: 35.5,
  maxLat: 42.0,
  minLon: 25.5,
  maxLon: 45.0,
};

function isInTurkeyBounds(latitude: number, longitude: number): boolean {
  return (
    latitude >= TURKEY_BOUNDS.minLat &&
    latitude <= TURKEY_BOUNDS.maxLat &&
    longitude >= TURKEY_BOUNDS.minLon &&
    longitude <= TURKEY_BOUNDS.maxLon
  );
}

export interface LoadingStatus {
  kandilli: 'loading' | 'loaded' | 'error';
  afad: 'loading' | 'loaded' | 'error';
}

async function fetchAllPages(
  fetchFn: (date: string, date_end: string | undefined, limit: number, skip: number) => Promise<Earthquake[]>,
  date: string,
  date_end: string | undefined,
  limit: number = 100
): Promise<Earthquake[]> {
  const allResults: Earthquake[] = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const results = await fetchFn(date, date_end, limit, skip);

      if (results.length === 0) {
        hasMore = false;
      } else {
        allResults.push(...results);

        if (results.length < limit) {
          hasMore = false;
        } else {
          skip += limit;
        }
      }
    } catch {
      hasMore = false;
    }
  }

  return allResults;
}

export async function getAllEarthquakes(
  date: string,
  date_end?: string,
  limit: number = 100,
  skip: number = 0,
  onProgress?: (status: LoadingStatus) => void
): Promise<{ earthquakes: Earthquake[]; status: LoadingStatus }> {
  const status: LoadingStatus = {
    kandilli: 'loading',
    afad: 'loading',
  };

  try {
    onProgress?.(status);
    const kandilliResult = await fetchAllPages(getKandilliArchive, date, date_end, limit);
    status.kandilli = 'loaded';
    onProgress?.(status);

    const afadResult = await fetchAllPages(getAFADArchive, date, date_end, limit);
    status.afad = 'loaded';
    onProgress?.(status);

    const allEarthquakes = [...kandilliResult, ...afadResult];

    const turkeyEarthquakes = allEarthquakes.filter((eq) =>
      isInTurkeyBounds(eq.latitude, eq.longitude)
    );

    const uniqueEarthquakes = removeDuplicates(turkeyEarthquakes);

    const sorted = uniqueEarthquakes.sort((a, b) => b.timestamp - a.timestamp);

    return {
      earthquakes: sorted,
      status,
    };
  } catch {
    if (status.kandilli === 'loading') status.kandilli = 'error';
    if (status.afad === 'loading') status.afad = 'error';
    onProgress?.(status);

    return {
      earthquakes: [],
      status,
    };
  }
}

function removeDuplicates(earthquakes: Earthquake[]): Earthquake[] {
  const seen = new Map<string, Earthquake>();

  for (const eq of earthquakes) {
    const key = `${Math.round(eq.latitude * 10)}_${Math.round(eq.longitude * 10)}_${Math.round(eq.timestamp / 1000 / 60)}`;

    if (!seen.has(key) || seen.get(key)!.magnitude < eq.magnitude) {
      seen.set(key, eq);
    }
  }

  return Array.from(seen.values());
}
