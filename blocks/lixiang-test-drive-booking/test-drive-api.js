/* global globalThis */
const ONTEST_BASE_URL = 'https://bcs-api-web-ontest-b.liauto.com';
const API_ROOT = '/saos-global-leads-api/leads';
const SUCCESS_CODE = 0;
const CHALLENGE_REQUIRED_CODE = 600003;

const LEAD_SOURCES = new Set([
  'res',
  'beijingautoshow',
  'google_kz',
  'google_uz',
  'youtube_kz',
  'youtube_uz',
  'meta_ads_kz',
  'meta_ads_uz',
  'IG_boost_kz',
  'IG_boost_uz',
  'social_org_kz',
  'social_org_uz',
  'social_org_global',
  'paid_global',
  'other',
  'chinatour_official_global',
  'chinatour_kol1_global',
  'chinatour_kol2_global',
  'chinatour_official_kz',
  'chinatour_official_uz',
  'chinatour_kol1_kz',
  'chinatour_kol2_kz',
  'chinatour_kol3_kz',
]);

const ISO_639_LANGUAGE_CODE = /^[a-z]{2}$/;

const VEHICLE_SERIES_BY_MODEL_KEY = {
  l9: 'L9',
  l8: 'X02',
  l7: 'X03',
  l6: 'X04',
};

const STORE_CODE_BY_STORE_KEY = {
  'allur-almaty': 'KZ_VLPYHG',
  'allur-astana': 'KZ_XKJQZM',
  'doscar-almaty': 'KZ_RBNTFD',
};

function testDriveError(message, type, code, status) {
  return Object.assign(new Error(message), {
    name: 'TestDriveError',
    type,
    code,
    status,
  });
}

export function isTestDriveError(error) {
  return error instanceof Error && error.name === 'TestDriveError';
}

export function isChallengeRequiredError(error) {
  return isTestDriveError(error) && error.type === 'challenge';
}

function requiredString(value, name) {
  const normalized = String(value || '').trim();
  if (!normalized) throw testDriveError(`Missing ${name}`, 'configuration', null, null);
  return normalized;
}

function allowedBaseUrl(value = ONTEST_BASE_URL) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw testDriveError('Invalid Test Drive API base URL', 'configuration', null, null);
  }
  if (url.origin !== ONTEST_BASE_URL) {
    throw testDriveError('Unapproved Test Drive API origin', 'configuration', null, null);
  }
  return url;
}

