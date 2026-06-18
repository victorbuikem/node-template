const { throwAppError } = require('@app-core/errors');

function throwCreatorCardError(message, code) {
  throwAppError(message, code);
}

module.exports = throwCreatorCardError;
