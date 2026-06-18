const { ERROR_CODE } = require('@app-core/errors');
const Messages = require('@app/messages/creator-card');
const throwCreatorCardError = require('./throw-creator-card-error');

const SLUG_REGEX = /^[A-Za-z0-9_-]+$/;

function ensureSlugFormat(slug) {
  if (slug && !SLUG_REGEX.test(slug)) {
    throwCreatorCardError(Messages.INVALID_SLUG, ERROR_CODE.VALIDATIONERR);
  }
}

module.exports = ensureSlugFormat;
