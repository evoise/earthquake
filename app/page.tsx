'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Earthquake } from '@/types/earthquake';
import EarthquakeMap from '@/components/EarthquakeMap';
import EarthquakeList from '@/components/EarthquakeList';
import PageLoader from '@/components/PageLoader';
import { Button } from '@/components/ui/button';
import { X, List } from 'lucide-react';
import { Transition } from '@headlessui/react';
import Sidebar from '@/components/Sidebar';

interface Filters {
  dateRange: string;
  startDate?: string;
  endDate?: string;
  minMagnitude: string;
  maxMagnitude: string;
  minDepth: string;
  maxDepth: string;
  sources: string[];
  showTectonicPlates: boolean;
  showTurkeyFaults: boolean;
  showWaveAnimation: boolean;
  showCities: boolean;
}

interface LoadingStatus {
  kandilli: 'loading' | 'loaded' | 'error';
  afad: 'loading' | 'loaded' | 'error';
}

export default function Home() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({
    kandilli: 'loading',
    afad: 'loading',
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const loadSettingsFromStorage = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('earthquake-settings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
    }
    return null;
  };

  const saveSettingsToStorage = (settings: any) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('earthquake-settings', JSON.stringify(settings));
    } catch {
    }
  };

  const storedSettings = loadSettingsFromStorage();
  
  const [isListOpen, setIsListOpen] = useState(storedSettings?.isListOpen ?? true);
  const [mapStyle, setMapStyle] = useState<'light' | 'satellite' | 'terrain'>(storedSettings?.mapStyle ?? 'light');
  const [markerSizeMultiplier, setMarkerSizeMultiplier] = useState<number>(storedSettings?.markerSizeMultiplier ?? 1.0);
  const [showLegend, setShowLegend] = useState<boolean>(storedSettings?.showLegend ?? true);
  const [filters, setFilters] = useState<Filters>({
    dateRange: 'today',
    minMagnitude: '',
    maxMagnitude: '',
    minDepth: '',
    maxDepth: '',
    sources: ['kandilli', 'afad'],
    showTectonicPlates: storedSettings?.showTectonicPlates ?? true,
    showTurkeyFaults: storedSettings?.showTurkeyFaults ?? true,
    showWaveAnimation: storedSettings?.showWaveAnimation ?? true,
    showCities: storedSettings?.showCities ?? true,
  });

  useEffect(() => {
    saveSettingsToStorage({
      isListOpen,
      mapStyle,
      markerSizeMultiplier,
      showLegend,
      showTectonicPlates: filters.showTectonicPlates,
      showTurkeyFaults: filters.showTurkeyFaults,
      showWaveAnimation: filters.showWaveAnimation,
      showCities: filters.showCities,
    });
  }, [isListOpen, mapStyle, markerSizeMultiplier, showLegend, filters.showTectonicPlates, filters.showTurkeyFaults, filters.showWaveAnimation, filters.showCities]);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchEarthquakes = useCallback(async () => {
    try {
      let date: string | undefined = undefined;
      let date_end: string | undefined = undefined;
      
      if (filters.dateRange === 'custom') {
        if (!filters.startDate || !filters.endDate) {
          return;
        }
        date = filters.startDate;
        date_end = filters.endDate;
      } else {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        date_end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        
        const startDate = new Date(today);
        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'yesterday':
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
          case '3days':
            startDate.setDate(startDate.getDate() - 3);
            startDate.setHours(0, 0, 0, 0);
            break;
          case '7days':
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
          case '14days':
            startDate.setDate(startDate.getDate() - 14);
            startDate.setHours(0, 0, 0, 0);
            break;
          case '30days':
            startDate.setDate(startDate.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            break;
          case '1hour':
            startDate.setHours(startDate.getHours() - 1);
            break;
          case '6hours':
            startDate.setHours(startDate.getHours() - 6);
            break;
          case '24hours':
            startDate.setDate(startDate.getDate() - 1);
            break;
        }
        if (filters.dateRange !== 'today' && filters.dateRange !== 'yesterday' && 
            filters.dateRange !== '3days' && filters.dateRange !== '7days' && 
            filters.dateRange !== '14days' && filters.dateRange !== '30days') {
          if (filters.dateRange !== '1hour' && filters.dateRange !== '6hours' && filters.dateRange !== '24hours') {
            startDate.setHours(0, 0, 0, 0);
          }
        }
        date = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      }
      
      if (!date) {
        const today = new Date();
        date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
      
      setLoading(true);
      
      const url = `/api/earthquakes?date=${date}${date_end ? `&date_end=${date_end}` : ''}`;
      
      setLoadingStatus({
        kandilli: 'loading',
        afad: 'loading',
      });
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      
      if (data.earthquakes) {
        setEarthquakes(data.earthquakes);
        setLastUpdate(new Date());
      }
      
      if (data.status) {
        setLoadingStatus(data.status);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchEarthquakes();
    
    const interval = setInterval(fetchEarthquakes, 60000);
    
    return () => clearInterval(interval);
  }, [fetchEarthquakes]);

  const filteredEarthquakes = useMemo(() => {
    let filtered = [...earthquakes];

    if (filters.minMagnitude) {
      const min = parseFloat(filters.minMagnitude);
      if (!isNaN(min)) {
        filtered = filtered.filter((eq) => eq.magnitude >= min);
      }
    }
    if (filters.maxMagnitude) {
      const max = parseFloat(filters.maxMagnitude);
      if (!isNaN(max)) {
        filtered = filtered.filter((eq) => eq.magnitude <= max);
      }
    }

    if (filters.minDepth) {
      const min = parseFloat(filters.minDepth);
      if (!isNaN(min)) {
        filtered = filtered.filter((eq) => eq.depth >= min);
      }
    }
    if (filters.maxDepth) {
      const max = parseFloat(filters.maxDepth);
      if (!isNaN(max)) {
        filtered = filtered.filter((eq) => eq.depth <= max);
      }
    }

    if (filters.sources.length > 0) {
      filtered = filtered.filter((eq) => filters.sources.includes(eq.source));
    }

    return filtered;
  }, [earthquakes, filters]);

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col relative">
      {loading && <PageLoader />}

      <main className="flex-1 w-full relative overflow-hidden">
        <Sidebar
          mapStyle={mapStyle}
          onMapStyleChange={setMapStyle}
          markerSizeMultiplier={markerSizeMultiplier}
          onMarkerSizeMultiplierChange={setMarkerSizeMultiplier}
          showTectonicPlates={filters.showTectonicPlates}
          onShowTectonicPlatesChange={(show) => setFilters({ ...filters, showTectonicPlates: show })}
          showTurkeyFaults={filters.showTurkeyFaults}
          onShowTurkeyFaultsChange={(show) => setFilters({ ...filters, showTurkeyFaults: show })}
          showCities={filters.showCities}
          onShowCitiesChange={(show) => setFilters({ ...filters, showCities: show })}
          showWaveAnimation={filters.showWaveAnimation}
          onShowWaveAnimationChange={(show) => setFilters({ ...filters, showWaveAnimation: show })}
          showLegend={showLegend}
          onShowLegendChange={setShowLegend}
          totalMarkers={filteredEarthquakes.length}
          visibleMarkers={filteredEarthquakes.length}
          onResetZoom={() => {}}
          filters={{
            dateRange: filters.dateRange,
            startDate: filters.startDate,
            endDate: filters.endDate,
            minMagnitude: filters.minMagnitude,
            maxMagnitude: filters.maxMagnitude,
            minDepth: filters.minDepth,
            maxDepth: filters.maxDepth,
            sources: filters.sources,
          }}
          onFiltersChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
          onRefresh={fetchEarthquakes}
          loading={loading}
          earthquakes={earthquakes}
          filteredEarthquakes={filteredEarthquakes}
          lastUpdate={lastUpdate}
          onListToggle={isMobile ? () => setViewMode('list') : undefined}
          isMobile={isMobile}
        />
        
        <div className="flex h-full w-full">
          {!isMounted || !isMobile ? (
            <>
              <div className="flex-1 h-full relative">
                <EarthquakeMap earthquakes={filteredEarthquakes} showTectonicPlates={filters.showTectonicPlates} showTurkeyFaults={filters.showTurkeyFaults} showWaveAnimation={filters.showWaveAnimation} showCities={filters.showCities} mapStyle={mapStyle} markerSizeMultiplier={markerSizeMultiplier} showLegend={showLegend} />
                {!isListOpen && (
                  <div className="absolute top-4 right-4 z-[1000]">
                    <Button
                      variant="default"
                      size="icon"
                      onClick={() => setIsListOpen(true)}
                      className="bg-white hover:bg-gray-100 text-gray-900 shadow-lg border border-gray-200"
                      title="Deprem Listesini Aç"
                    >
                      <List className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
              <Transition
                show={isListOpen}
                enter="transition-transform duration-300 ease-out"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transition-transform duration-300 ease-in"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 h-auto max-h-[90vh] w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 z-[100] flex flex-col"
              >
                <div className="flex flex-col rounded-3xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 pt-4 pb-2">
                    <h2 className="text-lg font-semibold text-gray-900">Deprem Listesi</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsListOpen(false)}
                      className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                      title="Listeyi Kapat"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-6 bg-white space-y-4">
                    <EarthquakeList 
                      earthquakes={filteredEarthquakes} 
                      totalCount={filteredEarthquakes.length}
                      lastUpdate={lastUpdate}
                    />
                  </div>
                </div>
              </Transition>
            </>
          ) : (
            <>
              <div className="flex-1 h-full relative w-full">
                <EarthquakeMap earthquakes={filteredEarthquakes} showTectonicPlates={filters.showTectonicPlates} showTurkeyFaults={filters.showTurkeyFaults} showWaveAnimation={filters.showWaveAnimation} showCities={filters.showCities} mapStyle={mapStyle} markerSizeMultiplier={markerSizeMultiplier} showLegend={showLegend} />
              </div>
              <Transition
                show={viewMode === 'list'}
                enter="transition ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                className="fixed inset-0 z-[1000] pointer-events-none"
              >
                <div 
                  className="absolute inset-0 bg-black bg-opacity-10 pointer-events-auto"
                  onClick={() => setViewMode('map')}
                />
              </Transition>
              <Transition
                show={viewMode === 'list'}
                enter="transition ease-out duration-300 transform"
                enterFrom="opacity-0 -translate-x-full"
                enterTo="opacity-100 translate-x-0"
                leave="transition ease-in duration-200 transform"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 -translate-x-full"
                className="fixed left-4 top-1/2 transform -translate-y-1/2 h-[90vh] w-[calc(100%-2rem)] max-w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 z-[1001] flex flex-col pointer-events-auto"
              >
                <div className="flex flex-col rounded-3xl overflow-hidden h-full">
                  <div className="flex items-center justify-end p-3 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode('map')}
                      className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 bg-white min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <EarthquakeList 
                      earthquakes={filteredEarthquakes} 
                      totalCount={filteredEarthquakes.length}
                      lastUpdate={lastUpdate}
                    />
                  </div>
                </div>
              </Transition>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
