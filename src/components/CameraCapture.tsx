import React, { useRef, useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Tidak dapat mengakses kamera. Pastikan izin telah diberikan.');
        console.error("Error accessing camera:", err);
      }
    };

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Reduce image quality to save space in localStorage
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded shadow-2xl max-w-lg w-full border border-[#e9ecef] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#e9ecef] bg-[#f8f9fa]">
          <h3 className="font-bold text-[#343a40] flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-600" />
            Ambil Foto Kehadiran
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-[#dee2e6] rounded transition-colors text-[#6c757d]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 bg-black relative flex flex-col items-center justify-center min-h-[300px]">
          {error ? (
            <p className="text-red-400 text-center text-sm">{error}</p>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                className="max-w-full max-h-[60vh] object-contain rounded"
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>
        
        <div className="p-4 bg-[#f8f9fa] border-t border-[#e9ecef] flex justify-center">
          <button
            onClick={handleCapture}
            disabled={!!error || !stream}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-medium shadow-sm transition-all active:scale-95"
          >
            <Camera className="w-5 h-5" />
            Jepret Foto
          </button>
        </div>
      </div>
    </div>
  );
};
