const validator = require('@app-core/validator');
const { ERROR_CODE } = require('@app-core/errors');
const { hash } = require('@app-core/security');
const creatorCardRepository = require('@app/repository/creator-card');
const Messages = require('@app/messages/creator-card');
const ensureSlugFormat = require('@app/services/utils/ensure-slug-format');
const ensureAccessCodeFormat = require('@app/services/utils/ensure-access-code-format');
const serializeCreatorCard = require('../utils/serialize');
const { creatorCardSpec } = require('./validation-spec');
const ensureUrls = require('../utils/ensure-urls');

const createAvailableSlug = require('../utils/create-available-slug');
const findCardBySlug = require('../utils/find-card-by-slug');
const throwCreatorCardError = require('../utils/throw-creator-card-error');

async function createCreatorCard(serviceData) {
  const data = validator.validate(serviceData, creatorCardSpec);
  const accessType = data.access_type || 'public';

  ensureSlugFormat(data.slug);
  ensureUrls(data.links);

  const rates = data.service_rates?.rates || [];

  if (data.service_rates && !rates.length) {
    throwCreatorCardError(Messages.RATES_REQUIRED, ERROR_CODE.VALIDATIONERR);
  }

  if (accessType === 'private' && !data.access_code) {
    throwCreatorCardError(Messages.PRIVATE_ACCESS_CODE_REQUIRED, 'AC01');
  }

  if (accessType === 'public' && data.access_code) {
    throwCreatorCardError(Messages.PUBLIC_ACCESS_CODE_NOT_ALLOWED, 'AC05');
  }

  ensureAccessCodeFormat(data.access_code);

  if (data.slug) {
    const existing = await findCardBySlug(data.slug);
    if (existing) {
      throwCreatorCardError(Messages.SLUG_TAKEN, 'SL02');
    }
  }

  let card;
  const accessCodeHash = data.access_code ? await hash.createBHash(data.access_code) : null;

  try {
    card = await creatorCardRepository.create({
      ...data,
      access_type: accessType,
      access_code: accessCodeHash,
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
