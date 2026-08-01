'use client';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

/** 라이트/다크 수동 전환. 선택은 localStorage에 남기고, 선택 전에는 OS 설정을 따른다.
 *  실제 적용은 <html data-theme>이며 초기값은 layout의 인라인 스크립트가 미리 심는다(FOUC 방지). */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme | null);
    const current = saved
      ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(current);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch { /* ignore */ }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      aria-label={theme === 'dark' ? '밝은 화면으로 전환' : '어두운 화면으로 전환'}
      title={theme === 'dark' ? '밝은 화면' : '어두운 화면'}
    >
      {/* 하이드레이션 전에는 아무것도 안 그려 서버/클라 불일치를 피한다 */}
      {theme === null ? '' : theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
