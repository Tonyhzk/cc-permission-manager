import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import zh from './zh.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

// 检测系统语言
const getSystemLanguage = (): string => {
  const systemLang = navigator.language.toLowerCase();
  if (systemLang.startsWith('zh')) {
    return 'zh';
  }
  return 'en';
};

// 从 localStorage 读取保存的语言设置
const getSavedLanguage = (): string => {
  try {
    const stored = localStorage.getItem('cc-permission-manager-settings');
    if (stored) {
      const { state } = JSON.parse(stored);
      // 如果用户设置了语言偏好，使用用户设置；否则使用系统语言
      return state?.language ?? getSystemLanguage();
    }
  } catch {
    // 忽略解析错误
  }
  return getSystemLanguage();
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
