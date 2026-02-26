import { useState, useCallback } from 'react';

interface ModelUploaderProps {
  onModelLoad: (url: string, type: 'obj' | 'gltf') => void;
}

export function ModelUploader({ onModelLoad }: ModelUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'obj') {
      const url = URL.createObjectURL(file);
      setFileName(file.name);
      onModelLoad(url, 'obj');
    } else if (extension === 'glb' || extension === 'gltf') {
      const url = URL.createObjectURL(file);
      setFileName(file.name);
      onModelLoad(url, 'gltf');
    } else {
      alert('فرمت فایل پشتیبانی نمی‌شود. لطفاً از .obj, .glb یا .gltf استفاده کنید.');
    }
  }, [onModelLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30">
      <h3 className="text-lg font-bold text-cyan-400 mb-4 text-right" dir="rtl">
        آپلود مدل سه‌بعدی
      </h3>
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-cyan-400 bg-cyan-500/10' 
            : 'border-gray-600 hover:border-cyan-500/50 hover:bg-gray-800/50'
          }
        `}
      >
        <input
          type="file"
          accept=".obj,.glb,.gltf"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="text-4xl mb-3">📦</div>
        
        {fileName ? (
          <div className="text-cyan-400">
            <span className="text-green-400">✓</span> {fileName}
          </div>
        ) : (
          <>
            <p className="text-gray-300 mb-2" dir="rtl">
              فایل مدل را اینجا بکشید و رها کنید
            </p>
            <p className="text-gray-500 text-sm" dir="rtl">
              یا کلیک کنید برای انتخاب فایل
            </p>
            <p className="text-gray-600 text-xs mt-2">
              (.obj, .glb, .gltf)
            </p>
          </>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-400 space-y-1" dir="rtl">
        <p>فرمت‌های پشتیبانی شده:</p>
        <ul className="list-disc list-inside text-gray-500 space-y-1 mr-4">
          <li><span className="text-cyan-500">.OBJ</span> - Wavefront OBJ</li>
          <li><span className="text-cyan-500">.GLB/.GLTF</span> - GL Transmission Format</li>
        </ul>
      </div>
    </div>
  );
}
