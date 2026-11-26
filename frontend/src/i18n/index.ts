import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import { PUBLIC_LANG_KEY } from '../utils/storage';

const savedLang = (typeof window !== 'undefined' ? localStorage.getItem(PUBLIC_LANG_KEY) : null) || 'en';

if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLang;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi }
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
});

export const changeLanguage = (lang: 'en' | 'hi') => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PUBLIC_LANG_KEY, lang);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
  return i18n.changeLanguage(lang);
};

export default i18n;
