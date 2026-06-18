const { ERROR_CODE } = require('@app-core/errors');
const Messages = require('@app/messages/creator-card');
const throwCreatorCardError = require('./throw-creator-card-error');

const URL_REGEX = /^https?:\/\//;

function ensureUrls(links) {
  (links || []).forEach((link) => {
    if (!URL_REGEX.test(link.url)) {
      throwCreatorCardError(Messages.INVALID_URL, ERROR_CODE.VALIDATIONERR);
    }
  });
}

module.exports = ensureUrls;
