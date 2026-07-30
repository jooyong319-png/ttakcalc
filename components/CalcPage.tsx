import type { ReactNode } from 'react';

/** 계산기 페이지 공통 껍데기 — 제목·설명·계산기·FAQ·적용기준을 같은 순서로 배치한다. */
export function CalcPage({
  title, lead, children, faqs, basisItems, verifiedAt,
}: {
  title: string;
  lead: ReactNode;
  children: ReactNode;
  faqs: { q: string; a: string }[];
  basisItems: string[];
  verifiedAt: string;
}) {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, '\\u003c') }} />
      <div className="container" style={{ padding: '1.6rem 1.1rem 0' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900 }}>{title}</h1>
        <p style={{ color: 'var(--text-soft)', margin: '0.5rem 0 1.3rem' }}>{lead}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>{children}</div>

        {faqs.length > 0 && (
          <section style={{ marginTop: '2.2rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '0.9rem' }}>자주 묻는 질문</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {faqs.map(f => (
                <details key={f.q} style={{
                  background: 'var(--bg-elev)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '0.8rem 1rem',
                }}>
                  <summary style={{ fontWeight: 700, cursor: 'pointer' }}>{f.q}</summary>
                  <p style={{ color: 'var(--text-soft)', margin: '0.6rem 0 0', fontSize: '0.92rem' }}>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.7rem' }}>계산에 적용된 기준</h2>
          <ul style={{ color: 'var(--text-soft)', fontSize: '0.9rem', paddingLeft: '1.1rem', margin: 0 }}>
            {basisItems.map(b => <li key={b}>{b}</li>)}
          </ul>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.83rem', marginTop: '0.7rem' }}>
            최종 확인일 {verifiedAt}. 제도가 바뀌면 기준도 함께 갱신하고, 무엇이 바뀌었는지{' '}
            <a href="/changes" style={{ color: 'var(--accent)', fontWeight: 600 }}>제도 변화</a>에 기록합니다.
          </p>
        </section>
      </div>
    </>
  );
}
