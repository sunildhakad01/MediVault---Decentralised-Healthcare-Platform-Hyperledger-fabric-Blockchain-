// AI-Vaidya — useFileUpload.js | MediVault Platform

import { useState, useCallback } from 'react';

const MIME_MAP = {
  pdf:  'application/pdf',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  dcm:  'application/dicom',
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Hook that manages file selection, validation, and base64 conversion
 * for the AI-Vaidya chat interface.
 *
 * Returns:
 *   file           { name, size, type, base64, mimeType } | null
 *   uploadProgress number 0-100
 *   uploadError    string | null
 *   handleFile     (file: File, allowedTypes: string[]) => void
 *   clearFile      () => void
 */
export function useFileUpload() {
  const [file,           setFile]           = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError,    setUploadError]    = useState(null);

  const clearFile = useCallback(() => {
    setFile(null);
    setUploadProgress(0);
    setUploadError(null);
  }, []);

  const handleFile = useCallback((rawFile, allowedTypes = []) => {
    setUploadError(null);
    setFile(null);
    setUploadProgress(0);

    if (!rawFile) return;

    // Size check
    if (rawFile.size > MAX_SIZE_BYTES) {
      setUploadError('File too large. Maximum size is 10 MB.');
      return;
    }

    // Extension / MIME check
    const ext = rawFile.name.split('.').pop().toLowerCase();
    if (allowedTypes.length > 0 && !allowedTypes.includes(ext)) {
      setUploadError(`File type .${ext} is not allowed. Accepted: ${allowedTypes.join(', ')}`);
      return;
    }

    const mimeType = MIME_MAP[ext] || rawFile.type || 'application/octet-stream';

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 90));
      }
    };

    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1]; // strip data URI prefix
      setUploadProgress(100);
      setFile({
        name:     rawFile.name,
        size:     rawFile.size,
        type:     ext,
        base64,
        mimeType,
        previewUrl: rawFile.type.startsWith('image/')
          ? URL.createObjectURL(rawFile)
          : null,
      });
    };

    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again.');
      setUploadProgress(0);
    };

    reader.readAsDataURL(rawFile);
  }, []);

  return { file, uploadProgress, uploadError, handleFile, clearFile };
}
