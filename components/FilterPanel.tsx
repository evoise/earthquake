'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X, BarChart3 } from 'lucide-react';
import { Transition } from '@headlessui/react';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    dateRange: string;
    startDate?: string;
    endDate?: string;
    minMagnitude: string;
    maxMagnitude: string;
    minDepth: string;
    maxDepth: string;
    sources: string[];
  };
  onFiltersChange: (filters: any) => void;
  onRefresh?: () => void;
  loading?: boolean;
  filteredEarthquakes?: any[];
}

export default function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onRefresh,
  loading,
  filteredEarthquakes = [],
}: FilterPanelProps) {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleSourceToggle = (source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    handleFilterChange('sources', newSources);
  };

  const statistics = useMemo(() => {
    if (!filteredEarthquakes || filteredEarthquakes.length === 0) {
      return {
        total: 0,
        avgMagnitude: 0,
        maxMagnitude: 0,
        maxDepth: 0,
      };
    }

    const magnitudes = filteredEarthquakes.map((eq) => eq.magnitude);
    const depths = filteredEarthquakes.map((eq) => eq.depth);

    return {
      total: filteredEarthquakes.length,
      avgMagnitude: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
      maxMagnitude: Math.max(...magnitudes),
      maxDepth: Math.max(...depths),
    };
  }, [filteredEarthquakes]);

  return (
    <Transition
      show={isOpen}
      enter="transition-transform duration-300 ease-out"
      enterFrom="-translate-x-full"
      enterTo="translate-x-0"
      leave="transition-transform duration-300 ease-in"
      leaveFrom="translate-x-0"
      leaveTo="-translate-x-full"
      className="absolute left-4 top-1/2 transform -translate-y-1/2 h-auto max-h-[90vh] w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 z-[100] flex flex-col"
    >
      <div className="flex flex-col rounded-3xl overflow-hidden">
        <div className="flex items-center justify-end p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 bg-white">
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-700" />
                <CardTitle className="text-sm font-semibold text-gray-900">Deprem İstatistikleri</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Toplam Deprem</div>
                  <div className="text-lg font-semibold text-gray-900">{statistics.total}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Ortalama Büyüklük</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {statistics.avgMagnitude > 0 ? statistics.avgMagnitude.toFixed(2) : '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Max Büyüklük</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {statistics.maxMagnitude > 0 ? statistics.maxMagnitude.toFixed(1) : '0.0'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Max Derinlik</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {statistics.maxDepth > 0 ? statistics.maxDepth.toFixed(1) : '0.0'} km
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div>
            <Label className="text-sm font-semibold text-gray-900 mb-3 block">
              Zaman Aralığı
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={filters.dateRange === 'today' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('dateRange', 'today')}
                className={`text-sm ${filters.dateRange === 'today' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                Bugün
              </Button>
              <Button
                type="button"
                variant={filters.dateRange === 'yesterday' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('dateRange', 'yesterday')}
                className={`text-sm ${filters.dateRange === 'yesterday' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                Dün
              </Button>
              <Button
                type="button"
                variant={filters.dateRange === '3days' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('dateRange', '3days')}
                className={`text-sm ${filters.dateRange === '3days' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                3 Gün
              </Button>
              <Button
                type="button"
                variant={filters.dateRange === '7days' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('dateRange', '7days')}
                className={`text-sm ${filters.dateRange === '7days' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                7 Gün
              </Button>
              <Button
                type="button"
                variant={filters.dateRange === '14days' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('dateRange', '14days')}
                className={`text-sm ${filters.dateRange === '14days' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                14 Gün
              </Button>
              <Button
                type="button"
                variant={filters.dateRange === '30days' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('dateRange', '30days')}
                className={`text-sm ${filters.dateRange === '30days' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                30 Gün
              </Button>
              <Button
                type="button"
                variant={filters.dateRange === 'custom' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('dateRange', 'custom')}
                className={`text-sm col-span-2 ${filters.dateRange === 'custom' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                Tarihler Arası
              </Button>
            </div>
          </div>

          {filters.dateRange === 'custom' && (
            <div className="space-y-2">
              <div>
                <Label className="text-sm text-gray-900">Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="mt-1 text-gray-900 bg-white border-gray-200"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-900">Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="mt-1 text-gray-900 bg-white border-gray-200"
                />
              </div>
            </div>
          )}

          <Separator />

          <div>
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">
              Maksimum Büyüklük
            </Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="12"
              placeholder="Tüm depremler (max 12)"
              value={filters.maxMagnitude}
              onChange={(e) => handleFilterChange('maxMagnitude', e.target.value)}
              className="w-full text-gray-900 bg-white border-gray-200"
            />
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">
              Maksimum Derinlik (km)
            </Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="Tüm derinlikler (max 100km)"
              value={filters.maxDepth}
              onChange={(e) => handleFilterChange('maxDepth', e.target.value)}
              className="w-full text-gray-900 bg-white border-gray-200"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900 mb-3 block">Veri Kaynağı</Label>

            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${filters.sources.includes('kandilli')
                    ? 'border-2 border-gray-900 bg-gray-50'
                    : 'border border-gray-200 bg-white hover:border-gray-300'
                  }`}
                onClick={() => handleSourceToggle('kandilli')}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="source-kandilli"
                      checked={filters.sources.includes('kandilli')}
                      onCheckedChange={() => handleSourceToggle('kandilli')}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label htmlFor="source-kandilli" className="text-sm font-medium text-gray-900 cursor-pointer">
                      Kandilli
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${filters.sources.includes('afad')
                    ? 'border-2 border-gray-900 bg-gray-50'
                    : 'border border-gray-200 bg-white hover:border-gray-300'
                  }`}
                onClick={() => handleSourceToggle('afad')}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="source-afad"
                      checked={filters.sources.includes('afad')}
                      onCheckedChange={() => handleSourceToggle('afad')}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label htmlFor="source-afad" className="text-sm font-medium text-gray-900 cursor-pointer">
                      AFAD
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {onRefresh && (
          <div className="px-6 pb-6">
            <Button
              variant="outline"
              className="w-full bg-white text-gray-900 hover:bg-gray-50 border-gray-200"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? 'Yükleniyor...' : 'Yenile'}
            </Button>
          </div>
        )}
      </div>
    </Transition>
  );
}

