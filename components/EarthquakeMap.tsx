'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Earthquake } from '@/types/earthquake';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false
});

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
  showTectonicPlates?: boolean;
  showTurkeyFaults?: boolean;
  showWaveAnimation?: boolean;
  showCities?: boolean;
  mapStyle?: 'light' | 'satellite' | 'terrain';
  markerSizeMultiplier?: number;
  showLegend?: boolean;
}

export default function EarthquakeMap({ earthquakes, showTectonicPlates = true, showTurkeyFaults = true, showWaveAnimation = true, showCities = true, mapStyle = 'light', markerSizeMultiplier = 1.0, showLegend = true }: EarthquakeMapProps) {
  return <MapView earthquakes={earthquakes} showTectonicPlates={showTectonicPlates} showTurkeyFaults={showTurkeyFaults} showWaveAnimation={showWaveAnimation} showCities={showCities} mapStyle={mapStyle} markerSizeMultiplier={markerSizeMultiplier} showLegend={showLegend} />;
}
