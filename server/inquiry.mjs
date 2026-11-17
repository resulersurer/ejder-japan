import nodemailer from 'nodemailer';

const mailbox = 'info@ejderjapan.com';
const maxBytes = 24_000;
const inquiryTypes = ['B2B Acente İş Birliği / Grup Turu', 'Özel Grup / VIP Tailor-Made'];
const airports = [
  'Tokyo (NRT/HND) Giriş - Osaka (KIX) Çıkış',
  'Tokyo (NRT/HND) Giriş - Tokyo Çıkış',
  'Osaka (KIX) Giriş - Tokyo (NRT/HND) Çıkış',
  'Henüz Netleşmedi',
];
const json = (status, code) => Response.json(
  status === 200 ? { ok: true } : { ok: false, code },
  { status, headers: { 'Cache-Control': 'no-store', ...(status === 405 ? { Allow: 'POST' } : {}) } },
);

async function readBody(request) {
  if (Number(request.headers.get('content-length')) > maxBytes) throw new RangeError();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError();
  let size = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new RangeError(); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const clean = {};
  for (const [key, limit] of Object.entries({ inquiryType: 80, agencyName: 160, email: 254, travelDate: 10, airport: 120, notes: 5000 })) {
    const value = body[key] ?? '';
    if (typeof value !== 'string' || value.length > limit || value.includes('\0')) return null;
    clean[key] = value.trim();
  }
  if (body.website !== undefined && body.website !== '') return null;
  if (!inquiryTypes.includes(clean.inquiryType) || !airports.includes(clean.airport)) return null;
  if (!clean.agencyName || /[\r\n]/.test(clean.agencyName)) return null;
  if (!/^[^\s<>@,;:]+@[^\s<>@,;:]+\.[^\s<>@,;:]+$/.test(clean.email)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean.travelDate)) return null;
  const date = new Date(clean.travelDate + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== clean.travelDate) return null;
  if (typeof body.paxCount !== 'string' && typeof body.paxCount !== 'number') return null;
  const pax = String(body.paxCount);
  if (!/^\d{1,3}$/.test(pax) || Number(pax) < 2 || Number(pax) > 200) return null;
  clean.paxCount = Number(pax);
  return clean;
}

export function createInquiryHandler({ env = process.env, createTransport = nodemailer.createTransport } = {}) {
  return async function handleInquiry(request) {
    if (request.method !== 'POST') return json(405, 'METHOD_NOT_ALLOWED');
    const origin = request.headers.get('origin');
    if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
      return json(403, 'ORIGIN_NOT_ALLOWED');
    }
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return json(415, 'JSON_REQUIRED');
    let body;
    try { body = await readBody(request); }
    catch (error) { return json(error instanceof RangeError ? 413 : 400, 'INVALID_REQUEST'); }
    const data = validate(body);
    if (!data) return json(400, 'INVALID_FIELDS');
    if (!env.SMTP_PASSWORD || env.SMTP_USER?.toLowerCase() !== mailbox) return json(503, 'MAIL_NOT_CONFIGURED');

    const transport = createTransport({
      host: 'smtp.yandex.com', port: 465, secure: true,
      auth: { user: mailbox, pass: env.SMTP_PASSWORD },
      connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 20000,
      disableFileAccess: true, disableUrlAccess: true,
    });
    try {
      const result = await transport.sendMail({
        from: { name: 'EJDER JAPAN K.K. — Website', address: mailbox },
        to: mailbox,
        replyTo: { name: data.agencyName, address: data.email },
        subject: 'EJDER JAPAN — Yeni Teklif / İş Birliği Talebi',
        text: [
          'EJDER JAPAN K.K. (株式会社) — Web Formu', '',
          `Talep türü / Inquiry type: ${data.inquiryType}`,
          `Acente / Agency: ${data.agencyName}`,
          `E-posta / Email: ${data.email}`,
          `Giriş tarihi / Arrival: ${data.travelDate}`,
          `Kişi sayısı / Guests: ${data.paxCount}`,
          `Uçuş hattı / Routing: ${data.airport}`, '',
          'Notlar / Notes:', data.notes || '—',
        ].join('\n'),
      });
      if (!result.accepted?.some(address => String(address).toLowerCase() === mailbox)) return json(502, 'MAIL_REJECTED');
      return json(200);
    } catch (error) {
      // Do not log SMTP responses, credentials, or personal form data.
      const safeCode = ['EAUTH', 'ECONNECTION', 'ETIMEDOUT', 'EENVELOPE', 'ESOCKET'].includes(error.code) ? error.code : 'MAIL_ERROR';
      console.error('Inquiry delivery failed:', safeCode);
      return json(502, 'MAIL_FAILED');
    } finally { transport.close(); }
  };
}
