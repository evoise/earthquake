'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, useMapEvents } from 'react-leaflet';
import { Earthquake } from '@/types/earthquake';
import { Button } from '@/components/ui/button';
import { Ruler, X, MapPin, Loader2, BarChart2, Download, Camera, Maximize, Minimize, Layers, RotateCcw } from 'lucide-react';
import { Transition } from '@headlessui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, BarChart, Bar, PieChart, Pie, LineChart, Line, Legend } from 'recharts';

interface MapViewProps {
  earthquakes: Earthquake[];
  showTectonicPlates?: boolean;
  showTurkeyFaults?: boolean;
  showWaveAnimation?: boolean;
  showCities?: boolean;
  mapStyle?: 'light' | 'satellite' | 'terrain';
  markerSizeMultiplier?: number;
  showLegend?: boolean;
}

let L: any = null;

const iconCache = new Map<string, any>();

function filterByZoom(earthquakes: Earthquake[], zoom: number): Earthquake[] {
  if (zoom >= 8) {
    return earthquakes;
  } else if (zoom >= 7) {
    return earthquakes.filter((eq) => eq.magnitude >= 2.5);
  } else if (zoom >= 6) {
    return earthquakes.filter((eq) => eq.magnitude >= 3.0);
  } else if (zoom >= 5) {
    return earthquakes.filter((eq) => eq.magnitude >= 3.5);
  } else {
    return earthquakes.filter((eq) => eq.magnitude >= 4.0);
  }
}

function getMagnitudeColor(magnitude: number): string {
  if (magnitude >= 7) return '#dc2626';
  if (magnitude >= 6) return '#ea580c';
  if (magnitude >= 5) return '#f59e0b';
  if (magnitude >= 4) return '#eab308';
  if (magnitude >= 3) return '#84cc16';
  return '#22c55e';
}

function getMagnitudeColorDarker(magnitude: number): string {
  if (magnitude >= 7) return '#991b1b';
  if (magnitude >= 6) return '#9a3412';
  if (magnitude >= 5) return '#d97706';
  if (magnitude >= 4) return '#ca8a04';
  if (magnitude >= 3) return '#65a30d';
  return '#16a34a';
}

function getMarkerSize(magnitude: number, zoom: number, sizeMultiplier: number = 1.0): number {
  let baseSize = 8;
  if (magnitude >= 7) baseSize = 24;
  else if (magnitude >= 6) baseSize = 20;
  else if (magnitude >= 5) baseSize = 18;
  else if (magnitude >= 4) baseSize = 16;
  else if (magnitude >= 3) baseSize = 14;
  else baseSize = 8;

  let scale = 1.0;
  if (zoom >= 10) {
    scale = 0.65;
  } else if (zoom >= 9) {
    scale = 0.75;
  } else if (zoom >= 8) {
    scale = 0.85;
  } else {
    scale = 1.0;
  }

  return Math.max(6, Math.round(baseSize * scale * sizeMultiplier));
}

function createCustomIcon(magnitude: number, zoom: number, sizeMultiplier: number = 1.0) {
  if (!L) return undefined;

  const roundedMagnitude = Math.round(magnitude * 10) / 10;
  const zoomLevel = Math.floor(zoom);
  const roundedMultiplier = Math.round(sizeMultiplier * 10) / 10;
  const cacheKey = `${roundedMagnitude}-${zoomLevel}-${roundedMultiplier}`;

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }

  const color = getMagnitudeColor(magnitude);
  const size = getMarkerSize(magnitude, zoom, sizeMultiplier);

  const icon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, ${color} 0%, ${getMagnitudeColorDarker(magnitude)} 100%);
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s ease;
        transform-origin: center;
        animation: markerFadeIn 0.4s ease-out forwards;
        opacity: 0;
      " class="earthquake-marker">
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  iconCache.set(cacheKey, icon);
  return icon;
}

