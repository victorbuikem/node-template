const { ERROR_CODE } = require('@app-core/errors');
const Messages = require('@app/messages/creator-card');
const throwCreatorCardError = require('./throw-creator-card-error');

const ACCESS_CODE_REGEX = /^[A-Za-z0-9]{6}$/;

function ensureAccessCodeFormat(accessCode) {
  if (accessCode && !ACCESS_CODE_REGEX.test(accessCode)) {
    throwCreatorCardError(Messages.INVALID_ACCESS_CODE, ERROR_CODE.VALIDATIONERR);
  }
}

module.exports = ensureAccessCodeFormat;
