import type { ReactNode } from 'react';
import type { Tone } from '@/lib/catalog';
import styles from './CalcPage.module.css';

/** 계산기 페이지 공통 껍데기 — 제목·계산·문답·적용기준 순으로 놓는다.
 *  category는 홈의 컬러 블록과 같은 갈래라서, 어디서 들어왔든 위치를 잃지 않게 한다. */
export function CalcPage({
  category, tone, title, lead, children, faqs, basisItems, verifiedAt, year,
}: {
  category: string;
  tone: Tone;
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

      <div className={`container-narrow ${styles[tone]}`} style={{ paddingTop: '1.8rem' }}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>
            <a href="/" className={styles.category}>{category}</a>
            <span aria-hidden="true"> · </span>{year}년 기준
          </p>
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
            <span className="stamp">확인 {verifiedAt}</span>
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
