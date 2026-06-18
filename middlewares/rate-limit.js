const { createHandler } = require('@app-core/server');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const Messages = require('@app/messages/creator-card');

const buckets = new Map();

function parseWindow(windowValue = '1m') {
  const [, amount, unit] = String(windowValue).match(/^(\d+)(ms|s|m|h)$/) || [];
  const value = Number(amount);

  if (!value) {
    return 60000;
  }

  return (
    {
      ms: 1,
      s: 1000,
      m: 60000,
      h: 3600000,
    }[unit] * value
  );
}

module.exports = createHandler({
  path: '*',
  method: '',
  async handler(rc) {
    const { rateLimit } = rc.props;

    if (!rateLimit) {
      return {};
    }

    const now = Date.now();
    const windowMs = parseWindow(rateLimit.window);
    const max = rateLimit.max || 60;
    const key = [
      rc.properties.IP,
      rc.properties.method,
      rc.properties.requestURLWithoutQueryStrings,
    ].join(':');
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > max) {
      throwAppError(Messages.RATE_LIMITED, ERROR_CODE.RTLIMERR);
    }

    return {};
  },
});
