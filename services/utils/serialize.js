function stripPrivateFields(value) {
  if (Array.isArray(value)) {
    return Array.prototype.map.call(Array.from(value), stripPrivateFields);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const plainValue =
    typeof value.toObject === 'function'
      ? value.toObject({ flattenMaps: true, versionKey: false })
      : value;

  return Object.entries(plainValue).reduce((cleaned, [key, entryValue]) => {
    if (key === '_id' || key === '__v') {
      return cleaned;
    }

    return {
      ...cleaned,
      [key]: stripPrivateFields(entryValue),
    };
  }, {});
}

function serializeCreatorCard(card, options = {}) {
  const { includeAccessCode = false } = options;
  const { _id, __v, access_code: accessCode, ...rest } = card || {};

  const serialized = {
    id: _id,
    ...stripPrivateFields(rest),
  };

  if (includeAccessCode && accessCode !== undefined) {
    serialized.access_code = accessCode;
  }

  return serialized;
}

module.exports = serializeCreatorCard;
