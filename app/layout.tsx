import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { SiteNav } from '@/components/SiteNav';
import './globals.css';

/* 숫자 전용 등폭. 계산기라 자릿수가 흔들리면 안 되고, 0에 슬래시가 있어 6/8과 헷갈리지 않는다. */
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--f-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ttakcalc.com'),
  title: {
    default: '딱계산 — 연봉·세금·부동산 계산기',
    template: '%s | 딱계산',
  },
  description:
    '연봉 실수령액, 퇴직금, 세금을 근거까지 명세서처럼 보여드립니다. 제도가 바뀌면 바로 반영하고, 무엇이 어떻게 바뀌었는지도 알려드립니다.',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f4f5' },
    { media: '(prefers-color-scheme: dark)', color: '#131316' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 저장된 테마를 하이드레이션 전에 심어 <html> 속성이 서버 렌더와 달라지므로 경고를 억제한다
    <html lang="ko" className={mono.variable} suppressHydrationWarning>
      <head>
        {/* Pretendard 가변 폰트 — public에서 그대로 서빙한다(외부 CDN 없음).
            한글 서브셋 @font-face가 92개라 번들러에 물리면 파서 스택이 터진다.
            dynamic subset이라 브라우저는 실제로 쓰인 유니코드 범위만 내려받는다. */}
        <link rel="stylesheet" href="/fonts/pretendard/pretendard.css" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <SiteNav />

        <main>{children}</main>

        <footer className="site-footer">
          <div className="container">
            <p>
              * 계산 결과는 참고용 추정치입니다. 실제 원천징수액은 국세청 간이세액표·회사 정책에 따라
              달라질 수 있고, 연말정산으로 정산됩니다.
            </p>
            <p>* 요율·세율은 공식 고시를 대조해 관리하며, 변경 이력은 제도 변화 페이지에 남깁니다.</p>
            <p className="num" style={{ marginTop: '0.9rem' }}>© 2026 TTAKCALC</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
