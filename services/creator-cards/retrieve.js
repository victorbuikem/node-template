const Messages = require('@app/messages/creator-card');
const serializeCreatorCard = require('./serialize');
const { findActiveBySlug, throwCreatorCardError } = require('./helpers');

async function retrieveCreatorCard(serviceData) {
  const { slug, access_code: accessCode } = serviceData;
  const card = await findActiveBySlug(slug);

  if (!card) {
    throwCreatorCardError(Messages.NOT_FOUND, 'NF01');
  }

  if (card.status === 'draft') {
    throwCreatorCardError(Messages.DRAFT_NOT_FOUND, 'NF02');
  }

  if (card.access_type === 'private' && !accessCode) {
    throwCreatorCardError(Messages.PRIVATE_ACCESS_CODE_MISSING, 'AC03');
  }

  if (card.access_type === 'private' && card.access_code !== accessCode) {
    throwCreatorCardError(Messages.PRIVATE_ACCESS_CODE_INVALID, 'AC04');
  }

  return serializeCreatorCard(card, { includeAccessCode: false });
}

module.exports = retrieveCreatorCard;
