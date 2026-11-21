function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeImage(value) {
  const image = String(value || '').trim();
  if (!image) return '/images/Flow84.webp';
  if (/^https?:\/\//i.test(image)) return image;
  return image.startsWith('/') ? image : `/${image}`;
}

module.exports = {
  normalizeEmail,
  slugify,
  normalizeImage,
};
