const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creatorCards';

const schemaConfig = {
  _id: { type: SchemaTypes.ULID },
  title: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String },
  creator_reference: { type: SchemaTypes.String, index: true },
  status: { type: SchemaTypes.String },
  access_type: { type: SchemaTypes.String },
  access_code: { type: SchemaTypes.String },
  links: [
    {
      title: { type: SchemaTypes.String },
      url: { type: SchemaTypes.String },
    },
  ],
  service_rates: {
    currency: { type: SchemaTypes.String },
    rates: [
      {
        name: { type: SchemaTypes.String },
        description: { type: SchemaTypes.String },
        amount: { type: SchemaTypes.Number },
      },
    ],
  },
  deleted: { type: SchemaTypes.Number, default: null, index: true },
  created: { type: SchemaTypes.Number },
  updated: { type: SchemaTypes.Number },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });
modelSchema.index({ slug: 1 }, { unique: true });

module.exports = DatabaseModel.model('CreatorCard', modelSchema);
