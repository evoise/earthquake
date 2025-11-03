export interface Earthquake {
  id: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
  location: string;
  source: 'kandilli' | 'afad' | 'usgs' | 'emsc';
  timestamp: number;
}

export interface EarthquakeApiResponse {
  earthquakes: Earthquake[];
  lastUpdate: string;
}

