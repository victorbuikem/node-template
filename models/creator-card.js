const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creatorcards';

const schemaConfig = {
  _id: { type: SchemaTypes.ULID, required: true },
  title: { type: SchemaTypes.String, required: true },
  description: { type: SchemaTypes.String, required: false },
  slug: { type: SchemaTypes.String, required: true },
  creator_reference: { type: SchemaTypes.String, required: true, index: true },
  status: { type: SchemaTypes.String, required: true },
  access_type: { type: SchemaTypes.String, required: true },
  access_code: { type: SchemaTypes.String },
  links: [
    {
      title: { type: SchemaTypes.String, required: true },
      url: { type: SchemaTypes.String, required: true },
    },
  ],
  service_rates: {
    currency: { type: SchemaTypes.String, required: false },
    rates: [
      {
        name: { type: SchemaTypes.String, required: false },
        description: { type: SchemaTypes.String, required: false },
        amount: { type: SchemaTypes.Number, required: false },
      },
    ],
  },
  deleted: { type: SchemaTypes.Number, default: null, index: true },
  created: { type: SchemaTypes.Number, required: true },
  updated: { type: SchemaTypes.Number, required: true },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });
modelSchema.index({ slug: 1 }, { unique: true });

module.exports = DatabaseModel.model('CreatorCard', modelSchema);
