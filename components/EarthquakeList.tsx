'use client';

import { useMemo, useState } from 'react';
import { Earthquake } from '@/types/earthquake';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, ArrowUpDown, List, BarChart3 } from 'lucide-react';

interface EarthquakeListProps {
  earthquakes: Earthquake[];
  totalCount?: number;
  lastUpdate?: Date | null;
}

function getMagnitudeColor(magnitude: number): string {
  if (magnitude >= 7) return 'bg-red-600 text-white';
  if (magnitude >= 6) return 'bg-orange-600 text-white';
  if (magnitude >= 5) return 'bg-amber-500 text-white';
  if (magnitude >= 4) return 'bg-yellow-500 text-white';
  if (magnitude >= 3) return 'bg-lime-500 text-white';
  return 'bg-green-500 text-white';
}

function getSortLabel(sortBy: string): string {
  switch (sortBy) {
    case 'magnitude-desc':
      return 'Büyüklük (Yüksek → Düşük)';
    case 'magnitude-asc':
      return 'Büyüklük (Düşük → Yüksek)';
    case 'date-desc':
      return 'Tarih (Yeni → Eski)';
    case 'date-asc':
      return 'Tarih (Eski → Yeni)';
    default:
      return 'Sıralama seçin';
  }
}

export default function EarthquakeList({ earthquakes, totalCount = 0, lastUpdate }: EarthquakeListProps) {
  const [sortBy, setSortBy] = useState<'magnitude-desc' | 'magnitude-asc' | 'date-desc' | 'date-asc'>('magnitude-desc');

  const statistics = useMemo(() => {
    if (!earthquakes || earthquakes.length === 0) {
      return {
        total: 0,
        maxMagnitude: 0,
        avgMagnitude: 0,
        maxDepth: 0,
        todayCount: 0,
      };
    }

    const magnitudes = earthquakes.map((eq) => eq.magnitude);
    const depths = earthquakes.map((eq) => eq.depth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = earthquakes.filter((eq) => {
      const eqDate = new Date(eq.date);
      eqDate.setHours(0, 0, 0, 0);
      return eqDate.getTime() === today.getTime();
    }).length;

    return {
      total: earthquakes.length,
      maxMagnitude: Math.max(...magnitudes),
      avgMagnitude: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
      maxDepth: Math.max(...depths),
      todayCount,
    };
  }, [earthquakes]);

  const sortedEarthquakes = useMemo(() => {
    const sorted = [...earthquakes];

    switch (sortBy) {
      case 'magnitude-desc':
        return sorted.sort((a, b) => b.magnitude - a.magnitude);
      case 'magnitude-asc':
        return sorted.sort((a, b) => a.magnitude - b.magnitude);
      case 'date-desc':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.date + ' ' + a.time).getTime();
          const dateB = new Date(b.date + ' ' + b.time).getTime();
          return dateB - dateA;
        });
      case 'date-asc':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.date + ' ' + a.time).getTime();
          const dateB = new Date(b.date + ' ' + b.time).getTime();
          return dateA - dateB;
        });
      default:
        return sorted;
    }
  }, [earthquakes, sortBy]);

  if (earthquakes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <List className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm">Henüz deprem verisi bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-gray-200">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-700" />
            <CardTitle className="text-sm font-semibold text-gray-900">Özet İstatistikler</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Toplam</div>
              <div className="text-lg font-semibold text-gray-900">{statistics.total}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Bugün</div>
              <div className="text-lg font-semibold text-gray-900">{statistics.todayCount}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Max Büyüklük</div>
              <div className="text-lg font-semibold text-gray-900">
                {statistics.maxMagnitude > 0 ? statistics.maxMagnitude.toFixed(1) : '0.0'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Ortalama</div>
              <div className="text-lg font-semibold text-gray-900">
                {statistics.avgMagnitude > 0 ? statistics.avgMagnitude.toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
          {lastUpdate && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Son güncelleme: {format(lastUpdate, 'HH:mm:ss', { locale: tr })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="relative">
        <label className="text-xs font-semibold text-gray-900 mb-2 block">Sıralama</label>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'magnitude-desc' | 'magnitude-asc' | 'date-desc' | 'date-asc')}>
          <SelectTrigger className="w-full text-sm h-9 bg-white text-gray-900 border-gray-200 hover:bg-gray-50 cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white text-gray-900 z-[10000]" position="popper" sideOffset={4}>
            <SelectItem value="magnitude-desc" className="text-gray-900 cursor-pointer">
              Büyüklük (Yüksek → Düşük)
            </SelectItem>
            <SelectItem value="magnitude-asc" className="text-gray-900 cursor-pointer">
              Büyüklük (Düşük → Yüksek)
            </SelectItem>
            <SelectItem value="date-desc" className="text-gray-900 cursor-pointer">
              Tarih (Yeni → Eski)
            </SelectItem>
            <SelectItem value="date-asc" className="text-gray-900 cursor-pointer">
              Tarih (Eski → Yeni)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        {sortedEarthquakes.map((earthquake) => (
          <Card key={earthquake.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`${getMagnitudeColor(
                    earthquake.magnitude
                  )} font-semibold text-lg w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  {earthquake.magnitude.toFixed(1)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-foreground font-medium text-sm mb-2 truncate">
                    {earthquake.location}
                  </h3>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(earthquake.date), 'dd MMM yyyy', { locale: tr })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {earthquake.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {earthquake.latitude.toFixed(2)}, {earthquake.longitude.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ArrowUpDown className="h-3 w-3" />
                      {earthquake.depth.toFixed(1)} km
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
