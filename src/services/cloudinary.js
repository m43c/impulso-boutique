const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

export const IMAGE_SIZES = {
  // Desktop table
  thumb: {
    width: 80,
    height: 80,
  },
  // Mobile card
  card: {
    width: 224,
    height: 224,
  },
  // Product details
  detail: {
    width: 600,
    crop: 'limit',
  },
}

export async function uploadImage(file) {
  if (!file) {
    throw new Error('No se proporcionó ningún archivo')
  }

  const formData = new FormData()

  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', FOLDER)

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || 'Error al subir la imagen a Cloudinary')
  }

  return response.json()
}

export function buildImageUrl(publicId, { width, height, crop = 'fill' } = {}) {
  if (!publicId) {
    return ''
  }

  const transforms = ['f_auto', 'q_auto']

  if (width) {
    transforms.push(`w_${width}`)
  }

  if (height) {
    transforms.push(`h_${height}`)
  }

  if (width || height) {
    transforms.push(`c_${crop}`)
  }

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms.join(',')}/${publicId}`
}
