const { ulid } = require('@app-core/randomness');

function generateId(Model) {
  const id = ulid();
  const prefix = Model.__appConfig?.ulidPrefix;

  return prefix ? `${prefix}${id}` : id;
}

module.exports = generateId;
