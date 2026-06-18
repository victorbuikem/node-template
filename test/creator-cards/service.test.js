const assert = require('assert');
const { ERROR_CODE } = require('@app-core/errors');
const createMockServer = require('@app-core/mock-server');
const { MockModelStubs } = require('@app/mock-models');
const createCreatorCard = require('@app/services/creator-cards/create');
const retrieveCreatorCard = require('@app/services/creator-cards/retrieve');
const deleteCreatorCard = require('@app/services/creator-cards/delete');
const serializeCreatorCard = require('@app/services/utils/serialize');
const { CreatorCard } = require('@app/models');

const cardStubs = MockModelStubs.CreatorCard;

function basePayload(overrides = {}) {
  return {
    title: 'Portfolio Builder',
    description: 'Services for technical creators',
    creator_reference: 'CREATORREFERENCE0001',
    status: 'published',
    access_type: 'public',
    links: [{ title: 'Website', url: 'https://example.com' }],
    service_rates: {
      currency: 'USD',
      rates: [{ name: 'Consulting', description: 'One hour strategy call', amount: 500 }],
    },
    ...overrides,
  };
}

function card(overrides = {}) {
  return {
    _id: 'card-01',
    ...basePayload({ access_type: 'private', access_code: 'ABC123' }),
    slug: 'portfolio-builder',
    deleted: null,
    created: 1,
    updated: 1,
    __v: 0,
    ...overrides,
  };
}

function stub(method, config) {
  const configured = cardStubs.configureStubs({ method, ...config });

  return configured.revert;
}

async function assertRejects(run, verify) {
  let error;

  try {
    await run();
  } catch (caught) {
    error = caught;
  }

  if (!error) {
    assert.fail('Expected promise to reject');
  }

  assert.ok(verify(error));
}

