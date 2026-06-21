const validator = require('@app-core/validator');
const Messages = require('@app/messages/creator-card');
const serializeCreatorCard = require('../utils/serialize');
const findActiveCardBySlug = require('../utils/find-active-card-by-slug');
const { retrieveCreatorCardSpec } = require('./validation-spec');
const ensureSlugFormat = require('../utils/ensure-slug-format');
const throwCreatorCardError = require('../utils/throw-creator-card-error');

async function retrieveCreatorCard(serviceData) {
  const data = validator.validate(serviceData, retrieveCreatorCardSpec);
  const { slug, access_code: accessCode } = data;
  ensureSlugFormat(slug);

  const card = await findActiveCardBySlug(slug);

  if (!card) {
    throwCreatorCardError(Messages.NOT_FOUND, 'NF01');
  }

  if (card.status === 'draft') {
    throwCreatorCardError(Messages.DRAFT_NOT_FOUND, 'NF02');
  }

  if (card.access_type === 'private' && !accessCode) {
    throwCreatorCardError(Messages.PRIVATE_ACCESS_CODE_MISSING, 'AC03');
  }

  if (card.access_type === 'private' && accessCode !== card.access_code) {
    throwCreatorCardError(Messages.PRIVATE_ACCESS_CODE_INVALID, 'AC04');
  }

  return serializeCreatorCard(card, { includeAccessCode: false });
}

module.exports = retrieveCreatorCard;
