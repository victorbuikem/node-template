const validator = require('@app-core/validator');
const { ERROR_CODE } = require('@app-core/errors');
const creatorCardRepository = require('@app/repository/creator-card');
const Messages = require('@app/messages/creator-card');
const serializeCreatorCard = require('./serialize');
const { deleteCreatorCardSpec } = require('./validation-spec');
const { throwCreatorCardError } = require('./helpers');

const DELETE_BODY_FIELDS = new Set(['creator_reference']);

function ensureDeleteBodyFields(body) {
  const unexpectedField = Object.keys(body).find((field) => !DELETE_BODY_FIELDS.has(field));

  if (unexpectedField) {
    throwCreatorCardError(`${unexpectedField} is not allowed!`, ERROR_CODE.VALIDATIONERR);
  }
}

async function deleteCreatorCard(serviceData) {
  const { slug, ...body } = serviceData;
  ensureDeleteBodyFields(body);

  const data = validator.validate(body, deleteCreatorCardSpec);
  const card = await creatorCardRepository.findOne({
    query: {
      slug,
      creator_reference: data.creator_reference,
      deleted: null,
    },
  });

  if (!card) {
    throwCreatorCardError(Messages.NOT_FOUND, 'NF01');
  }

  const deleted = Date.now();
  const updated = deleted;

  await creatorCardRepository.updateOne({
    query: {
      slug,
      creator_reference: data.creator_reference,
      deleted: null,
    },
    updateValues: {
      deleted,
      updated,
    },
  });

  const deletedCard =
    typeof card.toObject === 'function'
      ? card.toObject({ flattenMaps: true, versionKey: false })
      : card;

  return serializeCreatorCard({ ...deletedCard, deleted, updated }, { includeAccessCode: true });
}

module.exports = deleteCreatorCard;
