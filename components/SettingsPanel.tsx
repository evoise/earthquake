'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, X, RotateCcw, Info, MousePointerClick, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Transition } from '@headlessui/react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export default function SettingsPanel({
  isOpen,
  onClose,
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
  totalMarkers = 0,
  visibleMarkers = 0,
  onResetZoom,
}: SettingsPanelProps) {
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
          <Card className="border-gray-200">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-700" />
                <CardTitle className="text-sm font-semibold text-gray-900">Harita İstatistikleri</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Toplam Marker</div>
                  <div className="text-lg font-semibold text-gray-900">{totalMarkers}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Görünen Marker</div>
                  <div className="text-lg font-semibold text-gray-900">{visibleMarkers}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div>
            <Label className="text-sm font-semibold text-gray-900 mb-3 block">
              Harita Kontrolleri
            </Label>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <MousePointerClick className="h-3.5 w-3.5 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>Marker'a tıklayarak detayları görüntüleyin</span>
              </div>
              <div className="flex items-start gap-2">
                <Move className="h-3.5 w-3.5 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>Fareyi sürükleyerek haritayı kaydırın</span>
              </div>
              <div className="flex items-start gap-2">
                <ZoomIn className="h-3.5 w-3.5 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>Scroll ile yakınlaştırın/uzaklaştırın</span>
              </div>
              <div className="flex items-start gap-2">
                <ZoomOut className="h-3.5 w-3.5 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>Çift tıklayarak yakınlaştırın</span>
              </div>
            </div>
            {onResetZoom && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onResetZoom}
                  className="w-full bg-white text-gray-900 hover:bg-gray-50 border-gray-200 text-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                  Haritayı Sıfırla
                </Button>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-semibold text-gray-900 mb-3 block">
              Harita Stili
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={mapStyle === 'light' ? 'default' : 'outline'}
                onClick={() => onMapStyleChange('light')}
                className={`text-sm ${mapStyle === 'light' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                Normal
              </Button>
              <Button
                type="button"
                variant={mapStyle === 'satellite' ? 'default' : 'outline'}
                onClick={() => onMapStyleChange('satellite')}
                className={`text-sm ${mapStyle === 'satellite' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                Uydu
              </Button>
              <Button
                type="button"
                variant={mapStyle === 'terrain' ? 'default' : 'outline'}
                onClick={() => onMapStyleChange('terrain')}
                className={`text-sm ${mapStyle === 'terrain' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                Topografya
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-semibold text-gray-900 mb-3 block">
              Deprem Marker Boyutu
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={markerSizeMultiplier === 0.5 ? 'default' : 'outline'}
                onClick={() => onMarkerSizeMultiplierChange(0.5)}
                className={`text-sm ${markerSizeMultiplier === 0.5 ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                Küçük
              </Button>
              <Button
                type="button"
                variant={markerSizeMultiplier === 1.0 ? 'default' : 'outline'}
                onClick={() => onMarkerSizeMultiplierChange(1.0)}
                className={`text-sm ${markerSizeMultiplier === 1.0 ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                Normal
              </Button>
              <Button
                type="button"
                variant={markerSizeMultiplier === 1.5 ? 'default' : 'outline'}
                onClick={() => onMarkerSizeMultiplierChange(1.5)}
                className={`text-sm ${markerSizeMultiplier === 1.5 ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                Büyük
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">Harita Katmanları</Label>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="tectonic-plates"
                checked={showTectonicPlates}
                onCheckedChange={(checked) => onShowTectonicPlatesChange(!!checked)}
              />
              <Label htmlFor="tectonic-plates" className="text-sm text-gray-900 cursor-pointer">
                Tektonik Plaka Sınırları
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="turkey-faults"
                checked={showTurkeyFaults}
                onCheckedChange={(checked) => onShowTurkeyFaultsChange(!!checked)}
              />
              <Label htmlFor="turkey-faults" className="text-sm text-gray-900 cursor-pointer">
                Türkiye Fay Hatları
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="cities"
                checked={showCities}
                onCheckedChange={(checked) => onShowCitiesChange(!!checked)}
              />
              <Label htmlFor="cities" className="text-sm text-gray-900 cursor-pointer">
                Şehir Sınırları
              </Label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wave-animation"
                  checked={showWaveAnimation}
                  onCheckedChange={(checked) => onShowWaveAnimationChange(!!checked)}
                />
                <Label htmlFor="wave-animation" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Son Deprem Dalga Animasyonu
                </Label>
              </div>
              <p className="text-xs text-gray-600 ml-6">
                Son depremin etrafında dalga animasyonu gösterir. Bu animasyon, depremin merkez üssünden yayılan dalgaları görselleştirir.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="legend"
                checked={showLegend}
                onCheckedChange={(checked) => onShowLegendChange(!!checked)}
              />
              <Label htmlFor="legend" className="text-sm text-gray-900 cursor-pointer">
                Büyüklük Referansı
              </Label>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
}

