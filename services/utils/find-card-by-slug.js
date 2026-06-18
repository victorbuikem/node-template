const creatorCardRepository = require('@app/repository/creator-card');

async function findCardBySlug(slug) {
  return creatorCardRepository.findOne({
    query: {
      slug,
    },
  });
}

module.exports = findCardBySlug;
