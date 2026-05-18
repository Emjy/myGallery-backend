/**
 * Migration ImgBB → Cloudinary
 * Usage : IMGBB_LID=xxx IMGBB_PHPSESSID=yyy node migrate-imgbb.js
 */

require('dotenv').config();

const axios    = require('axios');
const cloudinary = require('cloudinary').v2;
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const LID       = process.env.IMGBB_LID;
const PHPSESSID = process.env.IMGBB_PHPSESSID;

if (!LID || !PHPSESSID) {
  console.error('Usage : IMGBB_LID=xxx IMGBB_PHPSESSID=yyy node migrate-imgbb.js');
  process.exit(1);
}

const COOKIE  = `LID=${LID}; PHPSESSID=${PHPSESSID}`;
const UA      = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36';

async function getCsrfToken() {
  const { data } = await axios.get('https://imgbb.com/', {
    headers: { Cookie: COOKIE, 'User-Agent': UA },
    timeout: 15000,
  });
  const m = data.match(/PF\.obj\.config\.auth_token\s*=\s*["']([^"']+)/);
  if (!m) throw new Error('CSRF token introuvable — vérifie tes cookies');
  return m[1];
}

async function fetchPage(authToken, page) {
  const params = new URLSearchParams({
    auth_token: authToken,
    action: 'list',
    list: 'images',
    sort: 'date_desc',
    page: String(page),
    per_page: '100',
    type: 'account',
    content_type: 'all',
  });

  const { data } = await axios.post('https://imgbb.com/json', params.toString(), {
    headers: {
      Cookie: COOKIE,
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: 'https://imgbb.com/',
    },
    timeout: 20000,
  });

  return data;
}

async function fetchAllImages(authToken) {
  const images = [];
  let page = 1;

  while (true) {
    console.log(`  Page ${page}…`);
    const data = await fetchPage(authToken, page);

    if (data.status_code && data.status_code !== 200) {
      console.error('  Erreur API:', JSON.stringify(data));
      break;
    }

    const items = data?.images?.items;
    if (!items) {
      console.log('  Réponse:', JSON.stringify(data).slice(0, 200));
      break;
    }

    const list = Array.isArray(items) ? items : Object.values(items);
    if (list.length === 0) break;

    images.push(...list);
    console.log(`  ${images.length} images trouvées`);
    if (list.length < 100) break;
    page++;
  }

  return images;
}

async function uploadToCloudinary(imageUrl, name, index) {
  const tmpFile = path.join(os.tmpdir(), `imgbb_${Date.now()}_${index}`);
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { 'User-Agent': UA },
    });
    fs.writeFileSync(tmpFile, response.data);

    const publicId = (name || `img_${index}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    const result = await cloudinary.uploader.upload(tmpFile, {
      folder: 'artpapa/imported',
      public_id: `${publicId}_${index}`,
      overwrite: false,
      resource_type: 'image',
    });

    return result.secure_url;
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

async function main() {
  console.log('Récupération du token CSRF…');
  const authToken = await getCsrfToken();
  console.log('Token OK\n');

  console.log('Listing des images ImgBB…\n');
  const images = await fetchAllImages(authToken);

  if (images.length === 0) {
    console.log('Aucune image trouvée.');
    return;
  }

  console.log(`\n${images.length} image(s) à migrer vers Cloudinary.\n`);

  const results = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const url  = img.image?.url || img.url || img.display_url;
    const name = img.title || img.name || img.id;
    console.log(`[${i + 1}/${images.length}] ${name}`);

    if (!url) { console.log('  ✗ URL manquante'); continue; }

    try {
      const cloudUrl = await uploadToCloudinary(url, name, i + 1);
      console.log(`  ✓ ${cloudUrl}`);
      results.push({ id: img.id, name, imgbbUrl: url, cloudinaryUrl: cloudUrl });
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
      results.push({ id: img.id, name, imgbbUrl: url, cloudinaryUrl: null });
    }
  }

  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  const csvPath = path.join(__dirname, 'data/migration-imgbb.csv');
  const csv = ['id,name,imgbb_url,cloudinary_url']
    .concat(results.map(r =>
      `${r.id},"${(r.name||'').replace(/"/g,'""')}","${r.imgbbUrl}","${r.cloudinaryUrl||''}"`
    ))
    .join('\n');
  fs.writeFileSync(csvPath, csv);

  const ok = results.filter(r => r.cloudinaryUrl).length;
  console.log(`\n✓ ${ok}/${images.length} images migrées`);
  console.log(`  CSV : ${csvPath}`);
}

main().catch(err => {
  console.error('\nErreur fatale :', err.message);
  process.exit(1);
});
