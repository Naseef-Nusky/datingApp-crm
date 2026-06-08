/** File input accept + validation for profile photos */
export const PROFILE_IMAGE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif';

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']);

export const PROFILE_IMAGE_HINT = 'JPG, PNG, WebP, GIF, or HEIC';

const fileExtension = (name = '') => {
  const parts = String(name).toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
};

export const isHeicFile = (file) => {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  if (type.includes('heic') || type.includes('heif')) return true;
  const ext = fileExtension(file.name);
  return ext === 'heic' || ext === 'heif';
};

export const isAllowedProfileImageFile = (file) => {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  return ALLOWED_EXTENSIONS.has(fileExtension(file.name));
};

/** Browsers cannot crop/display HEIC — convert to JPEG before preview and upload. */
export const prepareProfileImageForUpload = async (file) => {
  if (!file || !isHeicFile(file)) return file;

  const heic2any = (await import('heic2any')).default;
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!blob) {
    throw new Error('HEIC conversion failed');
  }

  const baseName = String(file.name || 'photo').replace(/\.[^.]+$/i, '') || 'photo';
  return new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
};
