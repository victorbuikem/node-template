const { createHandler } = require('@app-core/server');
const { rateLimit, validateCreatorCardSlug } = require('@app/middlewares');
const deleteCreatorCard = require('@app/services/creator-cards/delete');
const Messages = require('@app/messages/creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [rateLimit, validateCreatorCardSlug],
  props: {
    rateLimit: { max: 10, window: '1m' },
  },
  async handler(rc, helpers) {
    const response = await deleteCreatorCard({
      ...rc.body,
      slug: rc.params.slug,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: Messages.DELETED,
      data: response,
    };
  },
});
