import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

interface FileUploadProps {
  label: string;
  value: string;
  onChange: (filePath: string) => void;
  accept?: string;
}

function FileUpload({ label, value, onChange, accept = 'image/*,.pdf' }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    setUploading(true);
    try {
      // Upload file to server
      const filePath = await api.upload.single(file);
      onChange(filePath);
      
      // Create preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelect(file || null);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelect(file || null);
  };

  // Update preview when value changes (for Cloudinary URLs)
  useEffect(() => {
    if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
      // It's a Cloudinary URL, use it as preview
      if (value.match(/\.(jpg|jpeg|png|gif|webp)$/i) || value.includes('image/upload')) {
        setPreview(value);
      } else {
        setPreview(null);
      }
    } else if (value && !preview) {
      // Local file path, clear preview
      setPreview(null);
    }
  }, [value]);

  const handleRemove = () => {
    onChange('');
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="space-y-2">
        {value && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-green-700 flex-1 truncate">{value}</span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        {preview && (
          <div className="border border-gray-300 rounded-lg p-2">
            <img src={preview} alt="Preview" className="max-w-full h-32 object-contain mx-auto" />
          </div>
        )}

        <div className={isMobile ? "flex gap-2" : ""}>
          <label className={isMobile ? "flex-1 cursor-pointer" : "block cursor-pointer"}>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? 'Uploading...' : '📁 Choose File'}
            </div>
          </label>
          
          {isMobile && (
            <label className="flex-1 cursor-pointer">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                disabled={uploading}
                className="hidden"
              />
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {uploading ? 'Uploading...' : '📷 Camera'}
              </div>
            </label>
          )}
        </div>
        
        <p className="text-xs text-gray-500">
          Max file size: 100MB | Accepted: Images (JPG, PNG, GIF), PDF, and Videos (MP4, MOV, AVI, WEBM, MKV)
        </p>
      </div>
    </div>
  );
}

export default FileUpload;

