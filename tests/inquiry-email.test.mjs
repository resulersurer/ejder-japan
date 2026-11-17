import test from 'node:test';
import assert from 'node:assert/strict';
import { renderInquiryEmail } from '../server/inquiry-email.mjs';

test('email safely renders contact details, multiline notes and reply link', () => {
  const html = renderInquiryEmail({ agencyName: 'Agency <img src=x onerror=alert(1)> & Partners', email: "o'connor@example.com", travelDate: '2027-04-10', paxCount: 15, inquiryType: 'B2B', airport: 'Tokyo → Osaka', notes: 'First line\n<script>alert(1)</script>\nSecond line' });
  assert.ok(html.includes('10.04.2027'));
  assert.ok(html.includes('15 kişi'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt; &amp; Partners'));
  assert.ok(html.includes('First line<br>&lt;script&gt;alert(1)&lt;/script&gt;<br>Second line'));
  assert.ok(html.includes('mailto:o&#39;connor%40example.com?subject='));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<script>'));
});

test('empty optional notes show a readable fallback', () => {
  const html = renderInquiryEmail({ agencyName: 'Test Agency', email: 'test@example.com', travelDate: '2027-04-10', paxCount: 15, inquiryType: 'B2B', airport: 'Tokyo', notes: '' });
  assert.ok(html.includes('Özel not eklenmedi.'));
  assert.ok(html.includes('EJDER JAPAN K.K. (株式会社)'));
});
