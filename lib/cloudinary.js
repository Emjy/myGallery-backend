const cloudinary = require('cloudinary').v2;

// CLOUDINARY_URL est lu automatiquement depuis l'env
// Format : cloudinary://api_key:api_secret@cloud_name

async function uploadImage(filePath, folder = 'artpapa') {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
    transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

async function deleteImage(publicId) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadImage, deleteImage };
