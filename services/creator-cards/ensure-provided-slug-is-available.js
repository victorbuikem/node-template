const Messages = require('@app/messages/creator-card');
const findActiveBySlug = require('./find-active-by-slug');
const throwCreatorCardError = require('./throw-creator-card-error');

async function ensureProvidedSlugIsAvailable(slug) {
  if (!slug) return;

  const existing = await findActiveBySlug(slug);
  if (existing) {
    throwCreatorCardError(Messages.SLUG_TAKEN, 'SL02');
  }
}

module.exports = ensureProvidedSlugIsAvailable;
