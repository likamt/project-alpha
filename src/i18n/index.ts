import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';

const resources = {
  ar: { translation: ar },
  fr: { translation: fr },
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
};

// Get saved language or detect from browser
const getSavedLanguage = (): string => {
  const saved = localStorage.getItem('language');
  if (saved && ['ar', 'fr', 'en', 'es', 'de'].includes(saved)) {
    return saved;
  }
  
  // Detect browser language
  const browserLang = navigator.language.split('-')[0];
  if (['ar', 'fr', 'en', 'es', 'de'].includes(browserLang)) {
    return browserLang;
  }
  
  return 'ar'; // Default to Arabic
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

// Set initial direction
document.documentElement.dir = getSavedLanguage() === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = getSavedLanguage();

export default i18n;

export const languages = [
  { code: 'ar', name: 'العربية', flag: '🇲🇦', dir: 'rtl' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
];
