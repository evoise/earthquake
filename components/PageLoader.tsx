import { Loader2 } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      </div>
    </div>
  );
}

