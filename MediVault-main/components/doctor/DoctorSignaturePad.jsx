/**
 * DoctorSignaturePad.jsx
 *
 * Canvas-based digital signature with two modes:
 *   1. Draw — mouse/touch freehand drawing on an HTML5 canvas
 *   2. Upload — pick a PNG/JPEG image file
 *
 * Props:
 *   initialUrl  {string|null}  – existing digitalSignatureUrl (data URL or HTTPS)
 *   doctorId    {string}       – Doctor row ID (for PUT /api/doctor/:id)
 *   onSaved     {Function}     – called with the saved data URL after successful save
 *   onClose     {Function}     – called when the modal/panel should close
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { FiSave, FiTrash2, FiUpload, FiEdit3, FiX, FiCheck } from "react-icons/fi";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";

const CANVAS_W = 520;
const CANVAS_H = 180;
const LINE_W   = 2.5;
const INK      = "#1e293b"; // slate-800

export default function DoctorSignaturePad({ initialUrl, doctorId, onSaved, onClose }) {
  const canvasRef   = useRef(null);
  const [mode, setMode]       = useState("draw");  // "draw" | "upload"
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [preview, setPreview] = useState(initialUrl || null);
  const [saving, setSaving]   = useState(false);
  const lastPos = useRef(null);

  // ── Canvas initialisation ───────────────────────────────────────────────────
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    setHasStrokes(false);
    lastPos.current = null;
  }, []);

  useEffect(() => {
    if (mode === "draw") clearCanvas();
  }, [mode, clearCanvas]);

  // ── Coordinate helpers ─────────────────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  // ── Drawing handlers ───────────────────────────────────────────────────────
  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);

    ctx.beginPath();
    ctx.strokeStyle = INK;
    ctx.lineWidth   = LINE_W;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;
    setHasStrokes(true);
  };

  const endDraw = (e) => {
    e.preventDefault();
    setDrawing(false);
    lastPos.current = null;
  };

  // ── Upload handler ─────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast.error("Only PNG or JPEG files are supported.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    let dataUrl;

    if (mode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasStrokes) {
        toast.error("Please draw your signature first.");
        return;
      }
      dataUrl = canvas.toDataURL("image/png");
    } else {
      if (!preview) {
        toast.error("Please upload a signature image first.");
        return;
      }
      dataUrl = preview;
    }

    try {
      setSaving(true);
      await apiClient.put(`/doctor/${doctorId}`, { digitalSignatureUrl: dataUrl });
      toast.success("Signature saved successfully!");
      setPreview(dataUrl);
      if (onSaved) onSaved(dataUrl);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Failed to save signature.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-cyan-500 to-teal-500">
        <div className="flex items-center gap-2">
          <FiEdit3 className="text-white text-lg" />
          <h3 className="font-bold text-white text-base">Digital Signature</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <FiX size={20} />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Mode toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {["draw", "upload"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setPreview(m === "upload" ? (initialUrl || null) : null); }}
              className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                mode === m
                  ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {m === "draw" ? <FiEdit3 size={14} /> : <FiUpload size={14} />}
              {m === "draw" ? "Draw Signature" : "Upload Image"}
            </button>
          ))}
        </div>

        {/* Draw mode */}
        {mode === "draw" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Draw your signature below using mouse or touch.
            </p>
            <div
              className="relative rounded-xl border-2 border-dashed border-cyan-300 bg-gray-50 overflow-hidden cursor-crosshair"
              style={{ width: "100%", aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                style={{ width: "100%", height: "100%", display: "block" }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              {!hasStrokes && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-sm text-gray-400 select-none">Sign here…</p>
                </div>
              )}
            </div>
            <button
              onClick={clearCanvas}
              disabled={!hasStrokes}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
            >
              <FiTrash2 size={13} />
              Clear
            </button>
          </div>
        )}

        {/* Upload mode */}
        {mode === "upload" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Upload a PNG or JPEG of your handwritten signature (max 2 MB).
            </p>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-cyan-300 rounded-xl bg-gray-50 cursor-pointer hover:bg-cyan-50 transition-colors">
              <FiUpload className="text-cyan-400 mb-2" size={24} />
              <span className="text-sm text-gray-500">Click to browse or drag &amp; drop</span>
              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileChange} />
            </label>
            {preview && preview.startsWith("data:image") && (
              <div className="rounded-xl border border-gray-200 p-2 bg-white">
                <img src={preview} alt="Signature preview" className="max-h-24 object-contain mx-auto" />
              </div>
            )}
          </div>
        )}

        {/* Current saved signature (if any and not in draw mode) */}
        {initialUrl && mode === "upload" && !preview && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
            <p className="text-xs font-semibold text-teal-700 mb-1">Current saved signature:</p>
            {initialUrl.startsWith("data:image") || initialUrl.startsWith("http") ? (
              <img src={initialUrl} alt="Current signature" className="max-h-20 object-contain" />
            ) : (
              <p className="text-xs text-gray-500">{initialUrl}</p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-60"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <FiSave size={15} />
                Save Signature
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
