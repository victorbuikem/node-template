const validator = require('@app-core/validator');
const { ERROR_CODE } = require('@app-core/errors');
const creatorCardRepository = require('@app/repository/creator-card');
const Messages = require('@app/messages/creator-card');
const serializeCreatorCard = require('../utils/serialize');
const { deleteCreatorCardSpec } = require('./validation-spec');
const ensureSlugFormat = require('../utils/ensure-slug-format');
const throwCreatorCardError = require('../utils/throw-creator-card-error');

const DELETE_FIELDS = new Set(Object.keys(deleteCreatorCardSpec.root.children));

function ensureDeleteFieldsMatchSpec(data) {
  const unexpectedField = Object.keys(data).find((field) => !DELETE_FIELDS.has(field));

  if (unexpectedField) {
    throwCreatorCardError(`${unexpectedField} is not allowed!`, ERROR_CODE.VALIDATIONERR);
  }
}

async function deleteCreatorCard(serviceData) {
  ensureDeleteFieldsMatchSpec(serviceData);

  const data = validator.validate(serviceData, deleteCreatorCardSpec);
  ensureSlugFormat(data.slug);

  const card = await creatorCardRepository.findOne({
    query: {
      slug: data.slug,
      creator_reference: data.creator_reference,
      deleted: null,
    },
  });

  if (!card) {
    throwCreatorCardError(Messages.NOT_FOUND, 'NF01');
  }

  const updateValues = {
    deleted: Date.now(),
  };

  const updateResult = await creatorCardRepository.updateOne({
    query: {
      slug: data.slug,
      creator_reference: data.creator_reference,
      deleted: null,
    },
    updateValues,
  });

  if (updateResult.modifiedCount === 0) {
    throwCreatorCardError(Messages.NOT_FOUND, 'NF01');
  }

  const deletedCard =
    typeof card.toObject === 'function'
      ? card.toObject({ flattenMaps: true, versionKey: false })
      : card;
  const updated = updateValues.updated || updateValues.deleted;

  return serializeCreatorCard(
    { ...deletedCard, deleted: updateValues.deleted, updated },
    { includeAccessCode: true }
  );
}

module.exports = deleteCreatorCard;
