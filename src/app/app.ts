import { DOCUMENT } from '@angular/common';
import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { content, languageOptions, isLanguage, inquiryValue, type Language } from './localization';

type Route = keyof typeof content.itineraryData;

@Component({ selector: 'app-root', standalone: true, templateUrl: './app.html' })
export class App {
  private readonly document = inject(DOCUMENT);
  private previousFocus: HTMLElement | null = null;
  private previousOverflow = '';
  private submittedData: FormData | null = null;
  readonly language = signal<Language>('tr');
  readonly languageOptions = languageOptions;
  readonly menuOpen = signal(false);
  readonly activeRoute = signal<Route | null>(null);
  readonly summary = signal<{ label: string; value: string }[] | null>(null);
  readonly sending = signal(false);
  readonly submissionError = signal('');
  readonly itinerary = computed(() => {
    const route = this.activeRoute();
    return route ? content.itineraryData[route][this.language()] : null;
  });

  constructor() {
    try {
      const saved = this.document.defaultView?.localStorage.getItem('ejder-japan-language') ?? null;
      if (isLanguage(saved)) this.setLanguage(saved);
    } catch { /* The site also works when browser storage is unavailable. */ }
  }

  t(key: string): string {
    return (content.translations[this.language()] as Record<string, string>)[key] ?? key;
  }

  setLanguage(language: Language): void {
    this.language.set(language);
    this.document.documentElement.lang = language;
    this.document.title = `EJDER JAPAN K.K. | ${this.t('hero_title')}`;
    this.document.querySelector('meta[name="description"]')?.setAttribute('content', this.t('hero_subtitle'));
    try { this.document.defaultView?.localStorage.setItem('ejder-japan-language', language); } catch { /* Optional preference storage. */ }
    if (this.submittedData) this.updateSummary(this.submittedData);
  }

  changeLanguage(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (isLanguage(value)) this.setLanguage(value);
  }

  toggleMobileMenu(): void { this.menuOpen.update(open => !open); }

  openItineraryModal(route: Route): void {
    this.previousFocus = this.document.activeElement as HTMLElement;
    this.previousOverflow = this.document.body.style.overflow;
    this.activeRoute.set(route);
    this.document.body.style.overflow = 'hidden';
    setTimeout(() => this.document.querySelector<HTMLElement>('#itinerary-modal button')?.focus());
  }

  closeItineraryModal(): void {
    this.activeRoute.set(null);
    this.document.body.style.overflow = this.previousOverflow;
    this.previousFocus?.focus();
  }

  backdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeItineraryModal();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.activeRoute()) return;
    if (event.key === 'Escape') this.closeItineraryModal();
    if (event.key !== 'Tab') return;
    const elements = this.document.querySelectorAll<HTMLElement>('#itinerary-modal button, #itinerary-modal a[href]');
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && this.document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && this.document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  async submitInquiry(event: Event): Promise<void> {
    event.preventDefault();
    if (this.sending()) return;
    const form = event.target as HTMLFormElement;
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const payload: Record<string, FormDataEntryValue> = {};
    formData.forEach((value, key) => { payload[key] = value; });
    this.submissionError.set('');
    this.sending.set(true);
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        this.submissionError.set(response.status === 400 ? 'form_invalid' : 'form_error');
        return;
      }
      this.submittedData = formData;
      this.updateSummary(formData);
      setTimeout(() => this.document.querySelector<HTMLElement>('#form-confirmation')?.focus());
    } catch {
      this.submissionError.set('form_error');
    } finally {
      this.sending.set(false);
    }
  }

  private updateSummary(data: FormData): void {
    const keys = ['inquiryType', 'agencyName', 'email', 'travelDate', 'paxCount', 'airport', 'notes'];
    const labels = ['summary_type', 'summary_agency', 'summary_email', 'summary_date', 'summary_pax', 'summary_airport', 'summary_notes'];
    this.summary.set(keys.map((key, i) => ({ label: this.t(labels[i]), value: inquiryValue(key, String(data.get(key) || ''), this.language()) })));
  }

  resetInquiryForm(): void {
    this.document.querySelector<HTMLFormElement>('#inquiry-form')?.reset();
    this.summary.set(null);
    this.submittedData = null;
    this.submissionError.set('');
    setTimeout(() => this.document.querySelector<HTMLElement>('#agencyName')?.focus());
  }

  imageFallback(event: Event, source: string): void {
    const image = event.target as HTMLImageElement;
    if (image.src !== source) image.src = source;
  }
}
