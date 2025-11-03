'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Twitter, Github, Map, Filter, Activity } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import FilterPanel from './FilterPanel';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  mapStyle: 'light' | 'satellite' | 'terrain';
  onMapStyleChange: (style: 'light' | 'satellite' | 'terrain') => void;
  markerSizeMultiplier: number;
  onMarkerSizeMultiplierChange: (multiplier: number) => void;
  showTectonicPlates: boolean;
  onShowTectonicPlatesChange: (show: boolean) => void;
  showTurkeyFaults: boolean;
  onShowTurkeyFaultsChange: (show: boolean) => void;
  showCities: boolean;
  onShowCitiesChange: (show: boolean) => void;
  showWaveAnimation: boolean;
  onShowWaveAnimationChange: (show: boolean) => void;
  showLegend: boolean;
  onShowLegendChange: (show: boolean) => void;
  totalMarkers?: number;
  visibleMarkers?: number;
  onResetZoom?: () => void;
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
  earthquakes?: any[];
  filteredEarthquakes?: any[];
  lastUpdate?: Date | null;
  onListToggle?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({
  isOpen,
  onClose,
  onOpen,
  mapStyle,
  onMapStyleChange,
  markerSizeMultiplier,
  onMarkerSizeMultiplierChange,
  showTectonicPlates,
  onShowTectonicPlatesChange,
  showTurkeyFaults,
  onShowTurkeyFaultsChange,
  showCities,
  onShowCitiesChange,
  showWaveAnimation,
  onShowWaveAnimationChange,
  showLegend,
  onShowLegendChange,
  totalMarkers,
  visibleMarkers,
  onResetZoom,
  filters,
  onFiltersChange,
  onRefresh,
  loading,
  filteredEarthquakes,
  onListToggle,
  isMobile,
}: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <>
      <div className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-[100] flex flex-col gap-2 md:gap-3">
        <div className="flex flex-col gap-1.5 md:gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-1.5 md:p-2">
          <Button
            variant="default"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            className="h-9 w-9 md:h-10 md:w-10 bg-white hover:bg-gray-100 text-gray-900 shadow-sm"
            title="Ayarlar"
          >
            <Map className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={() => setIsFiltersOpen(true)}
            className="h-9 w-9 md:h-10 md:w-10 bg-white hover:bg-gray-100 text-gray-900 shadow-sm"
            title="Filtre"
          >
            <Filter className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          {isMobile && onListToggle && (
            <Button
              variant="default"
              size="icon"
              onClick={onListToggle}
              className="h-9 w-9 bg-white hover:bg-gray-100 text-gray-900 shadow-sm"
              title="Deprem Listesi"
            >
              <Activity className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <a
            href="https://x.com/autodeprem"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            aria-label="X (Twitter)"
            title="X (Twitter)"
          >
            <Twitter className="h-5 w-5" />
          </a>
          <a
            href="https://github.com/evoise/earthquake"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            aria-label="GitHub"
            title="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mapStyle={mapStyle}
        onMapStyleChange={onMapStyleChange}
        markerSizeMultiplier={markerSizeMultiplier}
        onMarkerSizeMultiplierChange={onMarkerSizeMultiplierChange}
        showTectonicPlates={showTectonicPlates}
        onShowTectonicPlatesChange={onShowTectonicPlatesChange}
        showTurkeyFaults={showTurkeyFaults}
        onShowTurkeyFaultsChange={onShowTurkeyFaultsChange}
        showCities={showCities}
        onShowCitiesChange={onShowCitiesChange}
        showWaveAnimation={showWaveAnimation}
        onShowWaveAnimationChange={onShowWaveAnimationChange}
        showLegend={showLegend}
        onShowLegendChange={onShowLegendChange}
        totalMarkers={totalMarkers}
        visibleMarkers={visibleMarkers}
        onResetZoom={onResetZoom}
      />

      <FilterPanel
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onFiltersChange={onFiltersChange}
        onRefresh={onRefresh}
        loading={loading}
        filteredEarthquakes={filteredEarthquakes}
      />
    </>
  );
}

