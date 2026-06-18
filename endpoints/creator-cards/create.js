const { createHandler } = require('@app-core/server');
const createCreatorCard = require('@app/services/creator-cards/create');
const Messages = require('@app/messages/creator-card');

module.exports = createHandler({
  path: '/creator-cards',
  method: 'post',
  middlewares: [],
  async handler(rc, helpers) {
    const response = await createCreatorCard(rc.body);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: Messages.CREATED,
      data: response,
    };
  },
});
