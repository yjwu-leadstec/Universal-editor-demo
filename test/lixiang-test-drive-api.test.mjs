import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLeadRequest,
  createDeviceId,
  createTestDriveApiClient,
  createTraceId,
  isChallengeRequiredError,
  resolveLeadSource,
  TestDriveError,
} from '../blocks/lixiang-test-drive-booking/test-drive-api.js';

const formValues = {
  name: 'API Contract Test',
  model: 'l8',
  store: 'allur-astana',
  email: 'contract-test@example.com',
  phone: '',
  countryCode: '+7',
  consent: 'on',
};

const runtimeConfig = {
  sourceUrl: 'https://www-ontest.liauto.com/ru_kz/drive/reserve.html?sourceTag=nav',
  leadSource: 'google_kz',
  leadsLanguage: 'ru',
  countryCode: 'KZ',
  agreementId: 'privacy',
  agreementVersion: '20260107',
};

const leadRequest = buildLeadRequest(formValues, runtimeConfig, {
  deviceId: 'cb5f32ec-d2ce-8222-e11b-ad7fb71169b7',
  traceId: '6336a5234d7b2ba6e67d6c1396f918da',
});

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

test('buildLeadRequest maps the supplied contract without retaining extra form fields', () => {
  assert.deepEqual(leadRequest.payload, {
    leadSource: 'google_kz',
    leadsLanguage: 'ru',
    countryCode: 'KZ',
    vehicleSeries: 'X02',
    storeCode: 'KZ_XKJQZM',
    customerName: 'API Contract Test',
    email: 'contract-test@example.com',
    phone: '',
    phoneCountryCode: '+7',
    deviceId: 'cb5f32ec-d2ce-8222-e11b-ad7fb71169b7',
    agreementId: 'privacy',
    agreementVersion: '20260107',
  });
  assert.deepEqual(leadRequest.headers, {
    'content-type': 'application/json',
    'x-chj-metadata': '{"code":"google_kz"}',
    'x-chj-sourceurl': runtimeConfig.sourceUrl,
    'x-chj-traceid': '6336a5234d7b2ba6e67d6c1396f918da',
  });
  assert.equal('consent' in leadRequest.payload, false);
});

test('lead source may come from an allowlisted channel query parameter', () => {
  assert.equal(
    resolveLeadSource(
      'https://www-ontest.liauto.com/ru_kz/drive/reserve.html?chjchannelcode=meta_ads_kz',
    ),
    'meta_ads_kz',
  );
  assert.throws(
    () => resolveLeadSource('https://www-ontest.liauto.com/ru_kz/drive/reserve.html'),
    (error) => error instanceof TestDriveError && error.type === 'configuration',
  );
});

test('device and trace identifiers use the documented GUID and trace shapes', () => {
  const cryptoImpl = {
    getRandomValues(bytes) {
      bytes.forEach((value, index) => {
        bytes[index] = index;
      });
      return bytes;
    },
  };
  assert.equal(createDeviceId(cryptoImpl), '00010203-0405-0607-0809-0a0b0c0d0e0f');
  assert.equal(createTraceId(cryptoImpl), '000102030405060708090a0b0c0d0e0f');
});

test('unconfirmed language, model, and store values fail before a network request', () => {
  assert.throws(
    () => buildLeadRequest(formValues, { ...runtimeConfig, leadsLanguage: 'en' }),
    /Unsupported leadsLanguage/,
  );
  assert.throws(
    () => buildLeadRequest({ ...formValues, model: 'l5' }, runtimeConfig),
    /Unmapped Test Drive model/,
  );
  assert.throws(
    () => buildLeadRequest({ ...formValues, store: 'doscar-shymkent' }, runtimeConfig),
    /Unmapped Test Drive store/,
  );
});

test('queryStores calls the read-only KZ endpoint and normalizes its response', async () => {
  const calls = [];
  const client = createTestDriveApiClient({
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return jsonResponse({
        code: 0,
        data: {
          storeCodes: [
            { code: 'KZ_VLPYHG', name: 'Allur Almaty' },
            { code: 'KZ_XKJQZM', name: 'Allur Astana' },
          ],
        },
        msg: 'SUCCESS',
      });
    },
  });

  assert.deepEqual(await client.queryStores('kz'), [
    { code: 'KZ_VLPYHG', name: 'Allur Almaty' },
    { code: 'KZ_XKJQZM', name: 'Allur Astana' },
  ]);
  assert.equal(
    calls[0].url,
    'https://bcs-api-web-ontest-b.liauto.com/saos-global-leads-api/leads/query-store-list?countryCode=KZ',
  );
  assert.equal(calls[0].options.credentials, 'include');
  assert.deepEqual(calls[0].options.headers, { accept: 'application/json' });
});

test('lead add and captcha retry use separate endpoints and authorization', async () => {
  const calls = [];
  const responses = [
    jsonResponse({ code: 600003, data: null, msg: 'CHALLENGE_REQUIRED' }),
    jsonResponse({ code: 0, data: { leadId: 'redacted' }, msg: 'SUCCESS' }),
  ];
  const client = createTestDriveApiClient({
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return responses.shift();
    },
  });

  await assert.rejects(client.addLead(leadRequest), isChallengeRequiredError);
  assert.deepEqual(
    await client.addLeadWithCaptcha(leadRequest, 'challenge-token-for-contract-test'),
    { leadId: 'redacted' },
  );

  assert.equal(
    calls[0].url,
    'https://bcs-api-web-ontest-b.liauto.com/saos-global-leads-api/leads/add',
  );
  assert.equal(
    calls[1].url,
    'https://bcs-api-web-ontest-b.liauto.com/saos-global-leads-api/leads/add-with-captcha',
  );
  assert.equal(
    calls[1].options.headers['Challenge-Authorization'],
    'Bearer challenge-token-for-contract-test',
  );
  assert.equal(calls[0].options.body, calls[1].options.body);
});

test('API errors are typed and unapproved origins or empty captcha tokens never fetch', async () => {
  let callCount = 0;
  const client = createTestDriveApiClient({
    fetchImpl: async () => {
      callCount += 1;
      return jsonResponse({ code: 400001, data: null, msg: 'INVALID_REQUEST' });
    },
  });

  await assert.rejects(
    client.addLead(leadRequest),
    (error) => error instanceof TestDriveError
      && error.type === 'api'
      && error.code === 400001
      && error.message === 'Test Drive API request failed',
  );
  await assert.rejects(
    client.addLeadWithCaptcha(leadRequest, ''),
    (error) => error instanceof TestDriveError && error.type === 'configuration',
  );
  assert.equal(callCount, 1);
  assert.throws(
    () => createTestDriveApiClient({ baseUrl: 'https://example.com' }),
    /Unapproved Test Drive API origin/,
  );
});

test('malformed JSON is a typed API error without response content', async () => {
  const client = createTestDriveApiClient({
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('invalid server response');
      },
    }),
  });

  await assert.rejects(
    client.queryStores('KZ'),
    (error) => error instanceof TestDriveError
      && error.type === 'api'
      && error.status === 200
      && error.message === 'Invalid Test Drive API response',
  );
});
