import { ConfigProvider, ThemeProvider } from '@lobehub/ui';
import { ToastHost } from '@lobehub/ui/base-ui';
import { motion } from 'motion/react';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './global.css';

type ThemeMode = 'light' | 'dark';

const Root = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );

  // Provider order per docs: ConfigProvider must wrap ThemeProvider.
  return (
    <ConfigProvider motion={motion}>
      <ThemeProvider themeMode={themeMode}>
        <ToastHost position="top-right" />
        <App
          themeMode={themeMode}
          onToggleTheme={() => setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'))}
        />
      </ThemeProvider>
    </ConfigProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
