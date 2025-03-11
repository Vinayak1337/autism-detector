import React, { useRef, useEffect, useState } from 'react';

interface WebcamFeedProps {
  onStreamReady?: (stream: MediaStream) => void;
  className?: string;
  width?: number;
  height?: number;
  mirrored?: boolean;
}

export const WebcamFeed: React.FC<WebcamFeedProps> = ({
  onStreamReady,
  className = '',
  width = 640,
  height = 480,
  mirrored = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startWebcam = async () => {
      try {
        setIsLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: width },
            height: { ideal: height },
            facingMode: 'user',
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsLoading(false);
            if (onStreamReady) {
              onStreamReady(stream);
            }
          };
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError(
          'Unable to access webcam. Please ensure you have a webcam connected and have granted permission.'
        );
        setIsLoading(false);
      }
    };

    startWebcam();

    // Cleanup function to stop all tracks when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [width, height, onStreamReady]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 z-10 rounded">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 dark:bg-red-900/30 z-10 rounded p-4">
          <p className="text-red-600 dark:text-red-300 text-center text-sm">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`rounded ${mirrored ? 'transform -scale-x-100' : ''} ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
};
