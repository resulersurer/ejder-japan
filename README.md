# EJDER JAPAN

Angular uygulaması. Türkçe, İngilizce, Japonca, Basitleştirilmiş Çince, İspanyolca ve Korece içerik; mobil menü ve üç rota detayı içerir. Tailwind CSS derleme sırasında üretilir.

Dil seçimi tarayıcıda hatırlanır. Yeni dillerin metinleri `src/app/locales/` altında bulunur; form seçeneklerinin sunucuya gönderilen değerleri sabit tutularak e-posta entegrasyonuyla uyum korunur. Operasyon ekibinin üç iletişim dili bilgisi, web sitesinin altı görüntüleme dilinden bağımsızdır.

## Yerel çalışma

Node.js 22.12+ veya 24 kullanın.

```sh
npm ci
npm start
```

## Derleme ve Vercel

```sh
npm run build
```

Vercel framework: **Angular**. Build command: `npm run build`. Output: `dist/ejder-japan/browser`. Ayarlar `vercel.json` içinde tanımlıdır. Önceden panelde tanımlanan `.` output override değerini kaldırın veya bu dizine güncelleyin.

Domain bağlantısı Vercel projesinde korunur. Bu dönüşüm DNS ayarlarını değiştirmez.

## İletişim formu

Form `/api/inquiry` Vercel Function'ına POST yapar. Doğrulanmış talepler Yandex SMTP (`smtp.yandex.com:465`, TLS) üzerinden yalnızca `info@ejderjapan.com` adresine gönderilir. Yanıtla adresi müşterinin e-postasıdır. SMTP kabulü alınmadan başarı gösterilmez; hata durumunda form bilgileri korunur.

Vercel Project Settings → Environment Variables bölümüne Production ortamı için ekleyin:

- `SMTP_USER`: `info@ejderjapan.com`
- `SMTP_PASSWORD`: Yandex ID → Uygulama şifreleri → Mail bölümünden oluşturulan uygulama şifresi (Secret/Sensitive).

Yandex Mail ayarlarında e-posta istemcileri ve uygulama şifreleri erişimi açık olmalıdır. https://yandex.com/support/yandex-360/business/mail/en/mail-clients/others

Şifreyi frontend koduna veya Git'e eklemeyin. Değişkenler eklendikten sonra yeniden deploy edin. Vercel Function'ı yerelde çalıştırmak için `vercel dev` kullanılır; `npm start` yalnızca Angular arayüzünü sunar. E-posta servisi testi gerçek SMTP kimlik bilgileri gerektirir.

`npm test` ile giriş doğrulama, alıcı sabitleme ve SMTP hata yolları test edilir; bu testler gerçek e-posta göndermez.
