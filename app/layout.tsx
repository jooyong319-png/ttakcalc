import type { Metadata, Viewport } from 'next';
import './globals.css';

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
    { media: '(prefers-color-scheme: light)', color: '#f6f3ec' },
    { media: '(prefers-color-scheme: dark)', color: '#16150f' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="inner">
            <a href="/" className="wordmark">
              딱<b>계산</b><small>ttakcalc</small>
            </a>
            <nav className="site-nav">
              <a href="/calc/salary">연봉</a>
              <a href="/changes">제도 변화</a>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="container">
            <p>
              * 계산 결과는 참고용 추정치입니다. 실제 원천징수액은 국세청 간이세액표·회사 정책에 따라
              달라질 수 있고, 연말정산으로 정산됩니다.
            </p>
            <p>* 요율·세율은 공식 고시를 대조해 관리하며, 변경 이력은 제도 변화 페이지에 남깁니다.</p>
            <p className="num" style={{ marginTop: '0.9rem', opacity: 0.7 }}>© 2026 TTAKCALC</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
