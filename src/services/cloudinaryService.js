/**
 * Cloudinary Media Service for Madrasa App
 * Handles direct client-side uploads, image optimization, and URL generation.
 */

// Default Configuration (Can be overridden by environment variables)
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'be2c3qhp',
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'madrasa_photos',
};

/**
 * Upload an image (Blob, File, or base64 Data URL) directly to Cloudinary
 * 
 * @param {Blob|File|string} fileOrDataUrl - The image to upload
 * @param {Object} options
 * @param {string} [options.folder] - e.g. 'madrasas/8943/students'
 * @param {string} [options.publicId] - custom public ID (e.g. 'student_12_avatar')
 * @param {Array<string>} [options.tags] - tags for grouping (e.g. ['student', '8943'])
 * @returns {Promise<{ secure_url: string, public_id: string, format: string, width: number, height: number }>}
 */
export async function uploadToCloudinary(fileOrDataUrl, options = {}) {
  const { folder, publicId, tags = [] } = options;

  if (!CLOUDINARY_CONFIG.cloudName || CLOUDINARY_CONFIG.cloudName === 'YOUR_CLOUD_NAME') {
    throw new Error('Cloudinary Cloud Name is not configured. Please set REACT_APP_CLOUDINARY_CLOUD_NAME.');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  const formData = new FormData();

  formData.append('file', fileOrDataUrl);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  if (folder) {
    formData.append('folder', folder);
  }

  if (publicId) {
    formData.append('public_id', publicId);
  }

  if (tags && tags.length > 0) {
    formData.append('tags', tags.join(','));
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `Upload failed with HTTP ${response.status}`;
    throw new Error(`Cloudinary Error: ${message}`);
  }

  const data = await response.json();

  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    format: data.format,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
  };
}

/**
 * Transform a Cloudinary URL with dynamic optimizations (auto format, auto quality, resize, face crop)
 * 
 * @param {string} url - Original Cloudinary URL
 * @param {Object} [options]
 * @param {number} [options.width=300] - Desired width
 * @param {number} [options.height=300] - Desired height
 * @param {string} [options.crop='fill'] - Crop mode ('fill', 'thumb', 'scale', 'fit')
 * @param {string} [options.gravity='face'] - Focus point ('face', 'auto', 'center')
 * @param {string} [options.quality='auto'] - Quality setting ('auto', 'auto:best', 'auto:eco', '80')
 * @param {string} [options.format='auto'] - Output format ('auto' for WebP/AVIF, 'jpg', 'png')
 * @returns {string} Optimized URL
 */
export function getOptimizedCloudinaryUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return '';

  // If it's not a Cloudinary URL, return as-is
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  const {
    width = 300,
    height = 300,
    crop = 'fill',
    gravity = 'face',
    quality = 'auto',
    format = 'auto',
  } = options;

  // Cloudinary transformations: c_fill,g_face,w_300,h_300,q_auto,f_auto
  const transformation = [
    `c_${crop}`,
    gravity ? `g_${gravity}` : '',
    width ? `w_${width}` : '',
    height ? `h_${height}` : '',
    `q_${quality}`,
    `f_${format}`,
  ].filter(Boolean).join(',');

  // Insert transformation after `/upload/`
  return url.replace('/upload/', `/upload/${transformation}/`);
}

/**
 * Generate standardized Cloudinary folder paths
 */
export const CloudinaryPaths = {
  studentPhotoFolder: (madrasaRegNumber) => `madrasas/${madrasaRegNumber}/students`,
  studentPublicId: (studentId) => `student_${studentId}`,
  madrasaLogoFolder: (madrasaRegNumber) => `madrasas/${madrasaRegNumber}/branding`,
  certificateFolder: (madrasaRegNumber) => `madrasas/${madrasaRegNumber}/certificates`,
  programFolder: (madrasaRegNumber) => `madrasas/${madrasaRegNumber}/programs`,
};
