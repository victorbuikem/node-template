const validator = require('@app-core/validator');

const creatorCardSpec = `root {
  title string<trim|lengthBetween:3,100>
  description? string<trim|maxLength:500>
  slug? string<trim|lengthBetween:5,50>
  creator_reference string<trim|length:20>
  status string<trim>(draft|published)
  access_type? string<trim>(public|private)
  access_code? string<trim>
  links[]? {
    title string<trim|lengthBetween:1,100>
    url string<trim|maxLength:200>
  }
  service_rates? {
    currency string<trim>(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|lengthBetween:3,100>
      description string<trim|maxLength:250>
      amount integer<min:1>
    }
  }
}`;

const deleteCreatorCardSpec = `root {
  creator_reference string<trim|length:20>
}`;

module.exports = {
  creatorCardSpec: validator.parse(creatorCardSpec),
  deleteCreatorCardSpec: validator.parse(deleteCreatorCardSpec),
};
