const { randomBytes } = require('@app-core/randomness');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const creatorCardRepository = require('@app/repository/creator-card');
const Messages = require('@app/messages/creator-card');

const SLUG_REGEX = /^[A-Za-z0-9_-]+$/;
const ACCESS_CODE_REGEX = /^[A-Za-z0-9]{6}$/;
const URL_REGEX = /^https?:\/\//;
const SLUG_MIN_LENGTH = 5;
const SLUG_MAX_LENGTH = 50;
const SLUG_SUFFIX_LENGTH = 6;

function throwCreatorCardError(message, code) {
  throwAppError(message, code);
}

function ensureSlugFormat(slug) {
  if (slug && !SLUG_REGEX.test(slug)) {
    throwCreatorCardError(Messages.INVALID_SLUG, ERROR_CODE.VALIDATIONERR);
  }
}

function ensureAccessCodeFormat(accessCode) {
  if (accessCode && !ACCESS_CODE_REGEX.test(accessCode)) {
    throwCreatorCardError(Messages.INVALID_ACCESS_CODE, ERROR_CODE.VALIDATIONERR);
  }
}

function ensureUrls(links) {
  (links || []).forEach((link) => {
    if (!URL_REGEX.test(link.url)) {
      throwCreatorCardError(Messages.INVALID_URL, ERROR_CODE.VALIDATIONERR);
    }
  });
}

function ensureRates(serviceRates) {
  if (!serviceRates) return;

  const rates = serviceRates?.rates || [];

  if (!rates.length) {
    throwCreatorCardError(Messages.RATES_REQUIRED, ERROR_CODE.VALIDATIONERR);
  }
}

function slugifyTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
}

async function findActiveBySlug(slug) {
  return creatorCardRepository.findOne({
    query: {
      slug,
      deleted: null,
    },
  });
}

async function ensureProvidedSlugIsAvailable(slug) {
  if (!slug) return;

  const existing = await findActiveBySlug(slug);
  if (existing) {
    throwCreatorCardError(Messages.SLUG_TAKEN, 'SL02');
  }
}

async function createAvailableSuffixedSlug(suffixBase) {
  const suffixedSlug = `${suffixBase}-${randomBytes(SLUG_SUFFIX_LENGTH)}`;
  const existing = await findActiveBySlug(suffixedSlug);

  return existing ? createAvailableSuffixedSlug(suffixBase) : suffixedSlug;
}

async function createAvailableSlug(title) {
  const baseSlug = slugifyTitle(title) || 'card';
  const slug = baseSlug.substring(0, SLUG_MAX_LENGTH);
  const existing = slug.length >= SLUG_MIN_LENGTH ? await findActiveBySlug(slug) : null;

  if (slug.length < SLUG_MIN_LENGTH || existing) {
    const suffixBaseLength = SLUG_MAX_LENGTH - SLUG_SUFFIX_LENGTH - 1;
    const suffixBase = baseSlug.substring(0, suffixBaseLength) || 'card';
    return createAvailableSuffixedSlug(suffixBase);
  }

  return slug;
}

module.exports = {
  ensureSlugFormat,
  ensureAccessCodeFormat,
  ensureUrls,
  ensureRates,
  ensureProvidedSlugIsAvailable,
  createAvailableSlug,
  findActiveBySlug,
  throwCreatorCardError,
};
