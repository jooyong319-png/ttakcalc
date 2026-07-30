import type { ReactNode } from 'react';
import styles from './CalcPage.module.css';

/** 계산기 페이지 공통 껍데기 — 서식 문서처럼 제목·전표·문답·적용기준 순으로 놓는다. */
export function CalcPage({
  docNo, title, lead, children, faqs, basisItems, verifiedAt, year,
}: {
  docNo: string;
  title: string;
  lead: ReactNode;
  children: ReactNode;
  faqs: { q: string; a: string }[];
  basisItems: string[];
  verifiedAt: string;
  year: string;
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

      <div className="container" style={{ paddingTop: '1.6rem' }}>
        <header className={styles.head}>
          <p className={styles.docNo}>No. {docNo} · {year}년 기준</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.lead}>{lead}</p>
        </header>

        <div className={styles.body}>{children}</div>

        {faqs.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
            {faqs.map(f => (
              <details key={f.q} className={styles.faq}>
                <summary className={styles.faqQ}>{f.q}</summary>
                <p className={styles.faqA}>{f.a}</p>
              </details>
            ))}
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>계산에 적용된 기준</h2>
          <ul className={styles.basisList}>
            {basisItems.map(b => <li key={b}>{b}</li>)}
          </ul>
          <div className={styles.verified}>
            <span className="stamp">확 인<br />{verifiedAt}</span>
            <p className={styles.verifiedNote}>
              공식 고시를 대조해 관리합니다. 제도가 바뀌면 기준도 함께 갱신하고,
              무엇이 바뀌었는지 <a href="/changes">제도 변화</a>에 기록합니다.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
