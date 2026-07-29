/* eslint-disable no-console */
import {
  buildLeadRequest,
  createTestDriveApiClient,
  isChallengeRequiredError,
} from '../blocks/lixiang-test-drive-booking/test-drive-api.js';

const allowWrite = process.argv.includes('--allow-write');
const client = createTestDriveApiClient();
const countryCode = process.env.TEST_DRIVE_COUNTRY_CODE || 'KZ';

const stores = await client.queryStores(countryCode);
console.log(`Read-only store query succeeded: ${stores.length} store(s)`);
stores.forEach(({ code, name }) => console.log(`- ${code}: ${name}`));

if (!allowWrite) {
  console.log('Write smoke skipped. Pass --allow-write with complete TEST_DRIVE_* values to continue.');
  process.exit(0);
}

const leadRequest = buildLeadRequest({
  name: process.env.TEST_DRIVE_CUSTOMER_NAME,
  model: process.env.TEST_DRIVE_MODEL_KEY,
  store: process.env.TEST_DRIVE_STORE_KEY,
  email: process.env.TEST_DRIVE_EMAIL,
  phone: process.env.TEST_DRIVE_PHONE || '',
  countryCode: process.env.TEST_DRIVE_PHONE_COUNTRY_CODE,
}, {
  sourceUrl: process.env.TEST_DRIVE_SOURCE_URL,
  leadSource: process.env.TEST_DRIVE_LEAD_SOURCE,
  leadsLanguage: process.env.TEST_DRIVE_LANGUAGE,
  countryCode,
  phoneCountryCode: process.env.TEST_DRIVE_PHONE_COUNTRY_CODE,
  agreementId: process.env.TEST_DRIVE_AGREEMENT_ID,
  agreementVersion: process.env.TEST_DRIVE_AGREEMENT_VERSION,
});

try {
  await client.addLead(leadRequest);
  console.log('Lead add smoke succeeded.');
} catch (error) {
  if (!isChallengeRequiredError(error)) throw error;
  const challengeToken = process.env.TEST_DRIVE_CHALLENGE_TOKEN;
  if (!challengeToken) {
    console.log('Lead add reached challenge code 600003. Captcha retry skipped: no token supplied.');
    process.exitCode = 2;
  } else {
    await client.addLeadWithCaptcha(leadRequest, challengeToken);
    console.log('Captcha lead retry smoke succeeded.');
  }
}