describe('creator cards', () => {
  afterEach(() => {
    delete process.env.MODEL_MOCK_SESSION;
  });

  it('returns SL02 when a provided slug already exists', async () => {
    const revertFind = stub('findOne', { docConfig: card() });

    try {
      await assertRejects(
        () => createCreatorCard(basePayload({ slug: 'portfolio-builder' })),
        (error) => error.errorCode === 'SL02'
      );
    } finally {
      revertFind();
    }
  });

  it('generates a suffixed slug when a title slug collides', async () => {
    const revertFind = stub('findOne', {
      overrideFn(data) {
        return data.query.slug === 'portfolio-builder' ? card({ slug: 'portfolio-builder' }) : null;
      },
    });
    const revertCreate = stub('create', {
      overrideFn(data) {
        return { _id: 'created-card', ...data };
      },
    });

    try {
      const response = await createCreatorCard(basePayload());

      assert.match(response.id, /^[0-9A-HJKMNP-TV-Z]{26}$/);
      assert.match(response.slug, /^portfolio-builder-[a-f0-9]{6}$/);
      assert.ok(!Object.hasOwn(response, '_id'));
    } finally {
      revertFind();
      revertCreate();
    }
  });

  it('caps an auto-generated slug at the spec maximum length', async () => {
    const revertFind = stub('findOne', { mockNull: true });
    const revertCreate = stub('create', {
      overrideFn(data) {
        return { _id: 'created-card', ...data };
      },
    });

    try {
      const response = await createCreatorCard(basePayload({ title: 'A'.repeat(100) }));

      assert.strictEqual(response.slug, 'a'.repeat(50));
      assert.strictEqual(response.slug.length, 50);
    } finally {
      revertFind();
      revertCreate();
    }
  });

  it('rechecks suffixed slug availability before creating a card', async () => {
    let lookupCount = 0;
    const revertFind = stub('findOne', {
      overrideFn() {
        lookupCount += 1;
        return lookupCount < 3 ? card() : null;
      },
    });
    const revertCreate = stub('create', {
      overrideFn(data) {
        return { _id: 'created-card', ...data };
      },
    });

    try {
      const response = await createCreatorCard(basePayload());

      assert.match(response.slug, /^portfolio-builder-[a-f0-9]{6}$/);
      assert.strictEqual(lookupCount, 3);
    } finally {
      revertFind();
      revertCreate();
    }
  });

  it('maps a slug duplicate during create to SL02', async () => {
    const revertFind = stub('findOne', { mockNull: true });
    const revertCreate = stub('create', {
      overrideFn() {
        const error = new Error('duplicate slug');
        error.isApplicationError = true;
        error.errorCode = ERROR_CODE.DUPLRCRD;
        throw error;
      },
    });

    try {
      await assertRejects(
        () => createCreatorCard(basePayload()),
        (error) => error.errorCode === 'SL02'
      );
    } finally {
      revertFind();
      revertCreate();
    }
  });

  it('creates a card when spec-optional fields are omitted', async () => {
    const revertFind = stub('findOne', { mockNull: true });
    const revertCreate = stub('create', {
      overrideFn(data) {
        return { _id: 'created-card', ...data };
      },
    });

    try {
      const response = await createCreatorCard({
        title: 'Portfolio Builder',
        creator_reference: 'CREATORREFERENCE0001',
        status: 'published',
      });

      assert.strictEqual(response.title, 'Portfolio Builder');
      assert.strictEqual(response.creator_reference, 'CREATORREFERENCE0001');
      assert.strictEqual(response.status, 'published');
      assert.strictEqual(response.access_type, 'public');
      assert.strictEqual(response.access_code, null);
      assert.ok(!Object.hasOwn(response, 'description'));
      assert.ok(!Object.hasOwn(response, 'links'));
      assert.ok(!Object.hasOwn(response, 'service_rates'));
    } finally {
      revertFind();
      revertCreate();
    }
  });

  it('returns access_code on create while storing it for private retrieval', async () => {
    const revertFind = stub('findOne', { mockNull: true });
    let createdData;
    const revertCreate = stub('create', {
      overrideFn(data) {
        createdData = data;
        return { _id: 'created-card', ...data };
      },
    });

    try {
      const response = await createCreatorCard(
        basePayload({ access_type: 'private', access_code: 'ABC123' })
      );

      assert.strictEqual(createdData.access_code, 'ABC123');
      assert.strictEqual(response.access_code, 'ABC123');
    } finally {
      revertFind();
      revertCreate();
    }
  });

  it('uses neutral validation code for field-level creator card failures', async () => {
    const cases = [
      {
        payload: { status: 'PUBLISHED' },
        message: 'uppercase status enum',
      },
      {
        payload: { access_type: 'PUBLIC' },
        message: 'uppercase access_type enum',
      },
      {
        payload: { service_rates: { currency: 'ngn', rates: basePayload().service_rates.rates } },
        message: 'lowercase currency enum',
      },
      {
        payload: { slug: 'bad slug' },
        message: 'invalid slug format',
      },
      {
        payload: { access_type: 'private', access_code: 'abc' },
        message: 'invalid access_code format',
      },
      {
        payload: { links: [{ title: 'Website', url: 'ftp://example.com' }] },
        message: 'invalid link URL scheme',
      },
      {
        payload: { links: [{ title: 'Website', url: 'https://' }] },
        message: 'invalid link URL',
      },
      {
        payload: { service_rates: { currency: 'USD', rates: [] } },
        message: 'empty service rate list',
      },
      {
        payload: {
          service_rates: {
            currency: 'USD',
            rates: [{ name: 'Consulting', description: 'One hour strategy call', amount: 5.5 }],
          },
        },
        message: 'non-integer service rate amount',
      },
    ];

    await Promise.all(
      cases.map((testCase) =>
        assertRejects(
          () => createCreatorCard(basePayload(testCase.payload)),
          (error) =>
            error.errorCode === ERROR_CODE.VALIDATIONERR ||
            assert.fail(`${testCase.message} returned ${error.errorCode}`)
        )
      )
    );
  });

  it('keeps business error codes for creator card business rules', async () => {
    await assertRejects(
      () => createCreatorCard(basePayload({ access_type: 'private', access_code: undefined })),
      (error) => error.errorCode === 'AC01'
    );

    await assertRejects(
      () => createCreatorCard(basePayload({ access_code: 'ABC123' })),
      (error) => error.errorCode === 'AC05'
    );

    await assertRejects(
      () => createCreatorCard(basePayload({ access_code: 'abc' })),
      (error) => error.errorCode === 'AC05'
    );
  });

  it('does not expose access_code when retrieving a card', async () => {
    const revertFind = stub('findOne', {
      docConfig: card({
        access_code: 'ABC123',
        links: [{ _id: 'link-01', title: 'Website', url: 'https://example.com' }],
        service_rates: {
          currency: 'USD',
          rates: [
            {
              _id: 'rate-01',
              name: 'Consulting',
              description: 'One hour strategy call',
              amount: 500,
            },
          ],
        },
      }),
    });

    try {
      const response = await retrieveCreatorCard({
        slug: 'portfolio-builder',
        access_code: 'ABC123',
      });

      assert.strictEqual(response.id, 'card-01');
      assert.ok(!Object.hasOwn(response, 'access_code'));
      assert.ok(!Object.hasOwn(response, '_id'));
      assert.ok(!Object.hasOwn(response.links[0], '_id'));
      assert.ok(!Object.hasOwn(response.service_rates.rates[0], '_id'));
    } finally {
      revertFind();
    }
  });

  it('rejects invalid private access_code when retrieving a card', async () => {
    const revertFind = stub('findOne', { docConfig: card({ access_code: 'ABC123' }) });

    try {
      await assertRejects(
        () => retrieveCreatorCard({ slug: 'portfolio-builder', access_code: 'WRONG1' }),
        (error) => error.errorCode === 'AC04'
      );
    } finally {
      revertFind();
    }
  });

  it('serializes mongoose subdocument arrays without nested _id fields', () => {
    const doc = new CreatorCard({
      _id: '01KV8XE9BNQQNNHBQBQ6BGY4EA',
      ...basePayload(),
      slug: 'portfolio-builder',
      deleted: null,
      created: 1,
      updated: 1,
    });

    const response = serializeCreatorCard(doc._doc);

    assert.strictEqual(response.id, '01KV8XE9BNQQNNHBQBQ6BGY4EA');
    assert.ok(!Object.hasOwn(response.links[0], '_id'));
    assert.ok(!Object.hasOwn(response.service_rates.rates[0], '_id'));
  });

  it('checks draft status before private access_code rules', async () => {
    const revertFind = stub('findOne', { docConfig: card({ status: 'draft' }) });

    try {
      await assertRejects(
        () => retrieveCreatorCard({ slug: 'portfolio-builder' }),
        (error) => error.errorCode === 'NF02'
      );
    } finally {
      revertFind();
    }
  });

  it('validates slugs before retrieving or deleting cards', async () => {
    await assertRejects(
      () => retrieveCreatorCard({ slug: 'bad slug' }),
      (error) => error.errorCode === ERROR_CODE.VALIDATIONERR
    );

    await assertRejects(
      () =>
        deleteCreatorCard({
          slug: 'bad slug',
          creator_reference: 'CREATORREFERENCE0001',
        }),
      (error) => error.errorCode === ERROR_CODE.VALIDATIONERR
    );
  });

  it('rejects extra fields in delete payloads', async () => {
    await assertRejects(
      () =>
        deleteCreatorCard({
          slug: 'portfolio-builder',
          title: 'George Cooks',
          creator_reference: 'crt_8f2k1m9x4p7w3q5z',
          status: 'published',
        }),
      (error) =>
        error.errorCode === ERROR_CODE.VALIDATIONERR && error.message === 'title is not allowed!'
    );
  });

  it('does not allow reusing a deleted card slug', async () => {
    const revertFind = stub('findOne', { docConfig: card({ deleted: Date.now() }) });

    try {
      await assertRejects(
        () => createCreatorCard(basePayload({ slug: 'portfolio-builder' })),
        (error) => error.errorCode === 'SL02'
      );
    } finally {
      revertFind();
    }
  });

  it('soft deletes a card and returns access_code on delete', async () => {
    const revertFind = stub('findOne', { docConfig: card() });
    let updateValues;
    const revertUpdate = stub('updateOne', {});
    const revertUpdateCapture = stub('updateOne', {
      overrideFn(data, existingFn) {
        updateValues = data.updateValues;
        Object.assign(updateValues, { updated: Date.now() });
        return existingFn(data);
      },
    });

    try {
      const response = await deleteCreatorCard({
        slug: 'portfolio-builder',
        creator_reference: 'CREATORREFERENCE0001',
      });

      assert.strictEqual(response.id, 'card-01');
      assert.strictEqual(response.access_code, 'ABC123');
      assert.strictEqual(typeof response.deleted, 'number');
      assert.strictEqual(updateValues.updated, response.updated);
    } finally {
      revertFind();
      revertUpdateCapture();
      revertUpdate();
    }
  });

  it('returns not found when a delete update no longer matches a card', async () => {
    const revertFind = stub('findOne', { docConfig: card() });
    const revertUpdate = stub('updateOne', {
      overrideFn() {
        return { acknowledged: true, modifiedCount: 0 };
      },
    });

    try {
      await assertRejects(
        () =>
          deleteCreatorCard({
            slug: 'portfolio-builder',
            creator_reference: 'CREATORREFERENCE0001',
          }),
        (error) => error.errorCode === 'NF01'
      );
    } finally {
      revertFind();
      revertUpdate();
    }
  });

  it('emits mapped business error code in HTTP error bodies', async () => {
    const revertFind = stub('findOne', { docConfig: card() });
    const server = createMockServer(['endpoints/creator-cards/retrieve.js']);

    try {
      const response = await server.get('/creator-cards/portfolio-builder');

      assert.strictEqual(response.statusCode, 403);
      assert.strictEqual(response.data.status, 'error');
      assert.strictEqual(response.data.code, 'AC03');
    } finally {
      revertFind();
    }
  });

  it('does not rate limit creator card retrieval requests', async () => {
    const revertFind = stub('findOne', { docConfig: card() });
    const server = createMockServer(['endpoints/creator-cards/retrieve.js']);

    try {
      const responses = await Promise.all(
        Array.from({ length: 11 }, () =>
          server.get('/creator-cards/portfolio-builder', {
            IP: '203.0.113.10',
          })
        )
      );
      const response = responses[responses.length - 1];

      assert.strictEqual(response.statusCode, 403);
      assert.strictEqual(response.data.code, 'AC03');
    } finally {
      revertFind();
    }
  });

  it('does not rate limit creator card delete requests', async () => {
    const revertFind = stub('findOne', { mockNull: true });
    const server = createMockServer(['endpoints/creator-cards/delete.js']);

    try {
      const responses = await Promise.all(
        Array.from({ length: 6 }, () =>
          server.delete('/creator-cards/portfolio-builder', {
            IP: '203.0.113.20',
            body: { creator_reference: 'CREATORREFERENCE0001' },
          })
        )
      );
      const response = responses[responses.length - 1];

      assert.strictEqual(response.statusCode, 404);
      assert.strictEqual(response.data.code, 'NF01');
    } finally {
      revertFind();
    }
  });
});
