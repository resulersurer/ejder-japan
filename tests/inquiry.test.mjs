import test from 'node:test';
import assert from 'node:assert/strict';
import { createInquiryHandler } from '../server/inquiry.mjs';

const valid = {
  inquiryType: 'B2B Acente İş Birliği / Grup Turu', agencyName: 'Test Agency',
  email: 'visitor@example.com', travelDate: '2027-04-10', paxCount: '15',
  airport: 'Tokyo (NRT/HND) Giriş - Osaka (KIX) Çıkış', notes: '4 yıldızlı oteller', website: '',
};
const configured = { SMTP_USER: 'info@ejderjapan.com', SMTP_PASSWORD: 'test-only-password' };
const request = (body = valid, headers = {}) => new Request('https://ejderjapan.com/api/inquiry', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://ejderjapan.com', ...headers },
  body: JSON.stringify(body),
});

test('only reports success after SMTP acceptance; fixed recipient and customer reply-to', async () => {
  let message;
  let transportClosed = false;
  const handler = createInquiryHandler({ env: configured, createTransport(options) {
    assert.equal(options.host, 'smtp.yandex.com');
    assert.equal(options.secure, true);
    assert.equal(options.port, 465);
    return { async sendMail(mail) {
      message = mail;
      return { accepted: ['info@ejderjapan.com'] };
    }, close() { transportClosed = true; } };
  } });
  const response = await handler(request({ ...valid, to: 'attacker@example.com', notes: '<script>alert(1)</script>' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(message.to, 'info@ejderjapan.com');
  assert.equal(message.from.address, 'info@ejderjapan.com');
  assert.equal(message.replyTo.address, valid.email);
  assert.ok(message.text.includes(valid.agencyName));
  assert.ok(message.text.includes(valid.travelDate));
  assert.ok(message.text.includes(valid.paxCount));
  assert.ok(message.text.includes('<script>alert(1)</script>'));
  assert.equal(message.html, undefined);
  assert.equal(transportClosed, true);
});

test('invalid or malicious input never invokes SMTP', async () => {
  const handler = createInquiryHandler({ env: configured, createTransport() { assert.fail('SMTP must not be invoked'); } });
  for (const data of [
    { ...valid, email: 'a@example.com\r\nBcc: injected@example.com' },
    { ...valid, agencyName: '' },
    { ...valid, agencyName: ['not a string'] },
    { ...valid, travelDate: '2027-02-30' },
    { ...valid, travelDate: 'not-a-date' },
    { ...valid, paxCount: '1' },
    { ...valid, paxCount: '201' },
    { ...valid, paxCount: '2.5' },
    { ...valid, airport: 'unknown' },
    { ...valid, inquiryType: 'unknown' },
    { ...valid, notes: 'x'.repeat(5001) },
    { ...valid, website: 'spam.test' },
    null,
  ]) assert.equal((await handler(request(data))).status, 400);
  assert.equal((await handler(request(valid, { Origin: 'https://unrelated.example' }))).status, 403);
  assert.equal((await handler(request(valid, { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal((await handler(request({ ...valid, notes: 'x'.repeat(30000) }))).status, 413);
  assert.equal((await handler(new Request('https://ejderjapan.com/api/inquiry'))).status, 405);
  assert.equal((await handler(new Request('https://ejderjapan.com/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }))).status, 400);
});

test('missing SMTP configuration is unavailable rather than successful', async () => {
  const handler = createInquiryHandler({ env: {}, createTransport() { assert.fail('SMTP must not be invoked'); } });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, code: 'MAIL_NOT_CONFIGURED' });
});

test('SMTP errors and rejected recipients never produce a success confirmation', async () => {
  for (const sendMail of [async () => ({ accepted: [], rejected: ['info@ejderjapan.com'] }), async () => { throw Object.assign(new Error('test rejection'), { code: 'EAUTH' }); }]) {
    let closed = false;
    const handler = createInquiryHandler({ env: configured, createTransport: () => ({ sendMail, close() { closed = true; } }) });
    const response = await handler(request());
    assert.equal(response.status, 502);
    assert.equal((await response.json()).ok, false);
    assert.equal(closed, true);
  }
});
