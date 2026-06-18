const creatorCardRepository = require('@app/repository/creator-card');

async function findActiveBySlug(slug) {
  return creatorCardRepository.findOne({
    query: {
      slug,
      deleted: null,
    },
  });
}

module.exports = findActiveBySlug;
