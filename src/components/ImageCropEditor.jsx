import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

const ImageCropEditor = ({
  imageSrc,
  aspect = 1,
  onConfirm,
  onCancel,
  confirmLabel = 'Use this photo',
  processingLabel = 'Processing...',
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onConfirm(file);
    } catch (err) {
      console.error('Crop error:', err);
      alert('Could not process photo. Please try another image.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="relative w-full h-64 sm:h-80 bg-gray-900 rounded-lg overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid
        />
      </div>

      <div className="mt-4">
        <label htmlFor="crm-photo-crop-zoom" className="block text-sm font-medium text-gray-700 mb-1">
          Zoom
        </label>
        <input
          id="crm-photo-crop-zoom"
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
      </div>

      <p className="text-sm text-gray-500 mt-3">
        Drag to reposition. Use zoom so the face is framed correctly in the square crop.
      </p>

      <div className="flex items-center justify-end gap-3 mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          disabled={processing}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={processing || !croppedAreaPixels}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {processing ? processingLabel : confirmLabel}
        </button>
      </div>
    </div>
  );
};

export default ImageCropEditor;
