const getPublicBaseUrl = (req) => {
  const envBase = process.env.PUBLIC_BASE_URL;
  if (envBase) {
    return envBase.replace(/\/+$/, '');
  }

  const forwardedProto = req?.headers?.['x-forwarded-proto'];
  const proto = (forwardedProto || req?.protocol || 'http').toString().split(',')[0].trim();
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host;

  if (host) {
    return `${proto}://${host}`;
  }

  return 'http://localhost:5000';
};

module.exports = { getPublicBaseUrl };
