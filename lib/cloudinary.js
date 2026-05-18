const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// En local sans Cloudinary valide : stockage dans /public/uploads
const USE_LOCAL = process.env.USE_LOCAL_STORAGE === 'true';
const LOCAL_DIR = path.join(__dirname, '../public/uploads');
const LOCAL_BASE = process.env.LOCAL_BASE_URL || 'http://localhost:3000';

async function uploadImage(filePath, folder = 'artpapa') {
  if (USE_LOCAL) {
    if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
    const ext = path.extname(filePath) || '.jpg';
    const name = `${Date.now()}${ext}`;
    fs.copyFileSync(filePath, path.join(LOCAL_DIR, name));
    return { url: `${LOCAL_BASE}/uploads/${name}`, publicId: `local/${name}` };
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
    transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

async function deleteImage(publicId) {
  if (!publicId) return;
  if (USE_LOCAL || publicId.startsWith('local/')) {
    const name = publicId.replace('local/', '');
    const p = path.join(LOCAL_DIR, name);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    return;
  }
  await cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadImage, deleteImage };
