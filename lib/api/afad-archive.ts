import axios from 'axios';
import { Earthquake } from '@/types/earthquake';

export async function getAFADArchive(date: string, date_end?: string, limit: number = 100, skip: number = 0): Promise<Earthquake[]> {
  try {
    const params: any = {
      date,
      limit,
      skip,
    };

    if (date_end) {
      params.date_end = date_end;
    }

    const response = await axios.get('https://api.orhanaydogdu.com.tr/deprem/afad/archive', {
      params,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = response.data;
    const earthquakes: Earthquake[] = [];

    if (data && data.status && data.result && Array.isArray(data.result)) {
      data.result.forEach((item: any) => {
        if (item.geojson && item.geojson.coordinates && item.mag !== undefined) {
          const [longitude, latitude] = item.geojson.coordinates;

          let date: Date;
          if (item.created_at) {
            date = new Date(item.created_at * 1000);
          } else if (item.date_time) {
            date = new Date(item.date_time);
          } else {
            date = new Date();
          }

          if (isNaN(date.getTime())) {
            date = new Date();
          }

          const timestamp = date.getTime();

          earthquakes.push({
            id: `afad-${item.earthquake_id || Date.now()}-${Math.random()}`,
            date: date.toISOString().split('T')[0],
            time: date.toTimeString().split(' ')[0].slice(0, 8),
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            depth: item.depth ? parseFloat(item.depth) : 0,
            magnitude: parseFloat(item.mag),
            location: item.title || 'Konum belirtilmemiş',
            source: 'afad',
            timestamp,
          });
        }
      });
    }

    return earthquakes;
  } catch {
    return [];
  }
}