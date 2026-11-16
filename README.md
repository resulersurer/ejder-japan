# EJDER JAPAN

Angular uygulaması. Mevcut Japonya DMC tasarımı, TR/EN içerik, mobil menü ve üç rota detayı korunur. Tailwind CSS derleme sırasında üretilir.

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

Form şu an doğrulanmış bilgileri önizler; e-posta göndermez veya veri kaydetmez. Yandex posta kutusu ve sunucu tarafı gönderim entegrasyonu sonraki aşamadır. Parola veya SMTP kimlik bilgilerini frontend koduna eklemeyin.
