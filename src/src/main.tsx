import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './locales/i18n';
import './index.css';

// 初始化主题（在 React 渲染之前）
const initTheme = () => {
  const stored = localStorage.getItem('cc-permission-manager-settings');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      const theme = state?.theme || 'system';
      const effectiveTheme =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;
      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } catch {
      // 忽略解析错误
    }
  }
};

initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
