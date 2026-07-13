/**
 * Resolves a photo URL for <img src>.
 *
 * Profile photos used to be stored as relative paths served by the backend
 * (e.g. "/uploads/avatar_1_abcd.jpg"), so the API origin had to be prepended.
 * Now they're stored on Cloudinary as full URLs (e.g.
 * "https://res.cloudinary.com/..."), which must NOT have the API origin
 * prepended. This helper handles both so old and new data keep working.
 */
export function resolvePhotoUrl(apiOrigin, url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return apiOrigin + url;
}
