/**
 * Terms and Conditions - content loader
 * Maps language code to the appropriate terms file
 */

import termsEn from './terms-en';
import termsEs from './terms-es';
import termsCa from './terms-ca';

export type TermsContent = typeof termsEn;

const termsByLang: Record<string, TermsContent> = {
  en: termsEn,
  es: termsEs,
  ca: termsCa,
};

export function getTerms(lang: string): TermsContent {
  return termsByLang[lang] ?? termsEn;
}
