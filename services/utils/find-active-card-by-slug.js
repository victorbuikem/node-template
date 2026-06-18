const creatorCardRepository = require('@app/repository/creator-card');

async function findActiveCardBySlug(slug) {
  return creatorCardRepository.findOne({
    query: {
      slug,
      deleted: null,
    },
  });
}

module.exports = findActiveCardBySlug;
