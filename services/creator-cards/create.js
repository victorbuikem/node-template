const validator = require('@app-core/validator');
const { ERROR_CODE } = require('@app-core/errors');
const creatorCardRepository = require('@app/repository/creator-card');
const Messages = require('@app/messages/creator-card');
const serializeCreatorCard = require('./serialize');
const { creatorCardSpec } = require('./validation-spec');
const {
  ensureSlugFormat,
  ensureAccessCodeFormat,
  ensureUrls,
  ensureRates,
  ensureProvidedSlugIsAvailable,
  createAvailableSlug,
  throwCreatorCardError,
} = require('./helpers');

async function createCreatorCard(serviceData) {
  const data = validator.validate(serviceData, creatorCardSpec);
  const accessType = data.access_type || 'public';

  ensureSlugFormat(data.slug);
  ensureAccessCodeFormat(data.access_code);
  ensureUrls(data.links);
  ensureRates(data.service_rates);

  if (accessType === 'private' && !data.access_code) {
    throwCreatorCardError(Messages.PRIVATE_ACCESS_CODE_REQUIRED, 'AC01');
  }

  if (accessType === 'public' && data.access_code) {
    throwCreatorCardError(Messages.PUBLIC_ACCESS_CODE_NOT_ALLOWED, 'AC05');
  }

  await ensureProvidedSlugIsAvailable(data.slug);

  let card;

  try {
    card = await creatorCardRepository.create({
      ...data,
      access_type: accessType,
      slug: data.slug || (await createAvailableSlug(data.title)),
      deleted: null,
    });
  } catch (error) {
    if (error.errorCode === ERROR_CODE.DUPLRCRD) {
      throwCreatorCardError(Messages.SLUG_TAKEN, 'SL02');
    }

    throw error;
  }

  return serializeCreatorCard(card, { includeAccessCode: true });
}

module.exports = createCreatorCard;
