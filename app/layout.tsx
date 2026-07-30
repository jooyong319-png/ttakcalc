import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://ttakcalc.com'),
  title: {
    default: '딱계산 — 연봉·세금·부동산 계산기',
    template: '%s | 딱계산',
  },
  description:
    '연봉 실수령액, 퇴직금, 세금을 근거까지 보여주며 계산합니다. 제도가 바뀌면 바로 반영하고, 무엇이 어떻게 바뀌었는지도 알려드립니다.',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1319' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="inner">
            <a href="/" className="wordmark">딱<span>계산</span></a>
            <nav style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', fontSize: '0.92rem', fontWeight: 600 }}>
              <a href="/calc/salary">연봉</a>
              <a href="/changes">제도 변화</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            <p style={{ margin: 0 }}>
              계산 결과는 참고용 추정치입니다. 실제 원천징수액은 국세청 간이세액표·회사 정책에 따라
              다를 수 있고, 연말정산으로 정산됩니다.
            </p>
            <p style={{ margin: '0.5rem 0 0' }}>© 2026 딱계산</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
