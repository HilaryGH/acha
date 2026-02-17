import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

interface VideoUploadProps {
  label: string;
  value: string;
  onChange: (filePath: string) => void;
  maxDuration?: number; // Duration in minutes, default 30 seconds
}

function VideoUpload({ label, value, onChange, maxDuration = 0.5 }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Convert minutes to seconds for validation
  const maxDurationSeconds = maxDuration * 60;

  const validateVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        if (duration <= maxDurationSeconds) {
          resolve(true);
        } else {
          const maxMinutes = Math.floor(maxDuration);
          const maxSecs = (maxDurationSeconds % 60).toFixed(0);
          const durationMinutes = Math.floor(duration / 60);
          const durationSecs = (duration % 60).toFixed(0);
          reject(new Error(`Video must be ${maxMinutes > 0 ? `${maxMinutes} minute(s) ` : ''}${maxSecs !== '0' ? `${maxSecs} second(s)` : ''} or less. Your video is ${durationMinutes > 0 ? `${durationMinutes} minute(s) ` : ''}${durationSecs} second(s)`));
        }
      };
      
      video.onerror = () => {
        reject(new Error('Invalid video file'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    setError(null);
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    // Validate file size (max 100MB for longer videos, 50MB for short ones)
    const maxFileSize = maxDuration > 1 ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setError(`Video file size must be less than ${maxDuration > 1 ? '100MB' : '50MB'}`);
      return;
    }

    // Validate duration
    try {
      await validateVideoDuration(file);
    } catch (err: any) {
      setError(err.message || 'Video validation failed');
      return;
    }

    setUploading(true);
    try {
      // Upload file to server
      const filePath = await api.upload.single(file);
      onChange(filePath);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      setError(error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelect(file || null);
  };

  // Update preview when value changes (for Cloudinary URLs)
  useEffect(() => {
    if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
      // It's a Cloudinary URL, use it as preview
      if (value.match(/\.(mp4|mov|avi|webm|mkv)$/i) || value.includes('video/upload')) {
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
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.load();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="space-y-2">
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {value && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-green-700 flex-1 truncate">{value}</span>
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
            <video 
              ref={videoRef}
              src={preview} 
              controls 
              className="max-w-full h-48 object-contain mx-auto"
            />
          </div>
        )}

        <label className="block cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <div className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? 'Uploading...' : '🎥 Upload Video'}
          </div>
        </label>
        
        <p className="text-xs text-gray-500">
          Max duration: {maxDuration >= 1 ? `${maxDuration} minute(s)` : `${maxDurationSeconds} second(s)`} | Max file size: {maxDuration > 1 ? '100MB' : '50MB'} | Accepted: Video files (MP4, MOV, etc.)
        </p>
      </div>
    </div>
  );
}

export default VideoUpload;

