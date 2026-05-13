// AI-Vaidya — FileUploadZone.jsx | MediVault Platform

import { useState, useRef } from 'react';
import { FiPaperclip, FiX, FiFile, FiImage } from 'react-icons/fi';

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
 * Compact inline file attachment trigger (paperclip icon).
 * Shows a preview chip once a file is selected.
 * Converts the file to base64 and calls onFileReady.
 *
 * Props:
 *   allowedTypes  string[]   — e.g. ["pdf","jpg","png","webp"]
 *   onFileReady   (base64: string, mimeType: string, fileName: string) => void
 *   onClear       () => void — called when user removes the file
 */
export default function FileUploadZone({ allowedTypes = [], onFileReady, onClear }) {
  const [preview, setPreview] = useState(null); // { name, size, type }
  const [error, setError]     = useState(null);
  const [progress, setProgress] = useState(0);  // 0-100, 100 = done
  const inputRef = useRef(null);

  const acceptAttr = allowedTypes
    .map(ext => MIME_MAP[ext] || `.${ext}`)
    .join(',');

  function handleFile(file) {
    setError(null);

    // Size check
    if (file.size > MAX_SIZE_BYTES) {
      setError(`File too large. Maximum size is 10 MB.`);
      return;
    }

    // Extension/MIME check
    const ext = file.name.split('.').pop().toLowerCase();
    if (allowedTypes.length > 0 && !allowedTypes.includes(ext)) {
      setError(`File type .${ext} is not allowed. Accepted: ${allowedTypes.join(', ')}`);
      return;
    }

    // Simulate progress
    setProgress(0);
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 90));
      }
    };

    reader.onload = (e) => {
      setProgress(100);
      const base64 = e.target.result.split(',')[1]; // strip data:...;base64,
      const mimeType = MIME_MAP[ext] || file.type || 'application/octet-stream';
      setPreview({ name: file.name, size: file.size, type: ext });
      onFileReady(base64, mimeType, file.name);
    };

    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      setProgress(0);
    };

    reader.readAsDataURL(file);
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected after clearing
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleClear() {
    setPreview(null);
    setProgress(0);
    setError(null);
    onClear?.();
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ── Preview chip (after file selected) ──
  if (preview) {
    return (
      <div className="mx-3 mb-2">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          {preview.type === 'pdf'
            ? <FiFile className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            : <FiImage className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{preview.name}</p>
            <p className="text-[10px] text-gray-400">{formatSize(preview.size)}</p>
            {progress < 100 && (
              <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full aivaidya-progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
            aria-label="Remove file"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="mx-3 mb-2">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <p className="text-xs text-red-600 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Trigger button (paperclip icon) ──
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload health document"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50"
        title={`Upload document (${allowedTypes.join(', ')})`}
        aria-label="Attach file"
      >
        <FiPaperclip className="w-4 h-4" />
      </button>
    </>
  );
}
