const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function renderInquiryEmail(data) {
  const safe = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, escapeHtml(value)]));
  const arrival = escapeHtml(data.travelDate.split('-').reverse().join('.'));
  const replyLink = escapeHtml(`mailto:${encodeURIComponent(data.email)}?subject=${encodeURIComponent('EJDER JAPAN — Japonya Seyahat Talebiniz')}`);
  const row = (label, value, last = false) => `<tr><td style="padding:16px 20px;${last ? '' : 'border-bottom:1px solid #e9e3db;'}">
    <p style="margin:0 0 6px;font-size:11px;line-height:16px;font-weight:bold;letter-spacing:1px;color:#78716c;text-transform:uppercase;">${label}</p>
    <p style="margin:0;font-size:15px;line-height:24px;color:#111827;word-break:break-word;overflow-wrap:anywhere;">${value}</p>
  </td></tr>`;

  return `<!doctype html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><title>EJDER JAPAN — Yeni Talep</title></head>
<body style="margin:0;padding:0;background-color:#f3efea;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;color:#f3efea;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${safe.agencyName} • ${safe.paxCount} kişi • ${arrival} — Yeni Japonya seyahat talebi.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3efea" style="background-color:#f3efea;"><tr><td align="center" style="padding:32px 12px;">
    <!--[if mso]><table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background-color:#ffffff;border:1px solid #e7e0d6;border-radius:16px;">
      <tr><td bgcolor="#111827" style="padding:28px 24px;background-color:#111827;border-radius:16px 16px 0 0;border-bottom:4px solid #b91c1c;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="46" height="46" align="center" bgcolor="#b91c1c" style="width:46px;height:46px;background-color:#b91c1c;border-radius:10px;color:#ffffff;font-size:25px;font-family:Georgia,serif;">龍</td>
          <td style="padding-left:14px;"><p style="margin:0;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:28px;font-weight:bold;letter-spacing:1px;">EJDER JAPAN</p><p style="margin:5px 0 0;color:#d1c7b7;font-size:10px;line-height:16px;letter-spacing:2px;">K.K. (株式会社) &nbsp;·&nbsp; TOKYO DMC</p></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:30px 24px 24px;">
        <p style="margin:0 0 10px;color:#b91c1c;font-size:11px;line-height:18px;letter-spacing:2px;font-weight:bold;">WEB SİTESİNDEN YENİ TALEP</p>
        <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:36px;color:#111827;">Japonya yolculuğu<br>burada başlıyor.</h1>
        <p style="margin:0;color:#57534e;font-size:15px;line-height:25px;"><strong style="color:#111827;">${safe.agencyName}</strong> yeni bir teklif veya iş birliği talebi iletti. İletişim ve seyahat bilgilerini aşağıda bulabilirsiniz.</p>
      </td></tr>
      <tr><td style="padding:0 24px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#faf8f5" style="background-color:#faf8f5;border:1px solid #e9e3db;border-radius:10px;">
          ${row('Talep türü / Inquiry type', safe.inquiryType)}
          ${row('Acente / İletişim kişisi', safe.agencyName)}
          ${row('E-posta adresi', `<a href="${replyLink}" style="color:#b91c1c;text-decoration:underline;word-break:break-all;">${safe.email}</a>`)}
          ${row('Tahmini giriş tarihi', arrival)}
          ${row('Misafir sayısı', `${safe.paxCount} kişi`)}
          ${row('Giriş / Çıkış hattı', safe.airport, true)}
        </table>
      </td></tr>
      <tr><td style="padding:0 24px 28px;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:16px;line-height:24px;">Program detayları &amp; özel notlar</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#faf8f5" style="padding:18px 20px;background-color:#faf8f5;border-left:3px solid #b91c1c;color:#57534e;font-size:14px;line-height:24px;word-break:break-word;overflow-wrap:anywhere;">${safe.notes ? safe.notes.replace(/\r\n|\r|\n/g, '<br>') : 'Özel not eklenmedi.'}</td></tr></table>
      </td></tr>
      <tr><td align="center" style="padding:0 24px 30px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#b91c1c" style="background-color:#b91c1c;border-radius:8px;mso-padding-alt:15px 26px;"><a href="${replyLink}" style="display:inline-block;padding:15px 26px;color:#ffffff;font-size:14px;line-height:20px;font-weight:bold;text-decoration:none;border:1px solid #b91c1c;border-radius:8px;">Müşteriye Yanıtla &nbsp; →</a></td></tr></table>
        <p style="margin:14px 0 0;color:#78716c;font-size:12px;line-height:20px;">E-posta uygulamanızdaki “Yanıtla” seçeneğini de kullanabilirsiniz.</p>
      </td></tr>
      <tr><td bgcolor="#faf8f5" style="padding:22px 24px;background-color:#faf8f5;border-top:1px solid #e9e3db;border-radius:0 0 16px 16px;">
        <p style="margin:0 0 7px;color:#111827;font-size:12px;line-height:20px;font-weight:bold;">EJDER JAPAN K.K. (株式会社)</p>
        <p style="margin:0;color:#78716c;font-size:11px;line-height:19px;">Shibuya Miyata Building · 1-12-14 Jinnan Shibuyaku<br>Tokyo 150-0041 · Japan</p>
        <p style="margin:12px 0 0;color:#78716c;font-size:11px;line-height:19px;">Bu bildirim <a href="https://ejderjapan.com" style="color:#b91c1c;text-decoration:none;">ejderjapan.com</a> iletişim formundan oluşturulmuştur.</p>
      </td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr></table>
</body></html>`;
}
