'use client';

import { useState, useCallback, useEffect } from 'react';

export type PermissionStatus = 'checking' | 'requesting' | 'granted' | 'denied' | 'no-device';

export function useCameraPermission(onCameraReadyChange: (isReady: boolean) => void) {
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('checking');
  const [error, setError] = useState<string | null>(null);

  // Function to check camera permission
  const checkPermission = useCallback(async () => {
    try {
      setPermissionStatus('checking');
      console.log('Checking webcam permissions...');

      // Check if we can enumerate devices first
      console.log('Attempting to enumerate devices...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');

      console.log(`Found ${videoDevices.length} video devices:`, videoDevices);

      if (videoDevices.length === 0) {
        console.log('No video devices found');
        setIsPermissionGranted(false);
        onCameraReadyChange(false);
        setPermissionStatus('no-device');
        return;
      }

      // Try to access the camera
      setPermissionStatus('requesting');
      console.log('Requesting camera access...');

      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      console.log('Using constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log('Camera access granted:', stream);
      console.log('Video tracks:', stream.getVideoTracks().length);

      if (stream.getVideoTracks().length > 0) {
        const trackSettings = stream.getVideoTracks()[0].getSettings();
        console.log('Video track settings:', trackSettings);
        console.log('Video track constraints:', stream.getVideoTracks()[0].getConstraints());
        console.log('Video track capabilities:', stream.getVideoTracks()[0].getCapabilities());
      } else {
        console.warn('No video tracks found in the stream');
      }

      setIsPermissionGranted(true);
      onCameraReadyChange(true);
      setPermissionStatus('granted');

      // Stop the stream immediately since we're just checking permission
      stream.getTracks().forEach((track) => {
        console.log(`Stopping check track: ${track.kind}, ID: ${track.id}, label: ${track.label}`);
        track.stop();
      });
    } catch (err) {
      console.error('Permission check failed:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Error details: ${errorMessage}`);
      setIsPermissionGranted(false);
      onCameraReadyChange(false);
      setPermissionStatus('denied');
      setError(`Camera access failed: ${errorMessage}`);
    }
  }, [onCameraReadyChange]);

  // Check for webcam permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    isPermissionGranted,
    permissionStatus,
    error,
    checkPermission,
    setError,
  };
}
