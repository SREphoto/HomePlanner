
import React, { useState, useRef, useEffect, useCallback } from 'react';
import CloseIcon from './icons/CloseIcon';
import CaptureIcon from './icons/CaptureIcon';

interface CameraViewProps {
  onClose: () => void;
  onCapture: (imageData: string) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanupCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }, [stream]);

  useEffect(() => {
    const getCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please ensure you have given permission and that your camera is working.");
      }
    };

    getCamera();

    return () => {
      cleanupCamera();
    };
  }, [cleanupCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        // Remove the data URL prefix "data:image/jpeg;base64,"
        const base64Data = dataUrl.split(',')[1];
        onCapture(base64Data);
        cleanupCamera();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black animate-fade-in">
      {error ? (
        <div className="text-white text-center p-8 bg-red-800/50 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Camera Error</h2>
            <p className="mb-4">{error}</p>
            <button
                onClick={onClose}
                className="px-6 py-2 bg-white text-black font-semibold rounded-lg"
            >
                Close
            </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-3 bg-black/50 rounded-full text-white hover:bg-black/75 transition-colors"
              aria-label="Close camera view"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="absolute bottom-8 flex justify-center w-full">
            <button
              onClick={handleCapture}
              className="p-4 bg-white/30 rounded-full backdrop-blur-sm border-4 border-white/50 text-white hover:bg-white/50 transition-colors"
              aria-label="Capture photo"
            >
              <CaptureIcon />
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </div>
  );
};

export default CameraView;