function MapBounds({ earthquakes }: { earthquakes: Earthquake[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (earthquakes.length > 0 && L) {
      try {
        const bounds = L.latLngBounds(
          earthquakes.map((eq) => [eq.latitude, eq.longitude] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (error) {
        map.setView([39.0, 35.0], 6);
      }
    } else {
      map.setView([39.0, 35.0], 6);
    }
  }, [earthquakes, map]);

  return null;
}


function ZoomFilter({ earthquakes, markerSizeMultiplier = 1.0 }: { earthquakes: Earthquake[]; markerSizeMultiplier?: number }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [visibleMarkers, setVisibleMarkers] = useState<Set<string>>(new Set());
  const [filteredEarthquakes, setFilteredEarthquakes] = useState<Earthquake[]>([]);
  const [bounds, setBounds] = useState(map.getBounds());

  useEffect(() => {
    if (!map) return;

    const updateZoom = () => {
      setZoom(map.getZoom());
    };

    const updateBounds = () => {
      setBounds(map.getBounds());
    };

    map.on('zoomend', updateZoom);
    map.on('moveend', updateBounds);
    updateZoom();
    updateBounds();

    return () => {
      map.off('zoomend', updateZoom);
      map.off('moveend', updateBounds);
    };
  }, [map]);

  useEffect(() => {
    const filtered = filterByZoom(earthquakes, zoom);
    
    const maxMarkers = zoom >= 7 ? 2000 : zoom >= 6 ? 1000 : zoom >= 5 ? 500 : 200;
    const sorted = filtered.sort((a, b) => b.magnitude - a.magnitude).slice(0, maxMarkers);
    
    setFilteredEarthquakes(sorted);
    setVisibleMarkers(new Set());
  }, [earthquakes, zoom]);

  useEffect(() => {
    if (filteredEarthquakes.length === 0) {
      setVisibleMarkers(new Set());
      return;
    }

    if (!bounds) return;

    const inViewport = new Set<string>();
    const maxRender = zoom >= 8 ? 1500 : zoom >= 7 ? 800 : zoom >= 6 ? 400 : 200;
    let rendered = 0;

    for (const eq of filteredEarthquakes) {
      if (rendered >= maxRender) break;
      
      if (bounds.contains([eq.latitude, eq.longitude])) {
        inViewport.add(eq.id);
        rendered++;
      }
    }

    if (rendered < maxRender && zoom >= 6) {
      const remaining = filteredEarthquakes.filter(eq => !inViewport.has(eq.id));
      for (const eq of remaining.slice(0, maxRender - rendered)) {
        inViewport.add(eq.id);
      }
    }

    setVisibleMarkers(inViewport);
  }, [filteredEarthquakes, zoom, bounds]);

  const visibleEarthquakes = filteredEarthquakes.filter(eq => visibleMarkers.has(eq.id));

  return (
    <>
      {visibleEarthquakes.map((earthquake) => {
        const icon = createCustomIcon(earthquake.magnitude, zoom, markerSizeMultiplier);
        if (!icon) return null;

        return (
          <Marker
            key={`${earthquake.id}-${Math.floor(zoom)}`}
            position={[earthquake.latitude, earthquake.longitude]}
            icon={icon}
            zIndexOffset={Math.round(earthquake.magnitude * 1000)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold text-lg mb-2 text-gray-900">
                  M {earthquake.magnitude.toFixed(1)}
                </div>
                <div className="text-gray-800 font-medium mb-2">{earthquake.location}</div>
                <div className="text-gray-600 text-xs mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-calendar-alt text-gray-500"></i>
                    <span>{earthquake.date} {earthquake.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-arrow-down text-gray-500"></i>
                    <span>Derinlik: {earthquake.depth.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-database text-gray-500"></i>
                    <span>Kaynak: {earthquake.source.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}


function WaveAnimation({ earthquakes, show }: { earthquakes: Earthquake[]; show: boolean }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map ? map.getZoom() : 7);
  const wavesRef = useRef<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!map) return;

    const updateZoom = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', updateZoom);
    updateZoom();

    return () => {
      map.off('zoomend', updateZoom);
    };
  }, [map]);


  const getMaxRadius = (zoomLevel: number): number => {
    let baseRadius = 40000;






    let scale = 1.0;
    if (zoomLevel >= 10) {
      scale = 0.35;
    } else if (zoomLevel >= 9) {
      scale = 0.5;
    } else if (zoomLevel >= 8) {
      scale = 0.7;
    } else {
      scale = 1.0;
    }

    return Math.round(baseRadius * scale);
  };

  useEffect(() => {
    if (!show || !map || !L || earthquakes.length === 0) {
      if (wavesRef.current.length > 0) {
        wavesRef.current.forEach((wave) => {
          if (wave.circle && map.hasLayer(wave.circle)) {
            map.removeLayer(wave.circle);
          }
        });
        wavesRef.current = [];
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const latestEarthquake = [...earthquakes].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`).getTime();
      const dateB = new Date(`${b.date} ${b.time}`).getTime();
      return dateB - dateA;
    })[0];

    if (!latestEarthquake) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const center: [number, number] = [latestEarthquake.latitude, latestEarthquake.longitude];

    wavesRef.current.forEach((wave) => {
      if (wave.circle && map.hasLayer(wave.circle)) {
        map.removeLayer(wave.circle);
      }
    });
    wavesRef.current = [];

    const waves: any[] = [];
    for (let i = 0; i < 2; i++) {
      const wave = L.circle(center, {
        radius: 0,
        color: '#ef4444',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.25 - (i * 0.1),
        interactive: false,
      }).addTo(map);

      waves.push({
        circle: wave,
        startDelay: i * 800,
      });
    }

    wavesRef.current = waves;
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const maxRadius = getMaxRadius(zoom);

      wavesRef.current.forEach((wave, index) => {
        const delay = wave.startDelay;
        if (elapsed < delay) return;

        const progress = ((elapsed - delay) % 4000) / 4000;
        const currentRadius = progress * maxRadius;

        if (wave.circle && map.hasLayer(wave.circle)) {
          try {
            wave.circle.setRadius(currentRadius);
            const opacity = (0.25 - (index * 0.1)) * (1 - progress);
            if (opacity >= 0 && opacity <= 1) {
              wave.circle.setStyle({
                fillOpacity: opacity,
              });
            }
          } catch (e) {
          }
        }
      });
    }, 150);

    return () => {
      if (wavesRef.current.length > 0) {
        wavesRef.current.forEach((wave) => {
          if (wave.circle && map.hasLayer(wave.circle)) {
            map.removeLayer(wave.circle);
          }
        });
        wavesRef.current = [];
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [show, map, earthquakes, zoom]);

  return null;
}


function TectonicPlatesLayer({ show }: { show: boolean }) {
  const map = useMap();
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const layerRef = useRef<any>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const opacityRef = useRef<number>(0);

  useEffect(() => {
    if (!show || geoJsonData) return;

    fetch('/tectonic-plates.geojson')
      .then((res) => res.json())
      .then((data) => {
        setGeoJsonData(data);
      })
      .catch(() => { });
  }, [show, geoJsonData]);

  useEffect(() => {
    if (!map || !L || !geoJsonData) return;

    if (layerRef.current && map.hasLayer(layerRef.current)) {
      map.removeLayer(layerRef.current);
    }
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    if (!show) {
      layerRef.current = null;
      opacityRef.current = 0;
      return;
    }

    const stylePlate = (feature: any) => {
      const boundaryType = feature?.properties?.Boundary_Type;

      let color = '#6366f1';
      let weight = 2;

      if (boundaryType === 'Convergent') {
        color = '#ef4444';
        weight = 3;
      } else if (boundaryType === 'Divergent') {
        color = '#10b981';
        weight = 2;
      } else if (boundaryType === 'Transform') {
        color = '#f59e0b';
        weight = 2;
      } else {
        color = '#6b7280';
        weight = 1.5;
      }

      return {
        color,
        weight,
        opacity: opacityRef.current * 0.7,
        fillOpacity: 0,
      };
    }

    opacityRef.current = 0;
    const layer = L.geoJSON(geoJsonData, {
      style: stylePlate,
      interactive: false,
    });

    layerRef.current = layer;
    layer.addTo(map);


    const duration = 800;
    const steps = 20;
    const stepDelay = duration / steps;
    const opacityStep = 1 / steps;

    let currentStep = 0;
    animationRef.current = setInterval(() => {
      currentStep++;
      opacityRef.current = Math.min(1, currentStep * opacityStep);


      layer.eachLayer((featureLayer: any) => {
        if (featureLayer.setStyle) {
          const boundaryType = featureLayer.feature?.properties?.Boundary_Type;
          let color = '#6366f1';
          let weight = 2;

          if (boundaryType === 'Convergent') {
            color = '#ef4444';
            weight = 3;
          } else if (boundaryType === 'Divergent') {
            color = '#10b981';
            weight = 2;
          } else if (boundaryType === 'Transform') {
            color = '#f59e0b';
            weight = 2;
          } else {
            color = '#6b7280';
            weight = 1.5;
          }

          featureLayer.setStyle({
            color,
            weight,
            opacity: opacityRef.current * 0.7,
            fillOpacity: 0,
          });
        }
      });

      if (currentStep >= steps) {
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
      }
    }, stepDelay);

    return () => {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
      }
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [show, map, geoJsonData, L]);

  return null;
}


function MeasureClickHandler({ isActive, onPointClick }: { isActive: boolean; onPointClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (!isActive || !L) return;
      onPointClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}


function MeasureTool({
  isActive,
  setIsActive,
  points,
  setPoints,
  distance,
  setDistance,
  map,
  onLocationClick,
  locationLoading,
  onStatisticsClick,
  statisticsActive,
  onScreenshotClick,
  screenshotActive,
  onFullscreenClick,
  isFullscreen,
  onMapStyleClick,
  mapStyle,
  onResetZoomClick
}: {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  points: Array<[number, number]>;
  setPoints: (points: Array<[number, number]>) => void;
  distance: number | null;
  setDistance: (distance: number | null) => void;
  map: any;
  onLocationClick: () => void;
  locationLoading: boolean;
  onStatisticsClick: () => void;
  statisticsActive: boolean;
  onScreenshotClick: () => void;
  screenshotActive: boolean;
  onFullscreenClick: () => void;
  isFullscreen: boolean;
  onMapStyleClick: () => void;
  mapStyle: 'light' | 'satellite' | 'terrain';
  onResetZoomClick: () => void;
}) {
  const handleToggle = () => {
    const newActive = !isActive;
    setIsActive(newActive);

    if (!newActive) {
      setPoints([]);
      setDistance(null);
    }
  };

  const handleClear = () => {
    setPoints([]);
    setDistance(null);
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  return (
    <div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-auto">
      <div className="relative flex flex-row items-center gap-0.5 md:gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1 md:p-2 opacity-100">
        <div className="relative group">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLocationClick}
            disabled={locationLoading}
            className="h-8 w-8 md:h-10 md:w-10 p-0 text-green-600 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>
        </div>
        <div className="relative group">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className={`h-8 w-8 md:h-10 md:w-10 p-0 ${isActive ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Ruler className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
        <div className="relative group">
          <Button
            variant="ghost"
            size="sm"
            onClick={onStatisticsClick}
            className={`h-8 w-8 md:h-10 md:w-10 p-0 ${statisticsActive ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <BarChart2 className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
        <div className="relative group">
          <Button
            variant="ghost"
            size="sm"
            onClick={onScreenshotClick}
            className={`h-8 w-8 md:h-10 md:w-10 p-0 ${screenshotActive ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Camera className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
        <div className="relative group">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMapStyleClick}
            className="h-10 w-10 p-0 text-gray-600 hover:bg-gray-100"
          >
            <Layers className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative group">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetZoomClick}
            className="h-10 w-10 p-0 text-gray-600 hover:bg-gray-100"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative group">
          <Button
            variant="ghost"
            size="sm"
            onClick={onFullscreenClick}
            className={`h-10 w-10 p-0 ${isFullscreen ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
        </div>
        <Transition
          show={!!isActive}
          as="div"
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-2 scale-95"
          enterTo="opacity-100 translate-y-0 scale-100"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0 scale-100"
          leaveTo="opacity-0 translate-y-2 scale-95"
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-80 z-10"
        >
          <Card className="shadow-xl border-gray-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Mesafe Ölçümü</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggle}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-xs text-gray-600">
                  Harita üzerinde iki nokta seçin
                </p>

                {points.length > 0 && (
                  <div className="text-xs text-gray-700">
                    <div>Seçilen noktalar: {points.length}/2</div>
                  </div>
                )}

                {distance !== null && (
                  <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="text-base font-bold text-blue-900">
                      {formatDistance(distance)}
                    </div>
                  </div>
                )}

                {(points.length > 0 || distance !== null) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="w-full text-xs"
                  >
                    <X className="h-3 w-3 mr-1.5" />
                    Temizle
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </Transition>

      </div>
    </div>
  );
}


function CitiesLayer({ show }: { show: boolean }) {
  const map = useMap();
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const layerRef = useRef<any>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const opacityRef = useRef<number>(0);

  useEffect(() => {
    if (!show || geoJsonData) return;

    fetch('/turkey-cities.json')
      .then((res) => res.json())
      .then((data) => {
        setGeoJsonData(data);
      })
      .catch(() => { });
  }, [show, geoJsonData]);

  useEffect(() => {
    if (!map || !L || !geoJsonData) return;

    if (layerRef.current && map.hasLayer(layerRef.current)) {
      map.removeLayer(layerRef.current);
    }
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    if (!show) {
      layerRef.current = null;
      opacityRef.current = 0;
      return;
    }

    const styleCity = () => {
      return {
        color: '#9ca3af',
        weight: 1,
        opacity: opacityRef.current * 0.25,
        fillColor: '#f9fafb',
        fillOpacity: opacityRef.current * 0.1,
      };
    }

    opacityRef.current = 0;
    const layer = L.geoJSON(geoJsonData, {
      style: styleCity,
      interactive: false,
    });

    layerRef.current = layer;
    layer.addTo(map);


    const duration = 800;
    const steps = 20;
    const stepDelay = duration / steps;
    const opacityStep = 1 / steps;

    let currentStep = 0;
    animationRef.current = setInterval(() => {
      currentStep++;
      opacityRef.current = Math.min(1, currentStep * opacityStep);

      layer.eachLayer((featureLayer: any) => {
        if (featureLayer.setStyle) {
          featureLayer.setStyle({
            color: '#9ca3af',
            weight: 1,
            opacity: opacityRef.current * 0.50,
            fillColor: '#f9fafb',
            fillOpacity: opacityRef.current * 0.1,
          });
        }
      });

      if (currentStep >= steps) {
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
      }
    }, stepDelay);

    return () => {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
      }
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [show, map, geoJsonData, L]);

  return null;
}


function TurkeyFaultsLayer({ show }: { show: boolean }) {
  const map = useMap();
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const layerRef = useRef<any>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const opacityRef = useRef<number>(0);

  useEffect(() => {
    if (!show || geoJsonData) return;

    fetch('/turkey-faults.geojson')
      .then((res) => res.json())
      .then((data) => {
        setGeoJsonData(data);
      })
      .catch(() => { });
  }, [show, geoJsonData]);

  useEffect(() => {
    if (!map || !L || !geoJsonData) return;

    if (layerRef.current && map.hasLayer(layerRef.current)) {
      map.removeLayer(layerRef.current);
    }
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    if (!show) {
      layerRef.current = null;
      opacityRef.current = 0;
      return;
    }

    const styleFault = (feature: any) => {
      const importance = feature?.properties?.importance || 0;

      let color = '#f97316';
      let weight = 1.5;

      if (importance >= 6) {
        color = '#dc2626';
        weight = 2.5;
      } else if (importance >= 5) {
        color = '#ea580c';
        weight = 2;
      } else if (importance >= 4) {
        color = '#f97316';
        weight = 1.5;
      } else {
        color = '#fb923c';
        weight = 1;
      }

      return {
        color,
        weight,
        opacity: opacityRef.current * 0.8,
        fillOpacity: 0,
      };
    }

    opacityRef.current = 0;
    const layer = L.geoJSON(geoJsonData, {
      style: styleFault,
      interactive: false,
    });

    layerRef.current = layer;
    layer.addTo(map);


    const duration = 800;
    const steps = 20;
    const stepDelay = duration / steps;
    const opacityStep = 1 / steps;

    let currentStep = 0;
    animationRef.current = setInterval(() => {
      currentStep++;
      opacityRef.current = Math.min(1, currentStep * opacityStep);


      layer.eachLayer((featureLayer: any) => {
        if (featureLayer.setStyle) {
          const importance = featureLayer.feature?.properties?.importance || 0;
          let color = '#f97316';
          let weight = 1.5;

          if (importance >= 6) {
            color = '#dc2626';
            weight = 2.5;
          } else if (importance >= 5) {
            color = '#ea580c';
            weight = 2;
          } else if (importance >= 4) {
            color = '#f97316';
            weight = 1.5;
          } else {
            color = '#fb923c';
            weight = 1;
          }

          featureLayer.setStyle({
            color,
            weight,
            opacity: opacityRef.current * 0.8,
            fillOpacity: 0,
          });
        }
      });

      if (currentStep >= steps) {
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
      }
    }, stepDelay);

    return () => {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
      }
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [show, map, geoJsonData, L]);

  return null;
}

function LocationMarker({ location }: { location: [number, number] | null }) {
  const map = useMap();
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !L || !location) return;

    if (markerRef.current && map.hasLayer(markerRef.current)) {
      map.removeLayer(markerRef.current);
    }

    markerRef.current = L.marker([location[0], location[1]], {
      icon: L.divIcon({
        className: 'location-marker',
        html: `
          <div style="
            background: #22c55e;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      zIndexOffset: 10000,
    }).addTo(map);

    markerRef.current.bindPopup('Mevcut Konumunuz').openPopup();

    map.setView([location[0], location[1]], Math.max(map.getZoom(), 13), {
      animate: true,
      duration: 1,
    });

    return () => {
      if (markerRef.current && map.hasLayer(markerRef.current)) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [location, map]);

  return null;
}

function MeasureMarkers({ points, map }: { points: Array<[number, number]>; map: any }) {
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !L) return;

    markersRef.current.forEach((marker) => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    if (polylineRef.current && map.hasLayer(polylineRef.current)) {
      map.removeLayer(polylineRef.current);
    }
    markersRef.current = [];
    polylineRef.current = null;

    if (points.length > 0) {
      points.forEach((point, index) => {
        const marker = L.marker([point[0], point[1]], {
          icon: L.divIcon({
            className: 'measure-marker',
            html: `
              <div style="
                background: #3b82f6;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).addTo(map);

        marker.bindPopup(`Nokta ${index + 1}: ${point[0].toFixed(4)}, ${point[1].toFixed(4)}`);
        markersRef.current.push(marker);
      });

      if (points.length === 2) {
        polylineRef.current = L.polyline(
          [points[0], points[1]],
          {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8,
            dashArray: '10, 10',
          }
        ).addTo(map);
      }
    }

    return () => {
      markersRef.current.forEach((marker) => {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
      if (polylineRef.current && map.hasLayer(polylineRef.current)) {
        map.removeLayer(polylineRef.current);
      }
    };
  }, [points, map]);

  return null;
}


function MeasureCursor({ isActive, map }: { isActive: boolean; map: any }) {
  useEffect(() => {
    if (!map || !L || !isActive) return;

    const container = map.getContainer();
    container.style.cursor = 'crosshair';

    return () => {
      container.style.cursor = '';
    };
  }, [map, isActive]);

  return null;
}


function MapRef({ mapRef }: { mapRef: React.MutableRefObject<any> }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  return null;
}


function AreaSelector({
  isActive,
  onAreaSelected,
  onDrawStart
}: {
  isActive: boolean;
  onAreaSelected: (bounds: [[number, number], [number, number]]) => void;
  onDrawStart?: () => void;
}) {
  const map = useMap();
  const drawnItemsRef = useRef<any>(null);
  const rectangleDrawerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !L) return;

    import('leaflet-draw').then((leafletDraw: any) => {
      if (leafletDraw.default) {
        if (!(L as any).Draw && leafletDraw.default.Draw) {
          (L as any).Draw = leafletDraw.default.Draw;
        }
      }

      if ((L as any).drawLocal) {
        (L as any).drawLocal = {
          ...(L as any).drawLocal,
          draw: {
            ...((L as any).drawLocal.draw || {}),
            handlers: {
              ...((L as any).drawLocal.draw?.handlers || {}),
              rectangle: {
                ...((L as any).drawLocal.draw?.handlers?.rectangle || {}),
                tooltip: {
                  start: 'Dikdörtgen çizmek için tıklayın ve sürükleyin',
                },
              },
              simpleshape: {
                ...((L as any).drawLocal.draw?.handlers?.simpleshape || {}),
                tooltip: {
                  end: 'Bırakmak için fareyi bırakın',
                },
              },
            },
          },
        };
      }

      if (!drawnItemsRef.current) {
        drawnItemsRef.current = L.featureGroup().addTo(map);
      }

      if (!rectangleDrawerRef.current) {
        let DrawRectangle: any = null;

        if ((L as any).Draw && (L as any).Draw.Draw && (L as any).Draw.Draw.Rectangle) {
          DrawRectangle = (L as any).Draw.Draw.Rectangle;
        } else if ((L as any).Draw && (L as any).Draw.Rectangle) {
          DrawRectangle = (L as any).Draw.Rectangle;
        } else if (leafletDraw.default && leafletDraw.default.Draw && leafletDraw.default.Draw.Rectangle) {
          DrawRectangle = leafletDraw.default.Draw.Rectangle;
        }

        if (DrawRectangle) {
          const originalAddHooks = DrawRectangle.prototype.addHooks;
          DrawRectangle.prototype.addHooks = function () {
            originalAddHooks.call(this);
            if (this._tooltip && this._map) {
              this._tooltip.updateContent({
                text: {
                  start: 'Dikdörtgen çizmek için tıklayın ve sürükleyin',
                },
              });
            }
          };

          rectangleDrawerRef.current = new DrawRectangle(map, {
            shapeOptions: {
              color: '#3b82f6',
              weight: 2,
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
            },
            repeatMode: false,
          });
        }
      }
    });

    return () => {
      if (rectangleDrawerRef.current) {
        try {
          rectangleDrawerRef.current.disable();
        } catch (e) {
        }
        rectangleDrawerRef.current = null;
      }
      if (drawnItemsRef.current) {
        try {
          map.removeLayer(drawnItemsRef.current);
        } catch (e) {
        }
        drawnItemsRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!map || !L) return;

    const handleDrawCreated = (e: any) => {
      const layer = e.layer;
      const type = e.layerType;

      if (type === 'rectangle') {
        const bounds = layer.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        const selectedBounds: [[number, number], [number, number]] = [
          [sw.lat, sw.lng],
          [ne.lat, ne.lng]
        ];

        if (drawnItemsRef.current) {
          drawnItemsRef.current.clearLayers();
        }

        onAreaSelected(selectedBounds);
      }
    };

    const handleDrawStart = () => {
      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
      }

      if (onDrawStart) {
        onDrawStart();
      }
    };

    map.on('draw:created', handleDrawCreated);
    map.on('draw:drawstart', handleDrawStart);

    return () => {
      map.off('draw:created', handleDrawCreated);
      map.off('draw:drawstart', handleDrawStart);
    };
  }, [map, onAreaSelected, onDrawStart]);

  useEffect(() => {
    if (!map || !L || !rectangleDrawerRef.current) return;

    const handleDrawMouseMove = (e: any) => {
      if (rectangleDrawerRef.current && rectangleDrawerRef.current._tooltip) {
        const tooltip = rectangleDrawerRef.current._tooltip;
        if (tooltip._container) {
          const currentContent = tooltip._container.innerHTML;
          if (currentContent.includes('Release') || currentContent.includes('release')) {
            tooltip._container.innerHTML = 'Bırakmak için fareyi bırakın';
          } else if (currentContent.includes('to finish') || currentContent.includes('finish')) {
            tooltip._container.innerHTML = currentContent.replace(/to finish/gi, 'bitirmek için').replace(/finish/gi, 'bitir');
          }
        }
      }
    };

    if (isActive) {
      rectangleDrawerRef.current.enable();

      const container = map.getContainer();
      container.style.cursor = 'crosshair';

      map.on('draw:mousemove', handleDrawMouseMove);
    } else {
      rectangleDrawerRef.current.disable();

      const container = map.getContainer();
      container.style.cursor = '';

      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
      }

      map.off('draw:mousemove', handleDrawMouseMove);
    }

    return () => {
      const container = map.getContainer();
      container.style.cursor = '';
      map.off('draw:mousemove', handleDrawMouseMove);
    };
  }, [isActive, map]);

  return null;
}

export default function MapView({ earthquakes, showTectonicPlates = true, showTurkeyFaults = true, showWaveAnimation = true, showCities = true, mapStyle: mapStyleProp = 'light', markerSizeMultiplier = 1.0, showLegend = true }: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [measureActive, setMeasureActive] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<Array<[number, number]>>([]);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [statisticsActive, setStatisticsActive] = useState(false);
  const [selectedBounds, setSelectedBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [filteredEarthquakes, setFilteredEarthquakes] = useState<Earthquake[]>([]);
  const [screenshotActive, setScreenshotActive] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState<'turkey' | 'selected' | null>(null);
  const [screenshotBounds, setScreenshotBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const screenshotRectangleRef = useRef<any>(null);
  const statisticsRectangleRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleMeasurePoint = useCallback((lat: number, lng: number) => {
    if (!measureActive || !L) return;

    if (measurePoints.length === 0) {
      setMeasurePoints([[lat, lng]]);
      setMeasureDistance(null);
    } else if (measurePoints.length === 1) {
      const newPoints: Array<[number, number]> = [...measurePoints, [lat, lng] as [number, number]];
      setMeasurePoints(newPoints);

      const point1 = L.latLng(measurePoints[0][0], measurePoints[0][1]);
      const point2 = L.latLng(lat, lng);
      const distInMeters = point1.distanceTo(point2);
      setMeasureDistance(distInMeters);
    } else {
      setMeasurePoints([[lat, lng]]);
      setMeasureDistance(null);
    }
  }, [measureActive, measurePoints, L]);


  const handleLocationClick = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum özelliğini desteklemiyor.');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setLocationLoading(false);
      },
      () => {
        alert('Konumunuz alınamadı. Lütfen tarayıcı ayarlarından konum iznini kontrol edin.');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleStatisticsToggle = useCallback(() => {
    setStatisticsActive((prev) => {
      const newActive = !prev;

      if (!newActive) {
        setSelectedBounds(null);
        setStatistics(null);
        setFilteredEarthquakes([]);
      } else {
        setSelectedBounds(null);
        setStatistics(null);
        setFilteredEarthquakes([]);
      }

      if (mapRef.current && statisticsRectangleRef.current && L) {
        if (mapRef.current.hasLayer(statisticsRectangleRef.current)) {
          mapRef.current.removeLayer(statisticsRectangleRef.current);
        }
        statisticsRectangleRef.current = null;
      }

      return newActive;
    });
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement && mapContainerRef.current) {
      mapContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => { });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);


  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleResetZoom = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.setView([39.0, 35.0], 6);
    }
  }, []);

  const handleScreenshotToggle = useCallback(() => {
    setScreenshotActive((prev) => !prev);
    if (!screenshotActive) {
      setScreenshotMode(null);
      setScreenshotBounds(null);
      if (mapRef.current && screenshotRectangleRef.current && L) {
        if (mapRef.current.hasLayer(screenshotRectangleRef.current)) {
          mapRef.current.removeLayer(screenshotRectangleRef.current);
        }
        screenshotRectangleRef.current = null;
      }
    }
  }, [screenshotActive]);


  const captureMapScreenshot = useCallback(async (bounds: [[number, number], [number, number]], isSelectedArea: boolean = false) => {
    if (!mapContainerRef.current || !mapRef.current || !L) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const mapElement = mapContainerRef.current.querySelector('.leaflet-container') as HTMLElement;

      if (!mapElement) return;

      const fullCanvas = await html2canvas(mapElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      let finalCanvas = fullCanvas;

      if (isSelectedArea && bounds) {
        const sw = L.latLng(bounds[0][0], bounds[0][1]);
        const ne = L.latLng(bounds[1][0], bounds[1][1]);

        const swPoint = mapRef.current.latLngToContainerPoint(sw);
        const nePoint = mapRef.current.latLngToContainerPoint(ne);

        const scale = 2;
        const x1 = Math.min(swPoint.x, nePoint.x) * scale;
        const y1 = Math.min(swPoint.y, nePoint.y) * scale;
        const x2 = Math.max(swPoint.x, nePoint.x) * scale;
        const y2 = Math.max(swPoint.y, nePoint.y) * scale;

        const width = x2 - x1;
        const height = y2 - y1;

        if (width > 0 && height > 0 && x1 >= 0 && y1 >= 0 &&
          x1 + width <= fullCanvas.width && y1 + height <= fullCanvas.height) {
          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = width;
          croppedCanvas.height = height;
          const ctx = croppedCanvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(
              fullCanvas,
              x1, y1, width, height,
              0, 0, width, height
            );
            finalCanvas = croppedCanvas;
          }
        }
      }

      const link = document.createElement('a');
      link.download = `deprem-haritasi-${new Date().toISOString().split('T')[0]}.png`;
      link.href = finalCanvas.toDataURL('image/png');
      link.click();

      if (mapRef.current && screenshotRectangleRef.current && L) {
        if (mapRef.current.hasLayer(screenshotRectangleRef.current)) {
          mapRef.current.removeLayer(screenshotRectangleRef.current);
        }
        screenshotRectangleRef.current = null;
      }

      setScreenshotActive(false);
      setScreenshotMode(null);
      setScreenshotBounds(null);
    } catch {
      alert('Ekran resmi alınamadı. Lütfen tekrar deneyin.');
    }
  }, []);


  const handleScreenshotSelected = useCallback(async () => {
    if (!screenshotBounds || !mapRef.current || !L) return;
    await captureMapScreenshot(screenshotBounds, true);
  }, [screenshotBounds, captureMapScreenshot]);


  const handleScreenshotAreaSelected = useCallback((bounds: [[number, number], [number, number]]) => {
    if (!bounds || !Array.isArray(bounds) || bounds.length !== 2) {
      return;
    }


    if (
      !Number.isFinite(bounds[0][0]) || !Number.isFinite(bounds[0][1]) ||
      !Number.isFinite(bounds[1][0]) || !Number.isFinite(bounds[1][1])
    ) {
      return;
    }

    setScreenshotBounds(bounds);
    setStatisticsActive(false);
    setStatistics(null);
    setSelectedBounds(null);
    setFilteredEarthquakes([]);

    if (mapRef.current && statisticsRectangleRef.current && L) {
      if (mapRef.current.hasLayer(statisticsRectangleRef.current)) {
        mapRef.current.removeLayer(statisticsRectangleRef.current);
      }
      statisticsRectangleRef.current = null;
    }

    if (mapRef.current && L) {
      if (screenshotRectangleRef.current && mapRef.current.hasLayer(screenshotRectangleRef.current)) {
        mapRef.current.removeLayer(screenshotRectangleRef.current);
      }

      try {
        const rectBounds: [[number, number], [number, number]] = [
          [bounds[0][0], bounds[0][1]],
          [bounds[1][0], bounds[1][1]]
        ];

        screenshotRectangleRef.current = L.rectangle(rectBounds, {
          color: '#f97316',
          weight: 2,
          fillColor: '#f97316',
          fillOpacity: 0.2,
        }).addTo(mapRef.current);
      } catch {
      }
    }
  }, []);

  const handleAreaSelected = useCallback((bounds: [[number, number], [number, number]]) => {
    setSelectedBounds(bounds);

    const filtered = earthquakes.filter((eq) => {
      const lat = eq.latitude;
      const lng = eq.longitude;
      return (
        lat >= bounds[0][0] &&
        lat <= bounds[1][0] &&
        lng >= bounds[0][1] &&
        lng <= bounds[1][1]
      );
    });

    setFilteredEarthquakes(filtered);

    if (filtered.length > 0) {
      const magnitudes = filtered.map((eq) => eq.magnitude);
      const depths = filtered.map((eq) => eq.depth);

      const magnitudeDistribution = [
        { range: 'M 7.0+', count: filtered.filter(eq => eq.magnitude >= 7).length, min: 7, max: 10 },
        { range: 'M 6.0-6.9', count: filtered.filter(eq => eq.magnitude >= 6 && eq.magnitude < 7).length, min: 6, max: 7 },
        { range: 'M 5.0-5.9', count: filtered.filter(eq => eq.magnitude >= 5 && eq.magnitude < 6).length, min: 5, max: 6 },
        { range: 'M 4.0-4.9', count: filtered.filter(eq => eq.magnitude >= 4 && eq.magnitude < 5).length, min: 4, max: 5 },
        { range: 'M 3.0-3.9', count: filtered.filter(eq => eq.magnitude >= 3 && eq.magnitude < 4).length, min: 3, max: 4 },
        { range: 'M < 3.0', count: filtered.filter(eq => eq.magnitude < 3).length, min: 0, max: 3 },
      ];

      const sourceDistribution = [
        { name: 'AFAD', value: filtered.filter(eq => eq.source === 'afad').length, fill: '#ef4444' },
        { name: 'Kandilli', value: filtered.filter(eq => eq.source === 'kandilli').length, fill: '#3b82f6' },
      ];

      const depthRanges = [
        { range: '0-10 km', count: filtered.filter(eq => eq.depth >= 0 && eq.depth < 10).length },
        { range: '10-20 km', count: filtered.filter(eq => eq.depth >= 10 && eq.depth < 20).length },
        { range: '20-30 km', count: filtered.filter(eq => eq.depth >= 20 && eq.depth < 30).length },
        { range: '30-50 km', count: filtered.filter(eq => eq.depth >= 30 && eq.depth < 50).length },
        { range: '50+ km', count: filtered.filter(eq => eq.depth >= 50).length },
      ];

      const dateGroups: { [key: string]: number } = {};
      const hourGroups: { [key: number]: number } = {};
      const locationGroups: { [key: string]: number } = {};
      const magnitudeTimeline: { date: string; avgMagnitude: number; count: number }[] = [];
      const depthTimeline: { date: string; avgDepth: number; count: number }[] = [];
      
      filtered.forEach(eq => {
        const date = eq.date;
        dateGroups[date] = (dateGroups[date] || 0) + 1;
        
        const hour = parseInt(eq.time.split(':')[0]);
        hourGroups[hour] = (hourGroups[hour] || 0) + 1;
        
        const locationKey = eq.location.split(',')[0].trim() || eq.location.split('-')[0].trim() || 'Bilinmeyen';
        locationGroups[locationKey] = (locationGroups[locationKey] || 0) + 1;
      });

      const timelineData = Object.entries(dateGroups)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));

      const sortedDates = Object.keys(dateGroups).sort();
      sortedDates.forEach(date => {
        const dayEarthquakes = filtered.filter(eq => eq.date === date);
        if (dayEarthquakes.length > 0) {
          const dayMagnitudes = dayEarthquakes.map(eq => eq.magnitude);
          const dayDepths = dayEarthquakes.map(eq => eq.depth);
          magnitudeTimeline.push({
            date,
            avgMagnitude: dayMagnitudes.reduce((a, b) => a + b, 0) / dayMagnitudes.length,
            count: dayEarthquakes.length,
          });
          depthTimeline.push({
            date,
            avgDepth: dayDepths.reduce((a, b) => a + b, 0) / dayDepths.length,
            count: dayEarthquakes.length,
          });
        }
      });

      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: hourGroups[i] || 0,
        label: `${i.toString().padStart(2, '0')}:00`,
      }));

      const topLocations = Object.entries(locationGroups)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([location, count]) => ({ location, count }));

      const sortedByTime = [...filtered].sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time}`).getTime();
        const timeB = new Date(`${b.date}T${b.time}`).getTime();
        return timeA - timeB;
      });

      const timeIntervals: number[] = [];
      for (let i = 1; i < sortedByTime.length; i++) {
        const timeA = new Date(`${sortedByTime[i - 1].date}T${sortedByTime[i - 1].time}`).getTime();
        const timeB = new Date(`${sortedByTime[i].date}T${sortedByTime[i].time}`).getTime();
        const diffHours = (timeB - timeA) / (1000 * 60 * 60);
        timeIntervals.push(diffHours);
      }

      const avgInterval = timeIntervals.length > 0 
        ? timeIntervals.reduce((a, b) => a + b, 0) / timeIntervals.length 
        : 0;

      const avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
      const riskScore = (filtered.length * avgMagnitude) / 10;
      const activityLevel = filtered.length / (timelineData.length || 1);
      const strongEarthquakeCount = filtered.filter(eq => eq.magnitude >= 5).length;
      const shallowEarthquakeCount = filtered.filter(eq => eq.depth < 10).length;

      const stats = {
        count: filtered.length,
        maxMagnitude: Math.max(...magnitudes),
        minMagnitude: Math.min(...magnitudes),
        avgMagnitude: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
        maxDepth: Math.max(...depths),
        minDepth: Math.min(...depths),
        avgDepth: depths.reduce((a, b) => a + b, 0) / depths.length,
        magnitudeDistribution,
        sourceDistribution,
        depthRanges,
        timelineData,
        hourlyData,
        magnitudeTimeline,
        depthTimeline,
        topLocations,
        avgInterval,
        riskScore,
        activityLevel,
        strongEarthquakeCount,
        shallowEarthquakeCount,
        timeIntervals,
      };

      setStatistics(stats);
    } else {
      setStatistics({
        count: 0,
        maxMagnitude: 0,
        minMagnitude: 0,
        avgMagnitude: 0,
        maxDepth: 0,
        minDepth: 0,
        avgDepth: 0,
        magnitudeDistribution: [],
        sourceDistribution: [],
        depthRanges: [],
        timelineData: [],
        hourlyData: [],
        magnitudeTimeline: [],
        depthTimeline: [],
        topLocations: [],
        avgInterval: 0,
        riskScore: 0,
        activityLevel: 0,
        strongEarthquakeCount: 0,
        shallowEarthquakeCount: 0,
        timeIntervals: [],
      });
    }

    if (mapRef.current && L) {
      if (statisticsRectangleRef.current && mapRef.current.hasLayer(statisticsRectangleRef.current)) {
        mapRef.current.removeLayer(statisticsRectangleRef.current);
      }

      statisticsRectangleRef.current = L.rectangle(bounds, {
        color: '#8b5cf6',
        weight: 2,
        fillColor: '#8b5cf6',
        fillOpacity: 0.2,
      }).addTo(mapRef.current);
    }

    if (screenshotActive) {
      setScreenshotActive(false);
      setScreenshotMode(null);
      setScreenshotBounds(null);
      if (mapRef.current && screenshotRectangleRef.current && L) {
        if (mapRef.current.hasLayer(screenshotRectangleRef.current)) {
          mapRef.current.removeLayer(screenshotRectangleRef.current);
        }
        screenshotRectangleRef.current = null;
      }
    }
  }, [earthquakes, screenshotActive]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet/dist/leaflet.css');
      import('leaflet-draw/dist/leaflet.draw.css');

      import('leaflet').then((leafletModule) => {
        L = leafletModule.default;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        setIsMounted(true);
      });
    }
  }, []);

  if (!isMounted || typeof window === 'undefined') {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Harita yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" ref={mapContainerRef}>
      <MapContainer
        center={[39.0, 35.0]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          attribution=""
          url={
            mapStyleProp === 'satellite'
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              : mapStyleProp === 'terrain'
                ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
                : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          }
          subdomains={mapStyleProp === 'terrain' ? 'abc' : 'abcd'}
          updateWhenIdle={true}
          updateWhenZooming={false}
          keepBuffer={3}
          maxZoom={19}
          maxNativeZoom={18}
          tileSize={256}
          zoomOffset={0}
        />
        <CitiesLayer show={showCities ?? true} />
        <TectonicPlatesLayer show={showTectonicPlates} />
        <TurkeyFaultsLayer show={showTurkeyFaults} />
        <MapBounds earthquakes={earthquakes} />
        <WaveAnimation earthquakes={earthquakes} show={showWaveAnimation} />
        <ZoomFilter earthquakes={earthquakes} markerSizeMultiplier={markerSizeMultiplier} />
        <MapRef mapRef={mapRef} />
        <MeasureClickHandler isActive={measureActive} onPointClick={handleMeasurePoint} />
        <MeasureCursor isActive={measureActive} map={mapRef.current} />
        <MeasureMarkers points={measurePoints} map={mapRef.current} />
        <AreaSelector
          isActive={statisticsActive}
          onAreaSelected={handleAreaSelected}
        />
        {userLocation && <LocationMarker location={userLocation} />}
      </MapContainer>

      <MeasureTool
        isActive={measureActive}
        setIsActive={setMeasureActive}
        points={measurePoints}
        setPoints={setMeasurePoints}
        distance={measureDistance}
        setDistance={setMeasureDistance}
        map={mapRef.current}
        onLocationClick={handleLocationClick}
        locationLoading={locationLoading}
        onStatisticsClick={handleStatisticsToggle}
        statisticsActive={statisticsActive}
        onScreenshotClick={handleScreenshotToggle}
        screenshotActive={screenshotActive}
        onFullscreenClick={handleFullscreenToggle}
        isFullscreen={isFullscreen}
        onMapStyleClick={() => { }}
        mapStyle={mapStyleProp}
        onResetZoomClick={handleResetZoom}
      />

      {screenshotActive && (
        <div className="absolute top-2 md:top-4 left-2 md:left-4 z-[70] max-w-[90vw] md:max-w-none">
          <Transition
            show={!!screenshotActive}
            as="div"
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-2 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-2 scale-95"
            className="relative"
          >
            <Card className="shadow-xl border-gray-200">
              <CardContent className="p-2 md:p-4">
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <img
                      src="/turkey-map.svg"
                      alt="Türkiye Haritası"
                      className="w-full h-auto max-h-48 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Turkey_provinces_blank_gray.svg/1600px-Turkey_provinces_blank_gray.svg.png?20230330204042';
                      }}
                    />
                  </div>

                  {screenshotMode === 'selected' && screenshotBounds && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 text-center py-2 bg-green-50 border border-green-200 rounded">
                        Alan seçildi! Ekran resmini indirebilirsiniz.
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleScreenshotSelected}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Ekran Resmini İndir
                      </Button>
                    </div>
                  )}

                  {screenshotMode === 'selected' && !screenshotBounds && (
                    <div className="text-xs text-gray-600 text-center py-2 bg-yellow-50 border border-yellow-200 rounded">
                      Haritada bir dikdörtgen alan seçin
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Transition>
        </div>
      )}

      {statisticsActive && statistics && selectedBounds && (
        <Transition
          show={!!(statisticsActive && statistics && selectedBounds)}
          as="div"
          enter="transition ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleStatisticsToggle();
            }
          }}
        >
          <Transition
            show={!!(statisticsActive && statistics && selectedBounds)}
            as="div"
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-4 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-4 scale-95"
            className="relative w-full max-w-4xl h-[90vh] md:h-[90vh] max-h-[95vh] flex flex-col m-2 md:m-0"
          >
            <Card className="shadow-2xl border-gray-200 w-full h-full flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">İstatistikler</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStatisticsToggle}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 overflow-y-auto min-h-0">
                {!statistics || statistics.count === 0 ? (
                  <div className="text-sm text-gray-600 text-center py-8">
                    {statisticsActive && !selectedBounds ? (
                      'Haritada bir alan seçin'
                    ) : (
                      'Seçilen alanda deprem bulunamadı'
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                      <div className="p-4 bg-purple-50 rounded-md border border-purple-200">
                        <div className="text-xs text-purple-700 font-medium mb-1">Toplam Deprem</div>
                        <div className="text-2xl font-bold text-purple-900">{statistics.count}</div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                        <div className="text-xs text-blue-700 font-medium mb-1">Max Büyüklük</div>
                        <div className="text-xl font-bold text-blue-900">M {statistics.maxMagnitude.toFixed(1)}</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-md border border-green-200">
                        <div className="text-xs text-green-700 font-medium mb-1">Ortalama Büyüklük</div>
                        <div className="text-xl font-bold text-green-900">M {statistics.avgMagnitude.toFixed(2)}</div>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-md border border-orange-200">
                        <div className="text-xs text-orange-700 font-medium mb-1">Ortalama Derinlik</div>
                        <div className="text-xl font-bold text-orange-900">{statistics.avgDepth.toFixed(1)} km</div>
                      </div>
                    </div>

                    {filteredEarthquakes.length > 0 && statistics && (
                      <>
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-gray-700">Büyüklük - Derinlik Dağılımı</div>
                          <div className="w-full h-64 md:h-96 bg-gray-50 rounded-md p-2 md:p-4" ref={chartContainerRef}>
                            <ResponsiveContainer width="100%" height="100%">
                              <ScatterChart
                                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  type="number"
                                  dataKey="depth"
                                  name="Derinlik"
                                  unit=" km"
                                  domain={[
                                    Math.max(0, statistics.minDepth > 0 ? Math.floor(statistics.minDepth - (statistics.maxDepth - statistics.minDepth || statistics.maxDepth * 0.1) * 0.1) : 0),
                                    Math.ceil(statistics.maxDepth + (statistics.maxDepth - statistics.minDepth || statistics.maxDepth * 0.1) * 0.1)
                                  ]}
                                  label={{ value: 'Derinlik (km)', position: 'insideBottom', offset: -10 }}
                                />
                                <YAxis
                                  type="number"
                                  dataKey="magnitude"
                                  name="Büyüklük"
                                  unit=" M"
                                  domain={[
                                    Math.max(0, statistics.minMagnitude > 0 ? Math.floor((statistics.minMagnitude - (statistics.maxMagnitude - statistics.minMagnitude || statistics.maxMagnitude * 0.1) * 0.1) * 10) / 10 : 0),
                                    Math.ceil((statistics.maxMagnitude + (statistics.maxMagnitude - statistics.minMagnitude || statistics.maxMagnitude * 0.1) * 0.1) * 10) / 10
                                  ]}
                                  label={{ value: 'Büyüklük (M)', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                  cursor={{ strokeDasharray: '3 3' }}
                                  content={({ active, payload }) => {
                                    if (active && payload && payload[0]) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                                          <p className="font-semibold text-sm">M {data.magnitude.toFixed(1)}</p>
                                          <p className="text-xs text-gray-600">Derinlik: {data.depth.toFixed(1)} km</p>
                                          <p className="text-xs text-gray-600 mt-1">{data.location}</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Scatter
                                  name="Depremler"
                                  data={filteredEarthquakes.map(eq => ({
                                    magnitude: eq.magnitude,
                                    depth: eq.depth,
                                    location: eq.location,
                                    date: eq.date,
                                    time: eq.time,
                                    size: Math.max(5, Math.min(30, eq.magnitude * 5))
                                  }))}
                                  fill="#8884d8"
                                  shape={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    const size = payload?.size || 10;
                                    const color = getMagnitudeColor(payload?.magnitude || 0);
                                    return (
                                      <circle
                                        cx={cx}
                                        cy={cy}
                                        r={size}
                                        fill={color}
                                        stroke="#fff"
                                        strokeWidth={1.5}
                                        opacity={0.8}
                                      />
                                    );
                                  }}
                                >
                                  {filteredEarthquakes.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={getMagnitudeColor(entry.magnitude)}
                                    />
                                  ))}
                                </Scatter>
                              </ScatterChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-gray-700">Büyüklük Dağılımı</div>
                            <div className="w-full h-48 md:h-64 bg-gray-50 rounded-md p-2 md:p-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statistics.magnitudeDistribution || []}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} fontSize={11} />
                                  <YAxis fontSize={11} />
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload[0]) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                                            <p className="font-semibold text-xs">{data.range}</p>
                                            <p className="text-xs text-gray-600">Sayı: {data.count}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                    {(statistics.magnitudeDistribution || []).map((entry: any, index: number) => (
                                      <Cell key={`magnitude-cell-${index}`} fill={getMagnitudeColor(entry.min + (entry.max - entry.min) / 2)} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-gray-700">Kaynak Dağılımı</div>
                            <div className="w-full h-48 md:h-64 bg-gray-50 rounded-md p-2 md:p-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={statistics.sourceDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {(statistics.sourceDistribution || []).map((entry: any, index: number) => (
                                      <Cell key={`source-cell-${index}`} fill={entry.fill} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload[0]) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                                            <p className="font-semibold text-xs">{data.name}</p>
                                            <p className="text-xs text-gray-600">Sayı: {data.value}</p>
                                            <p className="text-xs text-gray-600">Yüzde: {((data.value / statistics.count) * 100).toFixed(1)}%</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-gray-700">Derinlik Aralıkları</div>
                            <div className="w-full h-48 md:h-64 bg-gray-50 rounded-md p-2 md:p-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statistics.depthRanges || []}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="range" fontSize={11} />
                                  <YAxis fontSize={11} />
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload[0]) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                                            <p className="font-semibold text-xs">{data.range}</p>
                                            <p className="text-xs text-gray-600">Sayı: {data.count}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-gray-700">Tarih Bazlı Dağılım</div>
                            <div className="w-full h-48 md:h-64 bg-gray-50 rounded-md p-2 md:p-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={statistics.timelineData || []}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} fontSize={10} />
                                  <YAxis fontSize={11} />
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload[0]) {
                                        return (
                                          <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                                            <p className="font-semibold text-xs">Tarih: {payload[0].payload.date}</p>
                                            <p className="text-xs text-gray-600">Sayı: {payload[0].value}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-gray-700">Saatlik Dağılım</div>
                            <div className="w-full h-48 md:h-64 bg-gray-50 rounded-md p-2 md:p-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statistics.hourlyData || []}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="hour" fontSize={10} />
                                  <YAxis fontSize={11} />
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload[0]) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                                            <p className="font-semibold text-xs">{data.label}</p>
                                            <p className="text-xs text-gray-600">Sayı: {data.count}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-gray-700">Büyüklük Trendi</div>
                            <div className="w-full h-48 md:h-64 bg-gray-50 rounded-md p-2 md:p-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={statistics.magnitudeTimeline || []}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} fontSize={9} />
                                  <YAxis fontSize={11} />
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload[0]) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                                            <p className="font-semibold text-xs">Tarih: {data.date}</p>
                                            <p className="text-xs text-gray-600">Ortalama Büyüklük: M {data.avgMagnitude.toFixed(2)}</p>
                                            <p className="text-xs text-gray-600">Sayı: {data.count}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Line type="monotone" dataKey="avgMagnitude" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-gray-700">Derinlik Trendi</div>
                            <div className="w-full h-48 md:h-64 bg-gray-50 rounded-md p-2 md:p-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={statistics.depthTimeline || []}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} fontSize={9} />
                                  <YAxis fontSize={11} />
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload[0]) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                                            <p className="font-semibold text-xs">Tarih: {data.date}</p>
                                            <p className="text-xs text-gray-600">Ortalama Derinlik: {data.avgDepth.toFixed(1)} km</p>
                                            <p className="text-xs text-gray-600">Sayı: {data.count}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Line type="monotone" dataKey="avgDepth" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-gray-700">En Çok Deprem Olan Lokasyonlar</div>
                            <div className="w-full h-64 bg-gray-50 rounded-md p-4 overflow-y-auto">
                              <div className="space-y-2">
                                {(statistics.topLocations || []).length > 0 ? (
                                  (statistics.topLocations || []).map((loc: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                                          index === 0 ? 'bg-yellow-500 text-white' :
                                          index === 1 ? 'bg-gray-400 text-white' :
                                          index === 2 ? 'bg-amber-600 text-white' :
                                          'bg-gray-200 text-gray-700'
                                        }`}>
                                          {index + 1}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{loc.location}</span>
                                      </div>
                                      <span className="text-sm font-semibold text-gray-700">{loc.count}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-gray-500 text-center py-4">Veri yok</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                          <div className="p-4 bg-red-50 rounded-md border border-red-200">
                            <div className="text-xs text-red-700 font-medium mb-1">Risk Skoru</div>
                            <div className="text-2xl font-bold text-red-900">{(statistics.riskScore || 0).toFixed(1)}</div>
                            <div className="text-xs text-red-600 mt-1">Sayı × Ort. Büyüklük</div>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                            <div className="text-xs text-blue-700 font-medium mb-1">Aktivite Seviyesi</div>
                            <div className="text-2xl font-bold text-blue-900">{(statistics.activityLevel || 0).toFixed(1)}</div>
                            <div className="text-xs text-blue-600 mt-1">Günlük Ortalama</div>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-md border border-purple-200">
                            <div className="text-xs text-purple-700 font-medium mb-1">Güçlü Depremler</div>
                            <div className="text-2xl font-bold text-purple-900">{statistics.strongEarthquakeCount || 0}</div>
                            <div className="text-xs text-purple-600 mt-1">M ≥ 5.0</div>
                          </div>
                          <div className="p-4 bg-orange-50 rounded-md border border-orange-200">
                            <div className="text-xs text-orange-700 font-medium mb-1">Sığ Depremler</div>
                            <div className="text-2xl font-bold text-orange-900">{statistics.shallowEarthquakeCount || 0}</div>
                            <div className="text-xs text-orange-600 mt-1">Derinlik &lt; 10 km</div>
                          </div>
                        </div>

                        {statistics.avgInterval > 0 && statistics.timeIntervals && statistics.timeIntervals.length > 0 && (
                          <div className="p-4 bg-indigo-50 rounded-md border border-indigo-200">
                            <div className="text-sm font-semibold text-indigo-900 mb-2">Depremler Arası Süre Analizi</div>
                            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                              <div className="flex-1">
                                <div className="text-xs text-indigo-700 mb-1">Ortalama Süre</div>
                                <div className="text-xl font-bold text-indigo-900">
                                  {statistics.avgInterval < 1 
                                    ? `${(statistics.avgInterval * 60).toFixed(1)} dakika`
                                    : `${statistics.avgInterval.toFixed(1)} saat`
                                  }
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-indigo-700 mb-1">En Kısa Süre</div>
                                <div className="text-xl font-bold text-indigo-900">
                                  {Math.min(...statistics.timeIntervals) < 1
                                    ? `${(Math.min(...statistics.timeIntervals) * 60).toFixed(1)} dakika`
                                    : `${Math.min(...statistics.timeIntervals).toFixed(1)} saat`
                                  }
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-indigo-700 mb-1">En Uzun Süre</div>
                                <div className="text-xl font-bold text-indigo-900">
                                  {Math.max(...statistics.timeIntervals) < 24
                                    ? `${Math.max(...statistics.timeIntervals).toFixed(1)} saat`
                                    : `${(Math.max(...statistics.timeIntervals) / 24).toFixed(1)} gün`
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-700">Büyüklük (M)</div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Maksimum:</span>
                            <span className="font-medium text-gray-900">{statistics.maxMagnitude.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Minimum:</span>
                            <span className="font-medium text-gray-900">{statistics.minMagnitude.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ortalama:</span>
                            <span className="font-medium text-gray-900">{statistics.avgMagnitude.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-700">Derinlik (km)</div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Maksimum:</span>
                            <span className="font-medium text-gray-900">{statistics.maxDepth.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Minimum:</span>
                            <span className="font-medium text-gray-900">{statistics.minDepth.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ortalama:</span>
                            <span className="font-medium text-gray-900">{statistics.avgDepth.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Transition>
        </Transition>
      )}

      {showLegend && (
        <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-[60] bg-white rounded-lg shadow-lg border border-gray-200 p-2 md:p-4 w-[95vw] max-w-[600px] md:max-w-none md:w-auto">
          <div className="text-xs font-semibold text-gray-700 mb-1.5 md:mb-3 text-center">Büyüklük Referansı</div>
          <div className="flex items-center gap-2.5 md:gap-3 flex-wrap justify-center">
            <LegendItem magnitude={7.5} label="M 7.0+" markerSizeMultiplier={markerSizeMultiplier} />
            <LegendItem magnitude={6.5} label="M 6.0 - 6.9" markerSizeMultiplier={markerSizeMultiplier} />
            <LegendItem magnitude={5.5} label="M 5.0 - 5.9" markerSizeMultiplier={markerSizeMultiplier} />
            <LegendItem magnitude={4.5} label="M 4.0 - 4.9" markerSizeMultiplier={markerSizeMultiplier} />
            <LegendItem magnitude={3.5} label="M 3.0 - 3.9" markerSizeMultiplier={markerSizeMultiplier} />
            <LegendItem magnitude={2.0} label="M < 3.0" markerSizeMultiplier={markerSizeMultiplier} />
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ magnitude, label, markerSizeMultiplier = 1.0 }: { magnitude: number; label: string; markerSizeMultiplier?: number }) {
  const color = getMagnitudeColor(magnitude);
  const size = getMarkerSize(magnitude, 7, markerSizeMultiplier);
  const darkerColor = getMagnitudeColorDarker(magnitude);

  return (
    <div className="flex items-center gap-1.5 md:gap-2">
      <div
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${darkerColor} 100%)`,
          width: `${Math.max(8, size * 0.6)}px`,
          height: `${Math.max(8, size * 0.6)}px`,
          borderRadius: '50%',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          flexShrink: 0,
        }}
        className="md:hidden"
      ></div>
      <div
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${darkerColor} 100%)`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          flexShrink: 0,
        }}
        className="hidden md:block"
      ></div>
      <span className="text-[10px] md:text-xs text-gray-600 whitespace-nowrap">{label}</span>
    </div>
  );
}
