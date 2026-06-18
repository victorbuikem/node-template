const { ERROR_CODE } = require('@app-core/errors');
const Messages = require('@app/messages/creator-card');
const throwCreatorCardError = require('./throw-creator-card-error');

function ensureRates(serviceRates) {
  if (!serviceRates) return;

  const rates = serviceRates?.rates || [];

  if (!rates.length) {
    throwCreatorCardError(Messages.RATES_REQUIRED, ERROR_CODE.VALIDATIONERR);
  }
}

module.exports = ensureRates;
