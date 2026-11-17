import { content as base } from './content';
import ja from './locales/ja.json';
import zh from './locales/zh-CN.json';
import es from './locales/es.json';
import ko from './locales/ko.json';

export const languageOptions = [
  { code: 'tr', label: 'Türkçe' }, { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' }, { code: 'zh-CN', label: '简体中文' },
  { code: 'es', label: 'Español' }, { code: 'ko', label: '한국어' },
] as const;
export type Language = typeof languageOptions[number]['code'];
export const isLanguage = (value: string | null): value is Language => languageOptions.some(option => option.code === value);

const trUI = {
  language_label: 'Site dili', menu_label: 'Menü', close_label: 'Kapat',
  ph_agency: 'Örn: ABC Turizm / Ahmet Yılmaz', ph_email: 'operasyon@acenteniz.com',
  ph_notes: 'Örn: 4 yıldızlı merkezi oteller, 1 gece Hakone Ryokan konaklaması, rehberlik tercihiniz…',
  airport_tokyo_osaka: 'Tokyo Giriş → Osaka Çıkış', airport_tokyo_tokyo: 'Tokyo Giriş → Tokyo Çıkış',
  airport_osaka_tokyo: 'Osaka Giriş → Tokyo Çıkış', airport_undecided: 'Henüz Netleşmedi',
  summary_type: 'Talep türü', summary_agency: 'Acente / İsim', summary_email: 'E-posta', summary_date: 'Tarih',
  summary_pax: 'Kişi sayısı', summary_airport: 'Uçuş hattı', summary_notes: 'Notlar',
  registered_label: 'JAPONYA TESCİLLİ ŞİRKET', rights: 'Tüm hakları saklıdır.',
};
const enUI: Record<keyof typeof trUI, string> = {
  language_label: 'Site language', menu_label: 'Menu', close_label: 'Close',
  ph_agency: 'E.g. ABC Travel / Alex Smith', ph_email: 'operations@youragency.com',
  ph_notes: 'E.g. central 4-star hotels, one night at a Hakone ryokan, guide preferences…',
  airport_tokyo_osaka: 'Tokyo Arrival → Osaka Departure', airport_tokyo_tokyo: 'Tokyo Arrival → Tokyo Departure',
  airport_osaka_tokyo: 'Osaka Arrival → Tokyo Departure', airport_undecided: 'To be confirmed',
  summary_type: 'Inquiry type', summary_agency: 'Agency / Name', summary_email: 'Email', summary_date: 'Date',
  summary_pax: 'Guests', summary_airport: 'Routing', summary_notes: 'Notes',
  registered_label: 'REGISTERED IN JAPAN', rights: 'All rights reserved.',
};

type TranslationKey = keyof typeof base.translations.tr | keyof typeof trUI;
type Translations = Record<TranslationKey, string>;
const translations: Record<Language, Translations> = {
  tr: { ...base.translations.tr, ...trUI }, en: { ...base.translations.en, ...enUI },
  ja: { ...ja.translations, ...ja.ui }, 'zh-CN': { ...zh.translations, ...zh.ui },
  es: { ...es.translations, ...es.ui }, ko: { ...ko.translations, ...ko.ui },
};

interface LocalizedRoute { badge: string; title: string; days: string[][]; }
function routeDetails(route: LocalizedRoute, language: Language) {
  const dayLabel = (day: number) => {
    switch (language) {
      case 'ja': return `${day}日目`;
      case 'zh-CN': return `第${day}天`;
      case 'ko': return `${day}일차`;
      default: return `Día ${day}`;
    }
  };
  return { badge: route.badge, title: route.title, days: route.days.map(([title, desc], i) => ({ day: dayLabel(i + 1), title, desc })) };
}

function allRouteLanguages(route: keyof typeof base.itineraryData) {
  return {
    ...base.itineraryData[route],
    ja: routeDetails(ja.itineraries[route], 'ja'), 'zh-CN': routeDetails(zh.itineraries[route], 'zh-CN'),
    es: routeDetails(es.itineraries[route], 'es'), ko: routeDetails(ko.itineraries[route], 'ko'),
  };
}

export const content = {
  translations,
  itineraryData: { golden: allRouteLanguages('golden'), sakura: allRouteLanguages('sakura'), momiji: allRouteLanguages('momiji') },
};

const airportKeys: Record<string, keyof typeof trUI> = {
  'Tokyo (NRT/HND) Giriş - Osaka (KIX) Çıkış': 'airport_tokyo_osaka',
  'Tokyo (NRT/HND) Giriş - Tokyo Çıkış': 'airport_tokyo_tokyo',
  'Osaka (KIX) Giriş - Tokyo (NRT/HND) Çıkış': 'airport_osaka_tokyo',
  'Henüz Netleşmedi': 'airport_undecided',
};

export function inquiryValue(key: string, value: string, language: Language): string {
  const text = translations[language];
  if (key === 'airport' && airportKeys[value]) return text[airportKeys[value]];
  if (key === 'inquiryType') {
    if (value === 'B2B Acente İş Birliği / Grup Turu') return text.opt_b2b;
    if (value === 'Özel Grup / VIP Tailor-Made') return text.opt_private;
  }
  if (key === 'travelDate' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat(language, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z'));
  }
  return value || '—';
}
