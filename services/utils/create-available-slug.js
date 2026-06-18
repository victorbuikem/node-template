const { randomBytes } = require('@app-core/randomness');
const slugifyTitle = require('@app/services/utils/slugify-title');
const findCardBySlug = require('./find-card-by-slug');

const SLUG_MIN_LENGTH = 5;
const SLUG_MAX_LENGTH = 50;
const SLUG_SUFFIX_LENGTH = 6;

async function createAvailableSuffixedSlug(suffixBase) {
  const suffixedSlug = `${suffixBase}-${randomBytes(SLUG_SUFFIX_LENGTH)}`;
  const existing = await findCardBySlug(suffixedSlug);

  return existing ? createAvailableSuffixedSlug(suffixBase) : suffixedSlug;
}

async function createAvailableSlug(title) {
  const baseSlug = slugifyTitle(title) || 'card';
  const slug = baseSlug.substring(0, SLUG_MAX_LENGTH);
  const existing = slug.length >= SLUG_MIN_LENGTH ? await findCardBySlug(slug) : null;

  if (slug.length < SLUG_MIN_LENGTH || existing) {
    const suffixBaseLength = SLUG_MAX_LENGTH - SLUG_SUFFIX_LENGTH - 1;
    const suffixBase = baseSlug.substring(0, suffixBaseLength) || 'card';
    return createAvailableSuffixedSlug(suffixBase);
  }

  return slug;
}

module.exports = createAvailableSlug;
