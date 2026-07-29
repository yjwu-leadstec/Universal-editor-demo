import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLeadRequest,
  createDeviceId,
  createTestDriveApiClient,
  createTraceId,
  isChallengeRequiredError,
  isTestDriveError,
  resolveLeadSource,
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

function jsonResponse(body, { status = 200 } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
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
    (error) => isTestDriveError(error) && error.type === 'configuration',
  );
});

test('device and trace identifiers use the documented GUID and trace shapes', () => {
  assert.match(createDeviceId(), /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/);
  assert.match(createTraceId(), /^[0-9a-f]{32}$/);
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
  let requestSeen = false;
  const client = createTestDriveApiClient({
    fetchImpl: async (url, options) => {
      if (!options) throw new Error('Missing request options');
      requestSeen = true;
      assert.equal(
        String(url),
        'https://bcs-api-web-ontest-b.liauto.com/saos-global-leads-api/leads/query-store-list?countryCode=KZ',
      );
      assert.equal(options.credentials, 'include');
      assert.deepEqual(options.headers, { accept: 'application/json' });
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
  assert.equal(requestSeen, true);
});

test('lead add and captcha retry use separate endpoints and authorization', async () => {
  let callCount = 0;
  let addBody = '';
  const client = createTestDriveApiClient({
    fetchImpl: async (url, options) => {
      if (!options) throw new Error('Missing request options');
      callCount += 1;
      if (callCount === 1) {
        assert.equal(
          String(url),
          'https://bcs-api-web-ontest-b.liauto.com/saos-global-leads-api/leads/add',
        );
        addBody = String(options.body);
        return jsonResponse({ code: 600003, data: null, msg: 'CHALLENGE_REQUIRED' });
      }
      assert.equal(
        String(url),
        'https://bcs-api-web-ontest-b.liauto.com/saos-global-leads-api/leads/add-with-captcha',
      );
      if (!options.headers) throw new Error('Missing request headers');
      const headers = new Headers(options.headers);
      assert.equal(
        headers.get('Challenge-Authorization'),
        'Bearer challenge-token-for-contract-test',
      );
      assert.equal(String(options.body), addBody);
      return jsonResponse({ code: 0, data: { leadId: 'redacted' }, msg: 'SUCCESS' });
    },
  });

  await assert.rejects(client.addLead(leadRequest), isChallengeRequiredError);
  assert.deepEqual(
    await client.addLeadWithCaptcha(leadRequest, 'challenge-token-for-contract-test'),
    { leadId: 'redacted' },
  );
  assert.equal(callCount, 2);
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
    (error) => isTestDriveError(error)
      && error.type === 'api'
      && error.code === 400001
      && error.message === 'Test Drive API request failed',
  );
  await assert.rejects(
    client.addLeadWithCaptcha(leadRequest, ''),
    (error) => isTestDriveError(error) && error.type === 'configuration',
  );
  assert.equal(callCount, 1);
  assert.throws(
    () => createTestDriveApiClient({ baseUrl: 'https://example.com' }),
    /Unapproved Test Drive API origin/,
  );
});

test('malformed JSON is a typed API error without response content', async () => {
  const client = createTestDriveApiClient({
    fetchImpl: async () => new Response('invalid server response', { status: 200 }),
  });

  await assert.rejects(
    client.queryStores('KZ'),
    (error) => isTestDriveError(error)
      && error.type === 'api'
      && error.status === 200
      && error.message === 'Invalid Test Drive API response',
  );
});
