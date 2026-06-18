const { URL: URLParser } = require('url');
const { ERROR_CODE } = require('@app-core/errors');
const Messages = require('@app/messages/creator-card');
const throwCreatorCardError = require('./throw-creator-card-error');

function ensureUrls(links) {
  (links || []).forEach((link) => {
    let url;

    try {
      url = new URLParser(link.url);
    } catch {
      throwCreatorCardError(Messages.INVALID_URL, ERROR_CODE.VALIDATIONERR);
    }

    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      throwCreatorCardError(Messages.INVALID_URL, ERROR_CODE.VALIDATIONERR);
    }
  });
}

module.exports = ensureUrls;
