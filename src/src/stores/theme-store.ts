import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'zh';

interface ThemeState {
  theme: Theme;
  language: Language | null; // null 表示使用系统语言
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  getEffectiveTheme: () => 'light' | 'dark';
  getEffectiveLanguage: () => Language;
}

// 获取系统主题偏好
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// 获取系统语言偏好
const getSystemLanguage = (): Language => {
  if (typeof window !== 'undefined' && navigator.language) {
    const systemLang = navigator.language.toLowerCase();
    if (systemLang.startsWith('zh')) {
      return 'zh';
    }
  }
  return 'en';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      language: null, // 初始为 null，表示首次启动使用系统语言

      setTheme: (theme) => {
        set({ theme });
        // 立即应用主题
        applyTheme(theme);
      },

      setLanguage: (language) => {
        set({ language });
      },

      getEffectiveTheme: () => {
        const { theme } = get();
        if (theme === 'system') {
          return getSystemTheme();
        }
        return theme;
      },

      getEffectiveLanguage: () => {
        const { language } = get();
        // 如果用户设置了语言偏好，使用用户设置；否则使用系统语言
        return language ?? getSystemLanguage();
      },
    }),
    {
      name: 'cc-permission-manager-settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // 恢复后立即应用主题
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// 应用主题到 DOM
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// 监听系统主题变化
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useThemeStore.getState();
    if (theme === 'system') {
      applyTheme('system');
    }
  });
}
