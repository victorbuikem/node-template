const { createHandler } = require('@app-core/server');
const { rateLimit, validateCreatorCardSlug } = require('@app/middlewares');
const retrieveCreatorCard = require('@app/services/creator-cards/retrieve');
const Messages = require('@app/messages/creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [rateLimit, validateCreatorCardSlug],
  props: {
    rateLimit: { max: 10, window: '1m' },
  },
  async handler(rc, helpers) {
    const response = await retrieveCreatorCard({
      slug: rc.params.slug,
      access_code: rc.query.access_code,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: Messages.RETRIEVED,
      data: response,
    };
  },
});