function secureBytes(length, cryptoImpl) {
  if (!cryptoImpl?.getRandomValues) {
    throw testDriveError('Secure random generator is unavailable', 'configuration', null, null);
  }
  const bytes = new Uint8Array(length);
  cryptoImpl.getRandomValues(bytes);
  return bytes;
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createDeviceId(cryptoImpl = globalThis.crypto) {
  if (typeof cryptoImpl?.randomUUID === 'function') return cryptoImpl.randomUUID();
  const hex = bytesToHex(secureBytes(16, cryptoImpl));
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

export function createTraceId(cryptoImpl = globalThis.crypto) {
  return bytesToHex(secureBytes(16, cryptoImpl));
}

export function resolveLeadSource(sourceUrl, configuredLeadSource = '') {
  let url;
  try {
    url = new URL(requiredString(sourceUrl, 'sourceUrl'));
  } catch (error) {
    if (isTestDriveError(error)) throw error;
    throw testDriveError('Invalid sourceUrl', 'configuration', null, null);
  }
  const leadSource = String(configuredLeadSource || url.searchParams.get('chjchannelcode') || '').trim();
  if (!LEAD_SOURCES.has(leadSource)) {
    throw testDriveError('Missing or unsupported leadSource', 'configuration', null, null);
  }
  return leadSource;
}

function resolveLanguage(language) {
  const normalized = requiredString(language, 'leadsLanguage').toLowerCase();
  if (!ISO_639_LANGUAGE_CODE.test(normalized)) {
    throw testDriveError(
      'leadsLanguage must be an ISO 639 two-letter code',
      'configuration',
      null,
      null,
    );
  }
  return normalized;
}

function resolveVehicleSeries(modelKey) {
  const normalized = requiredString(modelKey, 'model').toLowerCase();
  const vehicleSeries = VEHICLE_SERIES_BY_MODEL_KEY[normalized];
  if (!vehicleSeries) {
    throw testDriveError('Unmapped Test Drive model', 'configuration', null, null);
  }
  return vehicleSeries;
}

function resolveStoreCode(storeKey) {
  const normalized = requiredString(storeKey, 'store').toLowerCase();
  const storeCode = STORE_CODE_BY_STORE_KEY[normalized];
  if (!storeCode) {
    throw testDriveError('Unmapped Test Drive store', 'configuration', null, null);
  }
  return storeCode;
}

export function buildLeadRequest(formValues, runtimeConfig, {
  cryptoImpl = globalThis.crypto,
  deviceId = '',
  traceId = '',
} = {}) {
  const sourceUrl = requiredString(runtimeConfig?.sourceUrl, 'sourceUrl');
  const countryCode = requiredString(runtimeConfig?.countryCode, 'countryCode').toUpperCase();
  const leadSource = resolveLeadSource(sourceUrl, runtimeConfig?.leadSource);
  const resolvedDeviceId = deviceId || createDeviceId(cryptoImpl);
  const resolvedTraceId = traceId || createTraceId(cryptoImpl);
  const payload = {
    leadSource,
    leadsLanguage: resolveLanguage(runtimeConfig?.leadsLanguage),
    countryCode,
    vehicleSeries: resolveVehicleSeries(formValues?.model),
    storeCode: resolveStoreCode(formValues?.store),
    customerName: requiredString(formValues?.name, 'customerName'),
    email: requiredString(formValues?.email, 'email'),
    phone: String(formValues?.phone || '').trim(),
    phoneCountryCode: requiredString(
      runtimeConfig?.phoneCountryCode || formValues?.countryCode,
      'phoneCountryCode',
    ),
    deviceId: resolvedDeviceId,
    agreementId: requiredString(runtimeConfig?.agreementId, 'agreementId'),
    agreementVersion: requiredString(runtimeConfig?.agreementVersion, 'agreementVersion'),
  };

  return {
    payload,
    headers: {
      'content-type': 'application/json',
      'x-chj-metadata': JSON.stringify({ code: leadSource }),
      'x-chj-sourceurl': sourceUrl,
      'x-chj-traceid': resolvedTraceId,
    },
  };
}

function normalizeStores(data) {
  const stores = data?.storeCodes;
  if (!Array.isArray(stores)) {
    throw testDriveError('Invalid Test Drive store response', 'api', null, null);
  }
  return stores.map((store) => ({
    code: requiredString(store?.code, 'store code'),
    name: requiredString(store?.name, 'store name'),
  }));
}

export function createTestDriveApiClient({
  baseUrl = ONTEST_BASE_URL,
  fetchImpl = globalThis.fetch,
} = {}) {
  const apiBaseUrl = allowedBaseUrl(baseUrl);
  if (typeof fetchImpl !== 'function') {
    throw testDriveError('Fetch implementation is unavailable', 'configuration', null, null);
  }

  async function request(path, options = {}) {
    const response = await fetchImpl(new URL(path, apiBaseUrl), {
      credentials: 'include',
      ...options,
    });
    let body;
    try {
      body = await response.json();
    } catch {
      throw testDriveError('Invalid Test Drive API response', 'api', null, response.status);
    }

    if (Number(body?.code) === CHALLENGE_REQUIRED_CODE) {
      throw testDriveError(
        'Test drive verification is required',
        'challenge',
        CHALLENGE_REQUIRED_CODE,
        response.status,
      );
    }
    if (!response.ok || Number(body?.code) !== SUCCESS_CODE) {
      throw testDriveError('Test Drive API request failed', 'api', body?.code, response.status);
    }
    return body.data;
  }

  return {
    async queryStores(countryCode) {
      const country = requiredString(countryCode, 'countryCode').toUpperCase();
      const params = new URLSearchParams({ countryCode: country });
      const data = await request(`${API_ROOT}/query-store-list?${params}`, {
        headers: { accept: 'application/json' },
      });
      return normalizeStores(data);
    },

    async addLead(leadRequest) {
      return request(`${API_ROOT}/add`, {
        method: 'POST',
        headers: leadRequest.headers,
        body: JSON.stringify(leadRequest.payload),
      });
    },

    async addLeadWithCaptcha(leadRequest, challengeToken) {
      const token = requiredString(challengeToken, 'challengeToken');
      return request(`${API_ROOT}/add-with-captcha`, {
        method: 'POST',
        headers: {
          ...leadRequest.headers,
          'Challenge-Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(leadRequest.payload),
      });
    },
  };
}

export const TEST_DRIVE_API = Object.freeze({
  mode: 'ontest',
  baseUrl: ONTEST_BASE_URL,
});
