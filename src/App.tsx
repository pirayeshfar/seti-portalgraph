import { useState, useCallback } from 'react';
import { PortalgraphScene } from './components/PortalgraphScene';
import { ModelUploader } from './components/ModelUploader';

type ModelType = 'obj' | 'gltf' | 'primitive';

export function App() {
  const [modelUrl, setModelUrl] = useState<string | undefined>(undefined);
  const [modelType, setModelType] = useState<ModelType>('primitive');
  const [showUploader, setShowUploader] = useState(false);
  const [key, setKey] = useState(0);

  const handleModelLoad = useCallback((url: string, type: 'obj' | 'gltf') => {
    setModelUrl(url);
    setModelType(type);
    setShowUploader(false);
    setKey(prev => prev + 1);
  }, []);

  const resetToDefault = useCallback(() => {
    setModelUrl(undefined);
    setModelType('primitive');
    setShowUploader(false);
    setKey(prev => prev + 1);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-black/30 backdrop-blur-md border-b border-cyan-500/20 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-lg sm:text-xl">🔮</span>
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                SETI@Portalgraph
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">3D Hologram Effect Demo</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowUploader(!showUploader)}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                showUploader 
                  ? 'bg-cyan-500 text-black' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              📦 <span className="hidden sm:inline">{showUploader ? 'بستن' : 'آپلود مدل'}</span>
              <span className="sm:hidden">{showUploader ? '✕' : '+'}</span>
            </button>
            
            {modelUrl && (
              <button
                onClick={resetToDefault}
                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
              >
                🔄 <span className="hidden sm:inline">بازنشانی</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content - flexible height */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* 3D Scene */}
        <div className={`flex-1 p-2 sm:p-4 transition-all min-h-0 ${showUploader ? 'lg:pr-[340px]' : ''}`}>
          <div className="h-full relative">
            <PortalgraphScene 
              key={key}
              modelUrl={modelUrl} 
              modelType={modelType} 
            />
            
            {/* Decorative corners - hidden on mobile */}
            <div className="hidden sm:block absolute top-0 left-0 w-12 sm:w-16 h-12 sm:h-16 border-l-2 border-t-2 border-cyan-500/50 rounded-tl-xl pointer-events-none" />
            <div className="hidden sm:block absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 border-r-2 border-t-2 border-cyan-500/50 rounded-tr-xl pointer-events-none" />
            <div className="hidden sm:block absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 border-l-2 border-b-2 border-cyan-500/50 rounded-bl-xl pointer-events-none" />
            <div className="hidden sm:block absolute bottom-0 right-0 w-12 sm:w-16 h-12 sm:h-16 border-r-2 border-b-2 border-cyan-500/50 rounded-br-xl pointer-events-none" />
          </div>
        </div>

        {/* Upload sidebar - overlay on mobile, side panel on desktop */}
        {showUploader && (
          <>
            {/* Mobile overlay background */}
            <div 
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowUploader(false)}
            />
            
            {/* Sidebar */}
            <aside className="fixed lg:absolute right-0 top-16 lg:top-0 bottom-16 lg:bottom-0 w-[85%] sm:w-80 p-3 sm:p-4 overflow-auto bg-gray-900/95 lg:bg-transparent z-50 lg:z-auto">
              <ModelUploader onModelLoad={handleModelLoad} />
              
              {/* Info - hidden on small mobile */}
              <div className="mt-4 bg-gray-900/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-purple-500/30" dir="rtl">
                <h4 className="font-bold text-purple-400 mb-2 text-sm">چگونه کار می‌کند؟</h4>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  این افکت با استفاده از تکنیک <span className="text-cyan-400">Off-axis Projection</span> کار می‌کند. 
                  با ردیابی موقعیت سر شما نسبت به صفحه نمایش، پرسپکتیو تغییر می‌کند.
                </p>
              </div>

              {/* Technical details - hidden on mobile */}
              <div className="hidden sm:block mt-4 bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30" dir="rtl">
                <h4 className="font-bold text-blue-400 mb-2">جزئیات فنی</h4>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>ردیابی چهره با تشخیص رنگ پوست</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>محاسبه frustum نامتقارن</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>پشتیبانی از OBJ و GLTF</span>
                  </li>
                </ul>
              </div>
            </aside>
          </>
        )}
      </main>

      {/* Footer - fixed height */}
      <footer className="flex-shrink-0 bg-black/50 backdrop-blur-sm border-t border-gray-800 py-2 px-3 sm:px-4 z-40">
        <div className="max-w-7xl mx-auto">
          {/* Single line on mobile, two lines on desktop */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-center">
            <span className="text-[10px] sm:text-xs text-gray-500">
              Portalgraph - الهام گرفته از تکنولوژی واقعی هولوگرام LCD
            </span>
            <span className="hidden sm:inline text-gray-600">|</span>
            <span className="text-[10px] sm:text-xs" dir="rtl">
              <span className="text-gray-500">ایده، طراحی و توسعه:</span>{' '}
              <span className="font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                امیرسامان پیرایش‌فر
              </span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
