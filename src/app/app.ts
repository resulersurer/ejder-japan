import { DOCUMENT } from '@angular/common';
import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { content } from './content';

type Language = keyof typeof content.translations;
type Route = keyof typeof content.itineraryData;

@Component({ selector: 'app-root', standalone: true, templateUrl: './app.html' })
export class App {
  private readonly document = inject(DOCUMENT);
  private previousFocus: HTMLElement | null = null;
  private previousOverflow = '';
  readonly language = signal<Language>('tr');
  readonly menuOpen = signal(false);
  readonly activeRoute = signal<Route | null>(null);
  readonly summary = signal<{ label: string; value: string }[] | null>(null);
  readonly itinerary = computed(() => {
    const route = this.activeRoute();
    return route ? content.itineraryData[route][this.language()] : null;
  });

  t(key: string): string {
    return (content.translations[this.language()] as Record<string, string>)[key] ?? key;
  }

  setLanguage(language: Language): void {
    this.language.set(language);
    this.document.documentElement.lang = language;
    if (this.summary()) this.updateSummary(this.document.querySelector<HTMLFormElement>('#inquiry-form')!);
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

  previewInquiry(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    if (form.reportValidity()) this.updateSummary(form);
  }

  private updateSummary(form: HTMLFormElement): void {
    const data = new FormData(form);
    const keys = ['inquiryType', 'agencyName', 'email', 'travelDate', 'paxCount', 'airport', 'notes'];
    const labels = this.language() === 'tr'
      ? ['Talep türü', 'Acente / İsim', 'E-posta', 'Tarih', 'Kişi sayısı', 'Uçuş hattı', 'Notlar']
      : ['Inquiry type', 'Agency / Name', 'Email', 'Date', 'Guests', 'Routing', 'Notes'];
    this.summary.set(keys.map((key, i) => ({ label: labels[i], value: String(data.get(key) || '—') })));
  }

  resetInquiryForm(): void { this.summary.set(null); }

  imageFallback(event: Event, source: string): void {
    const image = event.target as HTMLImageElement;
    if (image.src !== source) image.src = source;
  }
}
